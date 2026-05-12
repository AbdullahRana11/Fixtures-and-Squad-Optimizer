/**
 * match-predictor.ts
 * 
 * Match Intelligence Engine.
 * Computes win probability, expected goals (xG), possession,
 * clean sheet %, and synthetic form data for any fixture.
 * 
 * Model: Weighted composite of 6 factors → Elo-style normalization
 */

import teamMetricsJson from '../data/team-metrics.json';

const teamMetrics = teamMetricsJson as Record<string, { 
  rating: number; 
  lastSeason: { gf: number; ga: number; gd: number; cs: number; pos: number };
  league?: string;
}>;

export interface TeamProfile {
  name: string;
  league: string;
  overallStrength: number;    // 1-100 scale (from dataset or tier)
  homeAdvantage: number;      // multiplier from dataset
  recentForm: number;         // synthetic 0-10 rating
  isHome: boolean;
  rivalryFactor: number;      // 0 = no rivalry, 1 = biggest rival, 0.5 = other rival
  fatigueIndex: number;       // 0 = fully rested, 1 = fatigued
}

export interface TeamStats {
  gf: number;
  ga: number;
  gd: number;
  cs: number;
  pos?: number;
}

export type BroadcasterSlot =
  | 'Friday Night Football'      // PL
  | 'Super Sunday'               // PL
  | 'Monday Night Football'      // PL
  | 'Saturday Night Football'    // PL
  | 'Saturday Night Lights'      // PL
  | 'Midweek Blockbuster'        // PL/UCL
  | 'Early Kick-Off'             // PL
  | 'Viernes Noche'              // La Liga
  | 'El Gran Derbi'              // La Liga derby
  | 'Sabado Premier'             // La Liga
  | 'Posticipo Domenicale'       // Serie A
  | 'Topspiel'                   // Bundesliga
  | 'Freitagsspiel'              // Bundesliga
  | 'Amazon Prime Exclusive'     // UCL/PL
  | 'TNT Sports Total'           // UCL
  | 'Standard Slot';             // fallback

export interface ProjectedScoreline {
  most_likely: string;           // e.g. '1-0'
  alternatives: string[];        // e.g. ['2-0', '1-1']
  home_cs_probability: number;   // 0-1
  away_cs_probability: number;
}

export interface MatchPrediction {
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  homeXG: number;
  awayXG: number;
  homePossession: number;
  awayPossession: number;
  homeCleanSheet: number;
  awayCleanSheet: number;
  homeForm: number[];
  awayForm: number[];
  keyInsight: string;
  matchIntensity: 'Low' | 'Medium' | 'High' | 'Extreme';
  projectedScoreline: ProjectedScoreline;
  broadcasterSlot: BroadcasterSlot;
  derbyModifierApplied: boolean;
  
  // Historical & Season Stats
  homeLastSeason: TeamStats;
  awayLastSeason: TeamStats;
  homeThisSeason: TeamStats;
  awayThisSeason: TeamStats;
}

const LEAGUE_TIER_STRENGTH: Record<string, number> = {
  'Premier League': 82,
  'La Liga': 80,
  'Serie A': 78,
  'Bundesliga': 79,
  'Ligue 1': 74,
  'Champions League': 85,
  'Championship': 65,
  'League One': 55,
  'League Two': 48,
  // Cricket
  'psl': 78,
  'ipl': 85,
  'bbl': 75,
  'cpl': 72,
  'sa20': 74,
  'icc-t20wc': 88,
  'icc-odi-wc': 90,
};

const CL_POT_STRENGTH: Record<string, number> = {
  'Pot 1': 92, 'Pot 2': 85, 'Pot 3': 78, 'Pot 4': 72,
};

function eloExpected(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function generateForm(strength: number): number[] {
  const form: number[] = [];
  for (let i = 0; i < 5; i++) {
    const roll = Math.random() * 100;
    const winThreshold = strength * 0.65;
    if (roll < winThreshold) form.push(3);
    else if (roll < winThreshold + 20) form.push(1);
    else form.push(0);
  }
  return form;
}

function generateInsight(h: TeamProfile, a: TeamProfile, hw: number, aw: number): string {
  const diff = Math.abs(hw - aw);
  if (h.rivalryFactor >= 0.8) return `🔥 Intense derby — history and rivalry supersede current form. Expect fireworks.`;
  if (diff > 50) return `${hw > aw ? h.name : a.name} are overwhelming analytical favorites here.`;
  if (diff < 10) return `Razor-tight contest. Both sides are evenly matched on all metrics.`;
  if (h.fatigueIndex > 0.6) return `⚠️ ${h.name} carry significant fatigue risk entering this fixture.`;
  if (a.fatigueIndex > 0.6) return `⚠️ ${a.name} may be affected by fixture congestion.`;
  return `${hw > aw ? h.name : a.name} hold the analytical edge — xG, form and home advantage align.`;
}

// ── Poisson distribution approximation for scoreline ─────────────────
function poissonProb(lambda: number, k: number): number {
  // P(X=k) = e^(-λ) * λ^k / k!
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return Math.exp(-lambda) * Math.pow(lambda, k) / factorial;
}

function projectScoreline(homeXG: number, awayXG: number, homeCS: number, awayCS: number): ProjectedScoreline {
  const maxGoals = 5;
  let bestProb = 0;
  let mostLikely = '1-0';
  const alternatives: { score: string; prob: number }[] = [];

  for (let hg = 0; hg <= maxGoals; hg++) {
    for (let ag = 0; ag <= maxGoals; ag++) {
      // Chaos factor: adjust score probability for high-intensity matches
      const prob = poissonProb(homeXG, hg) * poissonProb(awayXG, ag);
      const score = `${hg}-${ag}`;
      alternatives.push({ score, prob });
      if (prob > bestProb) { bestProb = prob; mostLikely = score; }
    }
  }

  alternatives.sort((a, b) => b.prob - a.prob);

  return {
    most_likely: mostLikely,
    alternatives: alternatives.slice(1, 4).map(a => a.score),
    home_cs_probability: homeCS / 100,
    away_cs_probability: awayCS / 100,
  };
}

// ── Broadcaster slot assignment ────────────────────────────────────
function assignBroadcasterSlot(
  h: TeamProfile,
  a: TeamProfile,
  intensity: string,
  league: string,
  fixtureData?: { broadcaster?: string }
): BroadcasterSlot {
  if (fixtureData?.broadcaster) {
    if (fixtureData.broadcaster.includes('Amazon Prime')) return 'Amazon Prime Exclusive';
    if (fixtureData.broadcaster.includes('TNT Sports')) return 'TNT Sports Total';
    if (fixtureData.broadcaster.includes('Super Sunday')) return 'Super Sunday';
    if (fixtureData.broadcaster.includes('Friday Night')) return 'Friday Night Football';
    if (fixtureData.broadcaster.includes('Monday Night')) return 'Monday Night Football';
    if (fixtureData.broadcaster.includes('Saturday Night Football')) return 'Saturday Night Football';
    if (fixtureData.broadcaster.includes('Saturday Night Lights')) return 'Saturday Night Lights';
    if (fixtureData.broadcaster.includes('Early Kick-Off')) return 'Early Kick-Off';
  }

  const isDerby = h.rivalryFactor >= 0.8;
  const isHigh = intensity === 'High' || intensity === 'Extreme';

  // Premier League
  if (league === 'Premier League' || league === 'pl') {
    if (isDerby) return 'Super Sunday';
    if (isHigh) return 'Saturday Night Football';
    return 'Standard Slot';
  }
  // La Liga
  if (league === 'La Liga' || league === 'laliga') {
    if (isDerby) return 'El Gran Derbi';
    if (isHigh) return 'Sabado Premier';
    return 'Viernes Noche';
  }
  // Serie A
  if (league === 'Serie A' || league === 'seriea') {
    return isHigh ? 'Posticipo Domenicale' : 'Standard Slot';
  }
  // Bundesliga
  if (league === 'Bundesliga' || league === 'bundesliga') {
    return isHigh ? 'Topspiel' : 'Freitagsspiel';
  }
  // Cricket-specific logic
  if (['psl', 'ipl', 'bbl', 'cpl', 'sa20', 'icc-t20wc', 'icc-odi-wc'].includes(league)) {
    if (isDerby) return 'Midweek Blockbuster'; // Or "Super Over Sunday"?
    if (isHigh) return 'Amazon Prime Exclusive';
    return 'Standard Slot';
  }

  if (isHigh || isDerby) return 'Midweek Blockbuster';
  return 'Standard Slot';
}

export class MatchPredictor {
  static predict(home: TeamProfile, away: TeamProfile, fixtureData?: { broadcaster?: string }): MatchPrediction {
    // 1. COMPOSITE RATINGS
    const homeBase = 1000 + (home.overallStrength * 10);
    const awayBase = 1000 + (away.overallStrength * 10);

    const homeRating = homeBase + (home.isHome ? home.homeAdvantage * 50 : 0) + (home.recentForm * 5) - (home.fatigueIndex * 30);
    const awayRating = awayBase + (away.recentForm * 5) - (away.fatigueIndex * 30);

    // 2. PROBABILITIES — with Derby Chaos Modifier
    const homeExp = eloExpected(homeRating, awayRating);
    const awayExp = eloExpected(awayRating, homeRating);
    const drawBase = 0.25 - (Math.abs(homeExp - awayExp) * 0.1);
    let drawProb = Math.max(0.1, Math.min(0.3, drawBase));

    // Derby chaos: compress to near 33/33/33 distribution
    const isDerby = home.rivalryFactor >= 0.8;
    if (isDerby) {
      drawProb = Math.min(0.35, drawProb + 0.10);
    }

    let hw = Math.round((homeExp * (1 - drawProb)) * 100);
    let dw = Math.round(drawProb * 100);
    let aw = 100 - hw - dw;

    // Derby chaos: narrow the gap between teams
    if (isDerby) {
      const avg = (hw + aw) / 2;
      hw = Math.round(hw * 0.7 + avg * 0.3);
      aw = 100 - hw - dw;
    }

    // 3. STATS
    const homeXG = Math.round((2.5 * 0.55 * (homeExp * 2)) * 10) / 10;
    const awayXG = Math.round((2.5 * 0.45 * (awayExp * 2)) * 10) / 10;
    const homePoss = Math.round(Math.max(30, Math.min(70, homeExp * 100)));
    const homeCS = Math.round(Math.max(5, Math.min(60, (1 - awayXG / 3) * 60)));
    const awayCS = Math.round(Math.max(5, Math.min(45, (1 - homeXG / 3) * 45)));

    const intensity: 'Low' | 'Medium' | 'High' | 'Extreme' =
      isDerby ? 'Extreme'
      : Math.abs(hw - aw) > 40 ? 'Low'
      : Math.abs(hw - aw) > 20 ? 'Medium'
      : 'High';

    // 4. Poisson scoreline projection
    const projectedScoreline = projectScoreline(homeXG, awayXG, homeCS, awayCS);

    // 5. Broadcaster slot
    const broadcasterSlot = assignBroadcasterSlot(home, away, intensity, home.league, fixtureData);

    // 6. HISTORICAL LOOKUP
    const hMetric = teamMetrics[home.name];
    const aMetric = teamMetrics[away.name];
    const defaultStats: TeamStats = { gf: 0, ga: 0, gd: 0, cs: 0 };

    return {
      homeTeam: home.name,
      awayTeam: away.name,
      homeWin: hw,
      draw: dw,
      awayWin: aw,
      homeXG,
      awayXG,
      homePossession: homePoss,
      awayPossession: 100 - homePoss,
      homeCleanSheet: homeCS,
      awayCleanSheet: awayCS,
      homeForm: generateForm(home.overallStrength),
      awayForm: generateForm(away.overallStrength),
      keyInsight: generateInsight(home, away, hw, aw),
      matchIntensity: intensity,
      projectedScoreline,
      broadcasterSlot,
      derbyModifierApplied: isDerby,
      homeLastSeason: hMetric?.lastSeason || defaultStats,
      awayLastSeason: aMetric?.lastSeason || defaultStats,
      homeThisSeason: defaultStats,
      awayThisSeason: defaultStats,
    };
  }

  static buildProfile(name: string, league: string, isHome: boolean, options?: any): TeamProfile {
    const metric = teamMetrics[name];
    const strength = metric?.rating 
      || (options?.pot ? CL_POT_STRENGTH[options.pot] : null) 
      || LEAGUE_TIER_STRENGTH[league] 
      || 70;

    // Apply FPL squad strength bonus if provided
    const squadBonus = options?.squadStrength ? (options.squadStrength - 75) * 0.1 : 0;
    // Apply form bonus from simulation engine
    const formBonus = options?.recentFormBonus || 0;

    return {
      name,
      league,
      overallStrength: Math.min(100, strength + squadBonus),
      homeAdvantage: options?.homeAdvantage || 1.1,
      recentForm: Math.max(0, Math.min(10, 5 + Math.random() * 3 + formBonus)),
      isHome,
      rivalryFactor: options?.rivalryFactor || 0,
      fatigueIndex: options?.fatigueIndex || 0,
    };
  }
}
