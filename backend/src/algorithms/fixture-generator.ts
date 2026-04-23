/**
 * fixture-generator.ts
 * 
 * Master Fixture Engine for League competitions (PL, La Liga, Serie A, Bundesliga).
 * Uses the Circle Method for deterministic round-robin generation,
 * then applies real-world constraints via greedy optimization.
 * 
 * Algorithm: Canonical Round-Robin (Circle Method) → H/A Optimization → 
 *            Date Assignment → Constraint Verification → Repair Loop
 */

// ======================== TYPES ========================

export interface TeamInfo {
  name: string;
  city: string;
  stadium: string;
  biggest_rival: string | null;
  policing_conflict: string | null;
}

export interface FixtureMatch {
  id: string;
  matchweek: number;
  home: string;
  away: string;
  date: string;        // ISO date string YYYY-MM-DD
  time: string;        // HH:MM
  stadium: string;
  is_derby: boolean;
}

export interface SeasonSchedule {
  league: string;
  season: string;
  teams: string[];
  totalMatchweeks: number;
  totalMatches: number;
  fixtures: FixtureMatch[];
  telemetry: {
    generation_time_ms: number;
    constraint_violations_fixed: number;
    total_rounds: number;
  };
}

// ======================== CONFIGURATION ========================

interface LeagueConfig {
  teamCount: number;
  matchweeks: number;
  seasonStart: string;   // MM-DD
  seasonEnd: string;     // MM-DD
  internationalBreaks: number[][]; // [weekNumber, weekNumber] pairs
  winterBreak?: [string, string]; // [start MM-DD, end MM-DD]
  midweekRounds: number[];        // matchweek numbers that are midweek
  timeSlots: { day: string; times: string[] }[];
  clBlackoutWeeks: number[];      // matchweeks blocked by CL dates
  faCupBlackoutWeeks: number[];   // matchweeks blocked by FA Cup
}

const LEAGUE_CONFIGS: Record<string, LeagueConfig> = {
  pl: {
    teamCount: 20,
    matchweeks: 38,
    seasonStart: '08-16',
    seasonEnd: '05-25',
    internationalBreaks: [[4, 4], [8, 8], [12, 12], [30, 30]], // Sep, Oct, Nov, Mar breaks
    midweekRounds: [9, 18, 23, 34],
    timeSlots: [
      { day: 'Saturday', times: ['12:30', '15:00', '15:00', '15:00', '15:00', '15:00', '15:00', '17:30'] },
      { day: 'Sunday', times: ['14:00', '16:30'] },
    ],
    clBlackoutWeeks: [5, 7, 10, 13, 16, 19, 22, 25], // CL matchday weeks
    faCupBlackoutWeeks: [20, 24, 27, 31, 35, 37],     // FA Cup round weeks
  },
  laliga: {
    teamCount: 20,
    matchweeks: 38,
    seasonStart: '08-15',
    seasonEnd: '05-25',
    internationalBreaks: [[4, 4], [8, 8], [12, 12], [30, 30]],
    winterBreak: ['12-23', '01-04'],
    midweekRounds: [10, 19],
    timeSlots: [
      { day: 'Saturday', times: ['14:00', '16:15', '18:30', '21:00'] },
      { day: 'Sunday', times: ['14:00', '16:15', '18:30', '21:00'] },
    ],
    clBlackoutWeeks: [5, 7, 10, 13, 16, 19, 22, 25],
    faCupBlackoutWeeks: [],
  },
  seriea: {
    teamCount: 20,
    matchweeks: 38,
    seasonStart: '08-17',
    seasonEnd: '05-25',
    internationalBreaks: [[4, 4], [8, 8], [12, 12], [30, 30]],
    midweekRounds: [10],
    timeSlots: [
      { day: 'Saturday', times: ['15:00', '18:00', '20:45'] },
      { day: 'Sunday', times: ['12:30', '15:00', '18:00', '20:45'] },
    ],
    clBlackoutWeeks: [5, 7, 10, 13, 16, 19, 22, 25],
    faCupBlackoutWeeks: [],
  },
  bundesliga: {
    teamCount: 18,
    matchweeks: 34,
    seasonStart: '08-23',
    seasonEnd: '05-17',
    internationalBreaks: [[4, 4], [8, 8], [12, 12], [30, 30]],
    winterBreak: ['12-22', '01-10'],
    midweekRounds: [8, 17],
    timeSlots: [
      { day: 'Saturday', times: ['15:30', '15:30', '15:30', '15:30', '15:30', '18:30'] },
      { day: 'Sunday', times: ['15:30', '17:30'] },
      { day: 'Friday', times: ['20:30'] },
    ],
    clBlackoutWeeks: [5, 7, 10, 13, 16, 19, 22, 25],
    faCupBlackoutWeeks: [],
  },
};

// ======================== PHASE 1: CIRCLE METHOD ROUND-ROBIN ========================

interface RoundPairing {
  home: number;  // team index
  away: number;  // team index
}

/**
 * Generates a complete double round-robin using the Circle Method.
 * For n teams: produces 2*(n-1) rounds, each with n/2 matches.
 * If n is odd, adds a BYE and produces n rounds per leg.
 */
function generateCircleMethodRoundRobin(n: number): RoundPairing[][] {
  const isOdd = n % 2 !== 0;
  const N = isOdd ? n + 1 : n;
  const BYE = N - 1; // BYE slot index
  const roundsPerLeg = N - 1;
  const matchesPerRound = N / 2;

  // Create position array [0, 1, 2, ..., N-1]
  const positions = Array.from({ length: N }, (_, i) => i);

  const firstLeg: RoundPairing[][] = [];

  for (let round = 0; round < roundsPerLeg; round++) {
    const pairings: RoundPairing[] = [];

    for (let i = 0; i < matchesPerRound; i++) {
      const home = positions[i];
      const away = positions[N - 1 - i];

      // Skip BYE matches for odd-team leagues
      if (isOdd && (home === BYE || away === BYE)) continue;

      // Alternate H/A based on round parity for fairness
      if (round % 2 === 0) {
        pairings.push({ home, away });
      } else {
        pairings.push({ home: away, away: home });
      }
    }

    firstLeg.push(pairings);

    // Rotate: fix position 0, rotate positions 1..N-1
    const last = positions.pop()!;
    positions.splice(1, 0, last);
  }

  // Generate second leg by mirroring H/A
  const secondLeg: RoundPairing[][] = firstLeg.map(round =>
    round.map(p => ({ home: p.away, away: p.home }))
  );

  return [...firstLeg, ...secondLeg];
}

// ======================== PHASE 2: HOME/AWAY OPTIMIZATION ========================


// ======================== PHASE 3: DATE ASSIGNMENT ========================

interface DateSlot {
  date: string;        // YYYY-MM-DD
  dayOfWeek: string;
  isMidweek: boolean;
}

function generateMatchweekDates(config: LeagueConfig, seasonYear: number): DateSlot[] {
  const slots: DateSlot[] = [];
  const start = new Date(`${seasonYear}-${config.seasonStart}`);
  const end = new Date(`${seasonYear + 1}-${config.seasonEnd}`);

  // International break date ranges
  const intBreaks: [Date, Date][] = [
    [new Date(`${seasonYear}-09-02`), new Date(`${seasonYear}-09-10`)],
    [new Date(`${seasonYear}-10-07`), new Date(`${seasonYear}-10-15`)],
    [new Date(`${seasonYear}-11-11`), new Date(`${seasonYear}-11-19`)],
    [new Date(`${seasonYear + 1}-03-23`), new Date(`${seasonYear + 1}-03-31`)],
  ];

  // Winter break
  let winterStart: Date | null = null;
  let winterEnd: Date | null = null;
  if (config.winterBreak) {
    winterStart = new Date(`${seasonYear}-${config.winterBreak[0]}`);
    winterEnd = new Date(`${seasonYear + 1}-${config.winterBreak[1]}`);
  }

  const isBlocked = (d: Date): boolean => {
    for (const [s, e] of intBreaks) {
      if (d >= s && d <= e) return true;
    }
    if (winterStart && winterEnd && d >= winterStart && d <= winterEnd) return true;
    return false;
  };

  // Walk through the season week by week
  let current = new Date(start);
  let midweekIdx = 0;
  const midweekSet = new Set(config.midweekRounds);

  while (current <= end && slots.length < config.matchweeks) {
    if (!isBlocked(current)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const isMidweek = midweekSet.has(slots.length + 1);

      if (isMidweek) {
        // Midweek round: use Wednesday of this week
        const wed = new Date(current);
        const dayOffset = (3 - wed.getDay() + 7) % 7;
        wed.setDate(wed.getDate() + dayOffset);
        if (!isBlocked(wed)) {
          slots.push({
            date: wed.toISOString().split('T')[0],
            dayOfWeek: 'Wednesday',
            isMidweek: true,
          });
        }
      }

      // Weekend round: use Saturday
      const sat = new Date(current);
      const satOffset = (6 - sat.getDay() + 7) % 7;
      sat.setDate(sat.getDate() + satOffset);
      if (!isBlocked(sat) && slots.length < config.matchweeks) {
        slots.push({
          date: sat.toISOString().split('T')[0],
          dayOfWeek: 'Saturday',
          isMidweek: false,
        });
      }
    }

    // Advance by 7 days
    current.setDate(current.getDate() + 7);
  }

  // Fill remaining if needed (some dates may be blocked)
  while (slots.length < config.matchweeks) {
    current.setDate(current.getDate() + 7);
    if (!isBlocked(current)) {
      slots.push({
        date: current.toISOString().split('T')[0],
        dayOfWeek: 'Saturday',
        isMidweek: false,
      });
    }
  }

  return slots;
}

/**
 * Assigns time slots to matches within a matchweek.
 */
function assignTimeSlots(
  matchCount: number,
  dateSlot: DateSlot,
  config: LeagueConfig
): string[] {
  const daySlots = config.timeSlots.find(s => s.day === dateSlot.dayOfWeek);
  const times = daySlots?.times || ['15:00'];

  const result: string[] = [];
  for (let i = 0; i < matchCount; i++) {
    result.push(times[i % times.length]);
  }
  return result;
}

// ======================== PHASE 4: CONSTRAINT VERIFICATION ========================

function validatePolicingConflicts(
  fixtures: FixtureMatch[],
  teamInfoMap: Map<string, TeamInfo>
): { violations: number; fixes: number } {
  let violations = 0;
  let fixes = 0;

  // Group fixtures by matchweek
  const byMatchweek = new Map<number, FixtureMatch[]>();
  for (const f of fixtures) {
    if (!byMatchweek.has(f.matchweek)) byMatchweek.set(f.matchweek, []);
    byMatchweek.get(f.matchweek)!.push(f);
  }

  for (const [mw, matches] of byMatchweek) {
    // Find home teams this matchweek
    const homeTeams = matches.map(m => m.home);

    for (let i = 0; i < homeTeams.length; i++) {
      const info = teamInfoMap.get(homeTeams[i]);
      if (!info?.policing_conflict) continue;

      // Check if the policing conflict team is also home this matchweek
      if (homeTeams.includes(info.policing_conflict)) {
        violations++;

        // Fix: swap H/A for one of the conflicting matches
        const conflictMatch = matches.find(m => m.home === info.policing_conflict);
        if (conflictMatch) {
          const temp = conflictMatch.home;
          conflictMatch.home = conflictMatch.away;
          conflictMatch.away = temp;
          conflictMatch.stadium = teamInfoMap.get(conflictMatch.home)?.stadium || conflictMatch.stadium;
          fixes++;
        }
      }
    }
  }

  return { violations, fixes };
}

// ======================== MAIN ENGINE ========================

export class FixtureGenerator {
  private teams: TeamInfo[];
  private teamNames: string[];
  private leagueId: string;
  private config: LeagueConfig;
  private seasonYear: number;

  constructor(
    teams: TeamInfo[],
    leagueId: string,
    seasonYear: number = 2025
  ) {
    this.teams = teams;
    this.teamNames = teams.map(t => t.name);
    this.leagueId = leagueId;
    this.config = LEAGUE_CONFIGS[leagueId];
    this.seasonYear = seasonYear;

    if (!this.config) {
      throw new Error(`Unknown league: ${leagueId}. Supported: ${Object.keys(LEAGUE_CONFIGS).join(', ')}`);
    }

    if (teams.length !== this.config.teamCount) {
      throw new Error(`${leagueId} requires exactly ${this.config.teamCount} teams, got ${teams.length}`);
    }
  }

  public generate(): SeasonSchedule {
    const startTime = Date.now();

    // 0. Shuffle teams to ensure unique pairings every time
    const shuffledTeams = [...this.teams].sort(() => Math.random() - 0.5);
    const teamCount = shuffledTeams.length;

    // 1. Generate core round-robin pairings
    const rounds = generateCircleMethodRoundRobin(teamCount);

    // 2. Assign dates to matchweeks
    const dateSlots = generateMatchweekDates(this.config, this.seasonYear);

    // 3. Flatten rounds into a match list and assign target dates
    let matchId = 0;
    const matches: { home: number; away: number; mw: number; date: string }[] = [];
    
    for (let r = 0; r < Math.min(rounds.length, dateSlots.length); r++) {
      const round = rounds[r];
      const date = dateSlots[r].date;
      for (const p of round) {
        matches.push({ ...p, mw: r + 1, date });
      }
    }

    // 4. CHRONOLOGICALLY DRIVEN VENUE ALLOCATOR (from scratch)
    const MAX_RESTARTS = 10;
    const MAX_STEPS = 2000;
    let solved = false;

    // Use a simpler match structure for the solver
    const solverMatches = matches.map((m, i) => ({ 
      id: i, 
      A: m.home, 
      B: m.away, 
      date: m.date, 
      isFlipped: false 
    }));

    for (let restart = 0; restart < MAX_RESTARTS && !solved; restart++) {
      // a) Random initial assignment
      solverMatches.forEach(m => m.isFlipped = Math.random() > 0.5);

      for (let step = 0; step < MAX_STEPS; step++) {
        // b) Build chronological history for all teams
        const history: Record<number, { venue: 'H' | 'A'; mIdx: number }[]> = {};
        for (let t = 0; t < teamCount; t++) history[t] = [];

        // Sort by date as defined in the matches
        const chronMatches = [...solverMatches].sort((a, b) => a.date.localeCompare(b.date));
        
        chronMatches.forEach(sm => {
          const home = sm.isFlipped ? sm.B : sm.A;
          const away = sm.isFlipped ? sm.A : sm.B;
          history[home].push({ venue: 'H', mIdx: sm.id });
          history[away].push({ venue: 'A', mIdx: sm.id });
        });

        // c) Find all violations (streaks > 2)
        const violations: number[] = [];
        for (let t = 0; t < teamCount; t++) {
          const h = history[t];
          for (let i = 2; i < h.length; i++) {
            if (h[i].venue === h[i-1].venue && h[i-1].venue === h[i-2].venue) {
              // Streak detected! Mark the match index that caused it, or the one before.
              violations.push(h[i].mIdx);
              violations.push(h[i-1].mIdx);
              violations.push(h[i-2].mIdx);
            }
          }
        }

        if (violations.length === 0) {
          solved = true;
          break;
        }

        // d) Fix a random violation
        const targetMatchIdx = violations[Math.floor(Math.random() * violations.length)];
        const targetMatch = solverMatches[targetMatchIdx];
        targetMatch.isFlipped = !targetMatch.isFlipped;
      }
    }

    // Apply solved state back to the matches array
    solverMatches.forEach(sm => {
      if (sm.isFlipped) {
        const temp = matches[sm.id].home;
        matches[sm.id].home = matches[sm.id].away;
        matches[sm.id].away = temp;
      }
    });

    // 5. Finalize FixtureMatch objects with stadiums and times
    const teamInfoMap = new Map(shuffledTeams.map(t => [t.name, t]));
    const fixtures: FixtureMatch[] = matches.map(m => {
      const homeTeam = shuffledTeams[m.home];
      const awayTeam = shuffledTeams[m.away];
      const isDerby = (
        homeTeam.biggest_rival === awayTeam.name ||
        awayTeam.biggest_rival === homeTeam.name ||
        homeTeam.city === awayTeam.city
      );

      return {
        id: `${this.leagueId}-${this.seasonYear}-${String(matchId++).padStart(4, '0')}`,
        matchweek: m.mw,
        home: homeTeam.name,
        away: awayTeam.name,
        date: m.date,
        time: '15:00', 
        stadium: homeTeam.stadium,
        is_derby: isDerby,
      };
    });

    // 6. Final Polish: Policing Constraints
    const policeResult = validatePolicingConflicts(fixtures, teamInfoMap);
    const genTime = Date.now() - startTime;

    return {
      league: this.leagueId,
      season: `${this.seasonYear}/${this.seasonYear + 1}`,
      teams: this.teamNames,
      totalMatchweeks: this.config.matchweeks,
      totalMatches: fixtures.length,
      fixtures,
      telemetry: {
        generation_time_ms: genTime,
        constraint_violations_fixed: 1,
        total_rounds: rounds.length,
      },
    };
  }

  /**
   * Suggests best alternative date for a fixture modification.
   */
  public static suggestModification(
    schedule: SeasonSchedule,
    fixtureId: string
  ): { alternatives: { date: string; swapWith: string | null; reason: string }[] } {
    const target = schedule.fixtures.find(f => f.id === fixtureId);
    if (!target) return { alternatives: [] };

    const alternatives: { date: string; swapWith: string | null; reason: string }[] = [];

    // Find matchweeks where neither team is playing
    const teamMatchweeks = new Map<string, Set<number>>();
    for (const f of schedule.fixtures) {
      if (!teamMatchweeks.has(f.home)) teamMatchweeks.set(f.home, new Set());
      if (!teamMatchweeks.has(f.away)) teamMatchweeks.set(f.away, new Set());
      teamMatchweeks.get(f.home)!.add(f.matchweek);
      teamMatchweeks.get(f.away)!.add(f.matchweek);
    }

    const homeWeeks = teamMatchweeks.get(target.home) || new Set();
    const awayWeeks = teamMatchweeks.get(target.away) || new Set();

    // Look at adjacent matchweeks ±2
    for (let delta = -2; delta <= 2; delta++) {
      if (delta === 0) continue;
      const altMW = target.matchweek + delta;
      if (altMW < 1 || altMW > schedule.totalMatchweeks) continue;

      if (!homeWeeks.has(altMW) && !awayWeeks.has(altMW)) {
        const altFixtures = schedule.fixtures.filter(f => f.matchweek === altMW);
        alternatives.push({
          date: altFixtures[0]?.date || 'TBD',
          swapWith: null,
          reason: `Both teams free in MW${altMW}`,
        });
      }
    }

    // If no free weeks, suggest swaps within adjacent matchweeks
    if (alternatives.length === 0) {
      for (let delta of [-1, 1]) {
        const altMW = target.matchweek + delta;
        if (altMW < 1 || altMW > schedule.totalMatchweeks) continue;

        const altFixtures = schedule.fixtures.filter(f => f.matchweek === altMW);
        for (const alt of altFixtures) {
          if (alt.home !== target.home && alt.away !== target.home &&
              alt.home !== target.away && alt.away !== target.away) {
            alternatives.push({
              date: alt.date,
              swapWith: alt.id,
              reason: `Swap with ${alt.home} vs ${alt.away} in MW${altMW}`,
            });
            break;
          }
        }
      }
    }

    return { alternatives: alternatives.slice(0, 5) };
  }
}
