/**
 * simulation-engine.ts
 *
 * What-If / Butterfly Effect Engine.
 * Accepts a full SeasonSchedule + forced results,
 * recalculates standings and fatigue, and identifies
 * matches whose predicted outcome changes as a result.
 */

import { SeasonSchedule, FixtureMatch, ForcedResult } from '../types';
import { MatchPredictor } from './match-predictor';

export interface TeamStanding {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  rank: number;
  rankChange: number;   // +/- vs pre-simulation
}

export interface ButterflyEffect {
  fixtureId: string;
  matchweek: number;
  home: string;
  away: string;
  originalFavorite: string;
  newFavorite: string;
  reason: string;
}

export interface FatigueWarning {
  team: string;
  matchweeks: number[];
  gamesInWindow: number;
  severity: 'moderate' | 'high' | 'critical';
}

export interface SimulationResult {
  standings: TeamStanding[];
  butterflyEffects: ButterflyEffect[];
  fatigueWarnings: FatigueWarning[];
  forcedResults: ForcedResult[];
  summary: {
    teamsAffected: number;
    rankChanges: number;
    predictionsFlipped: number;
    fatigueRisks: number;
  };
}

// ── Standing calculation ─────────────────────────────────────────────
function calculateStandings(
  fixtures: FixtureMatch[],
  results: Map<string, { homeGoals: number; awayGoals: number }>,
  teams: string[]
): TeamStanding[] {
  const stats = new Map<string, { w: number; d: number; l: number; gf: number; ga: number; p: number }>();
  teams.forEach(t => stats.set(t, { w: 0, d: 0, l: 0, gf: 0, ga: 0, p: 0 }));

  for (const fixture of fixtures) {
    const result = results.get(fixture.id);
    if (!result) continue;

    const { homeGoals: hg, awayGoals: ag } = result;
    const home = stats.get(fixture.home);
    const away = stats.get(fixture.away);
    if (!home || !away) continue;

    home.gf += hg; home.ga += ag;
    away.gf += ag; away.ga += hg;

    if (hg > ag) {
      home.w++; home.p += 3; away.l++;
    } else if (hg < ag) {
      away.w++; away.p += 3; home.l++;
    } else {
      home.d++; away.d++; home.p++; away.p++;
    }
  }

  const table: Omit<TeamStanding, 'rank' | 'rankChange'>[] = [...stats.entries()].map(([team, s]) => ({
    team,
    played: s.w + s.d + s.l,
    wins: s.w,
    draws: s.d,
    losses: s.l,
    gf: s.gf,
    ga: s.ga,
    gd: s.gf - s.ga,
    points: s.p,
  }));

  table.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

  return table.map((t, i) => ({ ...t, rank: i + 1, rankChange: 0 }));
}

// ── Fatigue analysis: ≥3 games in 10 days = warning ─────────────────
function analyzeFatigue(fixtures: FixtureMatch[], teams: string[]): FatigueWarning[] {
  const warnings: FatigueWarning[] = [];

  for (const team of teams) {
    const teamFixtures = fixtures
      .filter(f => f.home === team || f.away === team)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (let i = 0; i < teamFixtures.length - 2; i++) {
      const windowStart = new Date(teamFixtures[i].date).getTime();
      const windowEnd = windowStart + 10 * 24 * 60 * 60 * 1000; // 10 days

      const inWindow = teamFixtures.filter(f =>
        new Date(f.date).getTime() >= windowStart &&
        new Date(f.date).getTime() <= windowEnd
      );

      if (inWindow.length >= 3) {
        const matchweeks = inWindow.map(f => f.matchweek);
        const existing = warnings.find(w => w.team === team);
        if (!existing) {
          warnings.push({
            team,
            matchweeks: [...new Set(matchweeks)],
            gamesInWindow: inWindow.length,
            severity: inWindow.length >= 5 ? 'critical' : inWindow.length >= 4 ? 'high' : 'moderate',
          });
        }
      }
    }
  }

  return warnings;
}

// ── Predict favorite for a fixture based on current form ─────────────
function predictFavorite(fixture: FixtureMatch, league: string): string {
  const home = MatchPredictor.buildProfile(fixture.home, league, true);
  const away = MatchPredictor.buildProfile(fixture.away, league, false);
  const pred = MatchPredictor.predict(home, away);
  if (pred.homeWin > pred.awayWin && pred.homeWin > pred.draw) return fixture.home;
  if (pred.awayWin > pred.homeWin && pred.awayWin > pred.draw) return fixture.away;
  return 'Draw';
}

// ── MAIN ENGINE ───────────────────────────────────────────────────────
export class SimulationEngine {
  static simulate(
    schedule: any, // Can be SeasonSchedule or SwissSchedule
    forcedResults: ForcedResult[]
  ): SimulationResult {
    // Normalize schedule: Swiss model uses .matches, standard league uses .fixtures
    const fixtures: FixtureMatch[] = schedule.fixtures || schedule.matches || [];
    const teams: string[] = schedule.teams || (schedule.standings ? schedule.standings.map((s: any) => s.team) : []);
    const league: string = schedule.league || (schedule.format === 'swiss-model' ? 'ucl-swiss' : 'unknown');

    if (fixtures.length === 0) {
      throw new Error('Simulation failed: No fixtures found in schedule');
    }

    // 1. Build synthetic "expected" results from predictor (pre-sim)
    const expectedResults = new Map<string, { homeGoals: number; awayGoals: number }>();
    for (const fixture of fixtures) {
      const home = MatchPredictor.buildProfile(fixture.home, league, true);
      const away = MatchPredictor.buildProfile(fixture.away, league, false);
      const pred = MatchPredictor.predict(home, away);
      // Synthetic scoreline from xG
      const hg = Math.round(pred.homeXG * (0.8 + Math.random() * 0.4));
      const ag = Math.round(pred.awayXG * (0.8 + Math.random() * 0.4));
      expectedResults.set(fixture.id, { homeGoals: hg, awayGoals: ag });
    }

    // 2. Pre-simulation standings
    const preStandings = calculateStandings(fixtures, expectedResults, teams);
    const preRankMap = new Map(preStandings.map(s => [s.team, s.rank]));

    // 3. Apply forced results (override expected)
    const forcedMap = new Map(forcedResults.map(r => [r.fixtureId, r]));
    const simulatedResults = new Map(expectedResults);
    forcedMap.forEach((result, id) => {
      simulatedResults.set(id, { homeGoals: result.homeGoals, awayGoals: result.awayGoals });
    });

    // 4. Post-simulation standings
    const postStandings = calculateStandings(fixtures, simulatedResults, teams);
    const finalStandings = postStandings.map(s => ({
      ...s,
      rankChange: (preRankMap.get(s.team) || s.rank) - s.rank,
    }));

    // 5. Find butterfly effects — upcoming matches whose predicted winner changed
    const forcedFixtureIds = new Set(forcedResults.map(r => r.fixtureId));
    const upcomingFixtures = fixtures.filter(f => !forcedFixtureIds.has(f.id));

    // Build pre/post form maps based on standings
    const preFormMap = new Map(preStandings.map(s => [s.team, s.points]));
    const postFormMap = new Map(finalStandings.map(s => [s.team, s.points]));

    const butterflyEffects: ButterflyEffect[] = [];
    for (const fixture of upcomingFixtures.slice(0, 50)) {
      const preFav = predictFavorite(fixture, league);

      // Recalculate with adjusted form based on point difference
      const homePoints = postFormMap.get(fixture.home) || 0;
      const awayPoints = postFormMap.get(fixture.away) || 0;
      const preHomePoints = preFormMap.get(fixture.home) || 0;
      const preAwayPoints = preFormMap.get(fixture.away) || 0;

      const homeFormShift = homePoints - preHomePoints;
      const awayFormShift = awayPoints - preAwayPoints;

      const homeProfile = MatchPredictor.buildProfile(fixture.home, league, true, {
        recentFormBonus: homeFormShift * 0.1,
      });
      const awayProfile = MatchPredictor.buildProfile(fixture.away, league, false, {
        recentFormBonus: awayFormShift * 0.1,
      });
      const postPred = MatchPredictor.predict(homeProfile, awayProfile);

      let postFav: string;
      if (postPred.homeWin > postPred.awayWin && postPred.homeWin > postPred.draw) postFav = fixture.home;
      else if (postPred.awayWin > postPred.homeWin && postPred.awayWin > postPred.draw) postFav = fixture.away;
      else postFav = 'Draw';

      if (preFav !== postFav) {
        const shifter = homeFormShift !== 0 ? fixture.home : fixture.away;
        const shiftVal = Math.abs(homeFormShift || awayFormShift);
        
        butterflyEffects.push({
          fixtureId: fixture.id,
          matchweek: fixture.matchweek,
          home: fixture.home,
          away: fixture.away,
          originalFavorite: preFav,
          newFavorite: postFav,
          reason: `Tactical flip on ${fixture.broadcaster}: ${shifter} shifted by ${shiftVal}pts in standings, altering Win Probability.`,
        });
      }
    }

    // 6. Fatigue analysis on the modified schedule
    const fatigueWarnings = analyzeFatigue(fixtures, teams);

    // 7. Summary
    const rankChanges = finalStandings.filter(s => s.rankChange !== 0).length;
    const teamsAffected = new Set([
      ...forcedResults.flatMap(r => {
        const fix = fixtures.find(f => f.id === r.fixtureId);
        return fix ? [fix.home, fix.away] : [];
      }),
    ]).size;

    return {
      standings: finalStandings,
      butterflyEffects,
      fatigueWarnings,
      forcedResults,
      summary: {
        teamsAffected,
        rankChanges,
        predictionsFlipped: butterflyEffects.length,
        fatigueRisks: fatigueWarnings.length,
      },
    };
  }
}
