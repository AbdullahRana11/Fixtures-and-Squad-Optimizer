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
  if (h.rivalryFactor >= 0.8) return `🔥 Intense derby — form goes out the window. High stakes.`;
  if (diff > 50) return `${hw > aw ? h.name : a.name} are overwhelming favorites here.`;
  if (diff < 10) return `Razor-tight contest. Both sides are evenly matched.`;
  if (h.fatigueIndex > 0.6) return `${h.name} face potential fatigue issues.`;
  return `${hw > aw ? h.name : a.name} hold the analytical edge in this encounter.`;
}

export class MatchPredictor {
  static predict(home: TeamProfile, away: TeamProfile): MatchPrediction {
    // 1. COMPOSITE RATINGS
    const homeBase = 1000 + (home.overallStrength * 10);
    const awayBase = 1000 + (away.overallStrength * 10);

    const homeRating = homeBase + (home.isHome ? home.homeAdvantage * 50 : 0) + (home.recentForm * 5) - (home.fatigueIndex * 30);
    const awayRating = awayBase + (away.recentForm * 5) - (away.fatigueIndex * 30);

    // 2. PROBABILITIES
    const homeExp = eloExpected(homeRating, awayRating);
    const awayExp = eloExpected(awayRating, homeRating);
    const drawBase = 0.25 - (Math.abs(homeExp - awayExp) * 0.1);
    const drawProb = Math.max(0.1, Math.min(0.3, drawBase));

    let hw = Math.round((homeExp * (1 - drawProb)) * 100);
    let dw = Math.round(drawProb * 100);
    let aw = 100 - hw - dw;

    // 3. STATS
    const homeXG = Math.round((2.5 * 0.55 * (homeExp * 2)) * 10) / 10;
    const awayXG = Math.round((2.5 * 0.45 * (awayExp * 2)) * 10) / 10;
    const homePoss = Math.round(Math.max(30, Math.min(70, homeExp * 100)));
    const homeCS = Math.round(Math.max(5, Math.min(60, (1 - awayXG / 3) * 60)));
    const awayCS = Math.round(Math.max(5, Math.min(45, (1 - homeXG / 3) * 45)));

    // 4. HISTORICAL LOOKUP
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
      matchIntensity: home.rivalryFactor >= 0.8 ? 'Extreme' : (Math.abs(hw - aw) > 40 ? 'Low' : 'High'),
      
      homeLastSeason: hMetric?.lastSeason || defaultStats,
      awayLastSeason: aMetric?.lastSeason || defaultStats,
      homeThisSeason: defaultStats, // Gameweek 1 default
      awayThisSeason: defaultStats
    };
  }

  static buildProfile(name: string, league: string, isHome: boolean, options?: any): TeamProfile {
    const metric = teamMetrics[name];
    const strength = metric?.rating 
      || (options?.pot ? CL_POT_STRENGTH[options.pot] : null) 
      || LEAGUE_TIER_STRENGTH[league] 
      || 70;

    return {
      name,
      league,
      overallStrength: strength,
      homeAdvantage: options?.homeAdvantage || 1.1,
      recentForm: 5 + Math.random() * 3,
      isHome,
      rivalryFactor: options?.rivalryFactor || 0,
      fatigueIndex: options?.fatigueIndex || 0,
    };
  }
}
