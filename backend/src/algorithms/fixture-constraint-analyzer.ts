/**
 * fixture-constraint-analyzer.ts
 *
 * Cross-competition constraint analysis for PL ↔ FA Cup ↔ UCL.
 * Detects scheduling conflicts when PL teams compete in FA Cup
 * knockout stages (QF, SF, Final) and identifies available
 * midweek reschedule slots while respecting CL commitments.
 */

import { FixtureMatch } from './fixture-generator';

// ======================== TYPES ========================

export interface FACupKnockoutTeam {
  teamName: string;
  faCupRound: 'QF' | 'SF' | 'F';
  matchDate: string; // ISO YYYY-MM-DD
}

export interface PLConflict {
  plMatchId: string;
  matchweek: number;
  homeTeam: string;
  awayTeam: string;
  matchDate: string;
  teamInKnockout: string;
  faCupRound: 'QF' | 'SF' | 'F';
  faCupMatchDate: string;
}

export interface MidweekSlot {
  suggestedDate: string;    // YYYY-MM-DD
  suggestedMatchweek: number | null;
  dayOfWeek: string;
  reason: string;
}

export interface ConsecutiveViolation {
  team: string;
  type: 'home' | 'away';
  streak: number;
  matchweeks: number[];
}

// ======================== FA CUP BRACKET TYPES ========================
// Mirrors the FA Cup engine output structure

interface FACupTeamRef {
  name: string;
  league: string;
  city: string;
  stadium: string;
}

interface FACupMatchRef {
  id: string;
  round: string;
  matchNumber: number;
  home: FACupTeamRef;
  away: FACupTeamRef;
  date: string;
  time: string;
  venue: string;
  winner: string | null;
  isNeutral: boolean;
}

interface FACupRoundRef {
  name: string;
  shortName: string;
  date: string;
  matchCount: number;
  matches: FACupMatchRef[];
  isComplete: boolean;
}

export interface FACupBracketRef {
  teams: string[];
  rounds: FACupRoundRef[];
  champion: string | null;
  telemetry: any;
}

// Round short names that trigger rescheduling
const KNOCKOUT_ROUNDS = new Set(['QF', 'SF', 'F']);

// Map short names to our enum
const ROUND_MAP: Record<string, 'QF' | 'SF' | 'F'> = {
  'QF': 'QF',
  'SF': 'SF',
  'F': 'F',
};

// International break date ranges for 2025-26 season
const INTERNATIONAL_BREAKS: [Date, Date][] = [
  [new Date('2025-09-02'), new Date('2025-09-10')],
  [new Date('2025-10-07'), new Date('2025-10-15')],
  [new Date('2025-11-11'), new Date('2025-11-19')],
  [new Date('2026-03-23'), new Date('2026-03-31')],
];

// CL blackout weeks — PL matchweeks where CL matches take place
const CL_BLACKOUT_WEEKS = new Set([5, 7, 10, 13, 16, 19, 22, 25]);

// FA Cup blackout weeks
const FA_CUP_BLACKOUT_WEEKS = new Set([20, 24, 27, 31, 35, 37]);

// ======================== CORE FUNCTIONS ========================

/**
 * Extracts Premier League teams still active in FA Cup knockout stages (QF, SF, Final).
 * Only considers teams whose league is 'Premier League'.
 */
export function detectFACupKnockoutTeams(bracket: FACupBracketRef): FACupKnockoutTeam[] {
  const knockoutTeams: FACupKnockoutTeam[] = [];
  const seenTeams = new Set<string>();

  for (const round of bracket.rounds) {
    if (!KNOCKOUT_ROUNDS.has(round.shortName)) continue;
    const roundType = ROUND_MAP[round.shortName];
    if (!roundType) continue;

    for (const match of round.matches) {
      // Both teams in a knockout match need their PL fixtures rescheduled
      // (only if they are Premier League teams)
      for (const team of [match.home, match.away]) {
        if (!team || !team.name) continue;
        if (team.league !== 'Premier League') continue;
        if (seenTeams.has(`${team.name}-${roundType}`)) continue;

        seenTeams.add(`${team.name}-${roundType}`);
        knockoutTeams.push({
          teamName: team.name,
          faCupRound: roundType,
          matchDate: round.date,
        });
      }
    }
  }

  return knockoutTeams;
}

/**
 * Identifies PL fixtures that conflict with FA Cup knockout matches.
 * A conflict exists when a PL team is scheduled on a weekend that
 * overlaps with their FA Cup knockout match (within ±2 days).
 */
export function identifyConflictingPLMatches(
  plFixtures: FixtureMatch[],
  knockoutTeams: FACupKnockoutTeam[]
): PLConflict[] {
  const conflicts: PLConflict[] = [];

  for (const kt of knockoutTeams) {
    const faCupDate = new Date(kt.matchDate);

    // Find PL fixtures for this team on or near the FA Cup date
    for (const fixture of plFixtures) {
      if (fixture.home !== kt.teamName && fixture.away !== kt.teamName) continue;

      const plDate = new Date(fixture.date);
      const daysDiff = Math.abs(
        (plDate.getTime() - faCupDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Conflict if PL match is within 2 days of FA Cup match
      // (covers same weekend scenarios)
      if (daysDiff <= 2) {
        conflicts.push({
          plMatchId: fixture.id,
          matchweek: fixture.matchweek,
          homeTeam: fixture.home,
          awayTeam: fixture.away,
          matchDate: fixture.date,
          teamInKnockout: kt.teamName,
          faCupRound: kt.faCupRound,
          faCupMatchDate: kt.matchDate,
        });
      }
    }
  }

  // Deduplicate by plMatchId (a match might conflict for both home and away teams)
  const seen = new Set<string>();
  return conflicts.filter(c => {
    if (seen.has(c.plMatchId)) return false;
    seen.add(c.plMatchId);
    return true;
  });
}

/**
 * Finds the nearest available midweek (Tue/Wed/Thu) slot where
 * BOTH teams in a fixture are free, respecting CL and FA Cup blackouts.
 *
 * Strategy:
 * 1. Look for midweek between the conflicting weekend and the next weekend
 * 2. If blocked (CL), expand to ±2 matchweek windows
 * 3. If still no slot, push to after matchweek 36 (end of season catch-up)
 */
export function findAvailableMidweekSlot(
  plFixtures: FixtureMatch[],
  homeTeam: string,
  awayTeam: string,
  conflictDate: string,
  clTeams: string[] = [],
  savedCLDates: string[] = []
): MidweekSlot {
  const conflictDateObj = new Date(conflictDate);

  // Build a set of dates where each team already has a fixture
  const teamDateMap = new Map<string, Set<string>>();
  for (const f of plFixtures) {
    if (!teamDateMap.has(f.home)) teamDateMap.set(f.home, new Set());
    if (!teamDateMap.has(f.away)) teamDateMap.set(f.away, new Set());
    teamDateMap.get(f.home)!.add(f.date);
    teamDateMap.get(f.away)!.add(f.date);
  }

  const homeDates = teamDateMap.get(homeTeam) || new Set<string>();
  const awayDates = teamDateMap.get(awayTeam) || new Set<string>();

  // CL dates to avoid (for teams in CL)
  const clDateSet = new Set(savedCLDates);
  const isInCL = (team: string) => clTeams.includes(team);

  // Check if a date falls in an international break
  const isInternationalBreak = (d: Date): boolean => {
    for (const [start, end] of INTERNATIONAL_BREAKS) {
      if (d >= start && d <= end) return true;
    }
    return false;
  };

  // Try to find a midweek slot
  const tryDate = (candidate: Date): MidweekSlot | null => {
    const dayOfWeek = candidate.getDay();
    // Only Tue (2), Wed (3), Thu (4)
    if (dayOfWeek < 2 || dayOfWeek > 4) return null;

    const dateStr = candidate.toISOString().split('T')[0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Check team availability
    if (homeDates.has(dateStr) || awayDates.has(dateStr)) return null;

    // Check international breaks
    if (isInternationalBreak(candidate)) return null;

    // Check CL conflicts
    if (isInCL(homeTeam) && clDateSet.has(dateStr)) return null;
    if (isInCL(awayTeam) && clDateSet.has(dateStr)) return null;

    // Find the matchweek this date would fall into
    const nearestMW = findNearestMatchweek(plFixtures, dateStr);

    return {
      suggestedDate: dateStr,
      suggestedMatchweek: nearestMW,
      dayOfWeek: dayNames[dayOfWeek],
      reason: `Free midweek for both ${homeTeam} and ${awayTeam}`,
    };
  };

  // Strategy 1: Look forward from conflict date, up to 4 weeks
  for (let daysAhead = 1; daysAhead <= 28; daysAhead++) {
    const candidate = new Date(conflictDateObj);
    candidate.setDate(candidate.getDate() + daysAhead);
    const slot = tryDate(candidate);
    if (slot) return slot;
  }

  // Strategy 2: Look backward from conflict date, up to 2 weeks
  for (let daysBehind = 1; daysBehind <= 14; daysBehind++) {
    const candidate = new Date(conflictDateObj);
    candidate.setDate(candidate.getDate() - daysBehind);
    const slot = tryDate(candidate);
    if (slot) return slot;
  }

  // Strategy 3: Push to end of season (after matchweek 36)
  // Find the latest fixture date and schedule after it
  const allDates = plFixtures.map(f => new Date(f.date)).sort((a, b) => b.getTime() - a.getTime());
  const latestDate = allDates[0] || new Date('2026-05-20');

  for (let daysAfter = 1; daysAfter <= 30; daysAfter++) {
    const candidate = new Date(latestDate);
    candidate.setDate(candidate.getDate() + daysAfter);
    const dayOfWeek = candidate.getDay();
    if (dayOfWeek < 2 || dayOfWeek > 4) continue;

    const dateStr = candidate.toISOString().split('T')[0];
    if (isInternationalBreak(candidate)) continue;
    if (isInCL(homeTeam) && clDateSet.has(dateStr)) continue;
    if (isInCL(awayTeam) && clDateSet.has(dateStr)) continue;

    return {
      suggestedDate: dateStr,
      suggestedMatchweek: null, // End-of-season catch-up
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      reason: `End-of-season catch-up slot for ${homeTeam} vs ${awayTeam}`,
    };
  }

  // Absolute fallback
  return {
    suggestedDate: conflictDate,
    suggestedMatchweek: null,
    dayOfWeek: 'TBD',
    reason: 'No available slot found — manual intervention required',
  };
}

/**
 * Validates that no team has more than 2 consecutive home or away matches
 * after rescheduling. Returns any violations found.
 */
export function validateConsecutiveHA(
  fixtures: FixtureMatch[],
  teamNames: string[]
): ConsecutiveViolation[] {
  const violations: ConsecutiveViolation[] = [];

  for (const team of teamNames) {
    // Get team's fixtures sorted by date
    const teamFixtures = fixtures
      .filter(f => f.home === team || f.away === team)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let consecutiveHome = 0;
    let consecutiveAway = 0;
    let homeStreak: number[] = [];
    let awayStreak: number[] = [];

    for (const fixture of teamFixtures) {
      if (fixture.home === team) {
        consecutiveHome++;
        consecutiveAway = 0;
        homeStreak.push(fixture.matchweek);
        awayStreak = [];
      } else {
        consecutiveAway++;
        consecutiveHome = 0;
        awayStreak.push(fixture.matchweek);
        homeStreak = [];
      }

      if (consecutiveHome > 2) {
        violations.push({
          team,
          type: 'home',
          streak: consecutiveHome,
          matchweeks: [...homeStreak],
        });
      }

      if (consecutiveAway > 2) {
        violations.push({
          team,
          type: 'away',
          streak: consecutiveAway,
          matchweeks: [...awayStreak],
        });
      }
    }
  }

  return violations;
}

// ======================== HELPERS ========================

/**
 * Finds the nearest matchweek for a given date based on existing fixtures.
 */
function findNearestMatchweek(fixtures: FixtureMatch[], dateStr: string): number | null {
  const targetDate = new Date(dateStr).getTime();

  // Get unique matchweeks with their dates
  const mwDates = new Map<number, number>();
  for (const f of fixtures) {
    if (!mwDates.has(f.matchweek)) {
      mwDates.set(f.matchweek, new Date(f.date).getTime());
    }
  }

  let closestMW: number | null = null;
  let closestDiff = Infinity;

  for (const [mw, date] of mwDates) {
    const diff = Math.abs(date - targetDate);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestMW = mw;
    }
  }

  return closestMW;
}

/**
 * Gets all CL match dates for PL teams from a saved UCL bracket/schedule.
 * Works with both league phase and knockout bracket formats.
 */
export function extractCLDatesForTeams(
  uclBracket: any,
  plTeamNames: string[]
): { clTeams: string[]; clDates: string[] } {
  const clTeams: string[] = [];
  const clDates: string[] = [];
  const plSet = new Set(plTeamNames);

  if (!uclBracket) return { clTeams, clDates };

  // Handle league phase format (matchdays array)
  if (uclBracket.matchdays && Array.isArray(uclBracket.matchdays)) {
    for (const md of uclBracket.matchdays) {
      for (const match of md.matches || []) {
        if (plSet.has(match.home)) {
          if (!clTeams.includes(match.home)) clTeams.push(match.home);
          if (md.date && !clDates.includes(md.date)) clDates.push(md.date);
        }
        if (plSet.has(match.away)) {
          if (!clTeams.includes(match.away)) clTeams.push(match.away);
          if (md.date && !clDates.includes(md.date)) clDates.push(md.date);
        }
      }
    }
  }

  // Handle knockout bracket format (rounds array)
  if (uclBracket.rounds && Array.isArray(uclBracket.rounds)) {
    for (const round of uclBracket.rounds) {
      for (const match of round.matches || []) {
        const homeName = typeof match.home === 'string' ? match.home : match.home?.name;
        const awayName = typeof match.away === 'string' ? match.away : match.away?.name;
        if (homeName && plSet.has(homeName) && !clTeams.includes(homeName)) clTeams.push(homeName);
        if (awayName && plSet.has(awayName) && !clTeams.includes(awayName)) clTeams.push(awayName);
        // Knockout matches don't always have dates, but we can use round dates if available
      }
    }
  }

  // Handle fixture-style format (fixtures array)
  if (uclBracket.fixtures && Array.isArray(uclBracket.fixtures)) {
    for (const f of uclBracket.fixtures) {
      if (plSet.has(f.home)) {
        if (!clTeams.includes(f.home)) clTeams.push(f.home);
        if (f.date && !clDates.includes(f.date)) clDates.push(f.date);
      }
      if (plSet.has(f.away)) {
        if (!clTeams.includes(f.away)) clTeams.push(f.away);
        if (f.date && !clDates.includes(f.date)) clDates.push(f.date);
      }
    }
  }

  return { clTeams, clDates };
}
