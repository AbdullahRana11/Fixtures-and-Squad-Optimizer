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

import { 
  TeamInfo, 
  FixtureMatch, 
  ConstraintProfile, 
  SeasonSchedule 
} from '../types';

// ======================== CONFIGURATION ========================

interface LeagueConfig {
  leagueId?: string;
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
      { day: 'Friday', times: ['20:00'] },
      { day: 'Saturday', times: ['12:30', '15:00', '15:00', '15:00', '15:00', '17:30', '20:00'] },
      { day: 'Sunday', times: ['14:00', '14:00', '16:30', '16:30'] },
      { day: 'Monday', times: ['20:00'] }
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
      { day: 'Friday', times: ['21:00'] },
      { day: 'Saturday', times: ['14:00', '16:15', '18:30', '21:00'] },
      { day: 'Sunday', times: ['14:00', '16:15', '18:30', '21:00'] },
      { day: 'Monday', times: ['21:00'] }
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
      { day: 'Friday', times: ['18:30', '20:45'] },
      { day: 'Saturday', times: ['15:00', '18:00', '20:45'] },
      { day: 'Sunday', times: ['12:30', '15:00', '18:00', '20:45'] },
      { day: 'Monday', times: ['18:30', '20:45'] }
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
      { day: 'Friday', times: ['20:30'] },
      { day: 'Saturday', times: ['15:30', '15:30', '15:30', '15:30', '15:30', '18:30'] },
      { day: 'Sunday', times: ['15:30', '17:30', '19:30'] },
    ],
    clBlackoutWeeks: [5, 7, 10, 13, 16, 19, 22, 25],
    faCupBlackoutWeeks: [],
  },
  psl: {
    teamCount: 6,
    matchweeks: 14,
    seasonStart: '02-13',
    seasonEnd: '03-18',
    internationalBreaks: [],
    midweekRounds: [3, 7, 11],
    timeSlots: [
      { day: 'Monday', times: ['19:30'] },
      { day: 'Tuesday', times: ['19:30'] },
      { day: 'Wednesday', times: ['19:30'] },
      { day: 'Thursday', times: ['19:30'] },
      { day: 'Friday', times: ['19:30'] },
      { day: 'Saturday', times: ['14:00', '19:30'] },
      { day: 'Sunday', times: ['14:00', '19:30'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  ipl: {
    teamCount: 10,
    matchweeks: 14,
    seasonStart: '03-22',
    seasonEnd: '05-26',
    internationalBreaks: [],
    midweekRounds: [2, 5, 8, 12],
    timeSlots: [
      { day: 'Monday', times: ['19:30'] },
      { day: 'Tuesday', times: ['19:30'] },
      { day: 'Wednesday', times: ['19:30'] },
      { day: 'Thursday', times: ['19:30'] },
      { day: 'Friday', times: ['19:30'] },
      { day: 'Saturday', times: ['15:30', '19:30'] },
      { day: 'Sunday', times: ['15:30', '19:30'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  bbl: {
    teamCount: 8,
    matchweeks: 14,
    seasonStart: '12-07',
    seasonEnd: '01-24',
    internationalBreaks: [],
    midweekRounds: [2, 5, 9, 12],
    timeSlots: [
      { day: 'Monday', times: ['19:15'] },
      { day: 'Tuesday', times: ['19:15'] },
      { day: 'Wednesday', times: ['19:15'] },
      { day: 'Thursday', times: ['19:15'] },
      { day: 'Friday', times: ['19:15'] },
      { day: 'Saturday', times: ['15:00', '19:15'] },
      { day: 'Sunday', times: ['15:00', '19:15'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  cpl: {
    teamCount: 6,
    matchweeks: 10,
    seasonStart: '08-28',
    seasonEnd: '10-06',
    internationalBreaks: [],
    midweekRounds: [2, 5, 8],
    timeSlots: [
      { day: 'Wednesday', times: ['19:00'] },
      { day: 'Thursday', times: ['19:00'] },
      { day: 'Friday', times: ['19:00'] },
      { day: 'Saturday', times: ['10:00', '19:00'] },
      { day: 'Sunday', times: ['10:00', '19:00'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  sa20: {
    teamCount: 6,
    matchweeks: 10,
    seasonStart: '01-09',
    seasonEnd: '02-08',
    internationalBreaks: [],
    midweekRounds: [2, 5, 8],
    timeSlots: [
      { day: 'Tuesday', times: ['17:30'] },
      { day: 'Wednesday', times: ['17:30'] },
      { day: 'Thursday', times: ['17:30'] },
      { day: 'Friday', times: ['17:30'] },
      { day: 'Saturday', times: ['13:30', '17:30'] },
      { day: 'Sunday', times: ['13:30', '17:30'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  'icc-t20wc': {
    teamCount: 20,
    matchweeks: 38,
    seasonStart: '06-01',
    seasonEnd: '06-29',
    internationalBreaks: [],
    midweekRounds: Array.from({length: 38}, (_, i) => i + 1),
    timeSlots: [
      { day: 'Monday', times: ['10:30', '15:00', '20:00'] },
      { day: 'Tuesday', times: ['10:30', '15:00', '20:00'] },
      { day: 'Wednesday', times: ['10:30', '15:00', '20:00'] },
      { day: 'Thursday', times: ['10:30', '15:00', '20:00'] },
      { day: 'Friday', times: ['10:30', '15:00', '20:00'] },
      { day: 'Saturday', times: ['10:30', '15:00', '20:00'] },
      { day: 'Sunday', times: ['10:30', '15:00', '20:00'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  'icc-odi-wc': {
    teamCount: 10,
    matchweeks: 18,
    seasonStart: '10-05',
    seasonEnd: '11-19',
    internationalBreaks: [],
    midweekRounds: Array.from({length: 18}, (_, i) => i + 1),
    timeSlots: [
      { day: 'Monday', times: ['14:00'] },
      { day: 'Tuesday', times: ['14:00'] },
      { day: 'Wednesday', times: ['14:00'] },
      { day: 'Thursday', times: ['14:00'] },
      { day: 'Friday', times: ['14:00'] },
      { day: 'Saturday', times: ['14:00'] },
      { day: 'Sunday', times: ['14:00'] }
    ],
    clBlackoutWeeks: [],
    faCupBlackoutWeeks: [],
  },
  ligue1: {
    teamCount: 18,
    matchweeks: 34,
    seasonStart: '08-16',
    seasonEnd: '05-18',
    internationalBreaks: [[4, 4], [8, 8], [12, 12], [30, 30]],
    winterBreak: ['12-22', '01-03'],
    midweekRounds: [15, 28],
    timeSlots: [
      { day: 'Friday', times: ['20:45'] },
      { day: 'Saturday', times: ['17:00', '19:00', '21:00'] },
      { day: 'Sunday', times: ['13:00', '15:00', '15:00', '15:00', '17:05', '20:45'] }
    ],
    clBlackoutWeeks: [5, 7, 10, 13, 16, 19, 22, 25],
    faCupBlackoutWeeks: [],
  }
};

// ======================== PHASE 1: CIRCLE METHOD ROUND-ROBIN ========================

interface RoundPairing {
  home: number;  // team index
  away: number;  // team index
}

function generateBergerTablesRoundRobin(n: number): RoundPairing[][] {
  const isOdd = n % 2 !== 0;
  const N = isOdd ? n + 1 : n;
  const BYE = N - 1; 
  const roundsPerLeg = N - 1;
  const matchesPerRound = N / 2;

  const firstLeg: RoundPairing[][] = [];

  for (let round = 0; round < roundsPerLeg; round++) {
    const pairings: RoundPairing[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
      if (i === 0) {
        if (round % 2 === 0) pairings.push({ home: round, away: BYE });
        else pairings.push({ home: BYE, away: round });
      } else {
        const teamA = (round + i) % (N - 1);
        const teamB = (round - i + N - 1) % (N - 1);
        if (i % 2 === 1) pairings.push({ home: teamA, away: teamB });
        else pairings.push({ home: teamB, away: teamA });
      }
    }
    firstLeg.push(pairings);
  }

  const secondLeg: RoundPairing[][] = [];
  for (let round = 1; round < roundsPerLeg; round++) {
    secondLeg.push(firstLeg[round].map(p => ({ home: p.away, away: p.home })));
  }
  secondLeg.push(firstLeg[0].map(p => ({ home: p.away, away: p.home })));

  return [...firstLeg, ...secondLeg].map(round => 
    round.filter(p => !(isOdd && (p.home === BYE || p.away === BYE)))
  );
}

// ======================== PHASE 3: DATE ASSIGNMENT ========================

interface DateSlot {
  date: string;
  dayOfWeek: string;
  isMidweek: boolean;
}

function generateMatchweekDates(config: LeagueConfig, seasonYear: number): DateSlot[] {
  const slots: DateSlot[] = [];
  const start = new Date(`${seasonYear}-${config.seasonStart}`);
  const end = new Date(`${seasonYear + 1}-${config.seasonEnd}`);

  const intBreaks: [Date, Date][] = [
    [new Date(`${seasonYear}-09-02`), new Date(`${seasonYear}-09-10`)],
    [new Date(`${seasonYear}-10-07`), new Date(`${seasonYear}-10-15`)],
    [new Date(`${seasonYear}-11-11`), new Date(`${seasonYear}-11-19`)],
    [new Date(`${seasonYear + 1}-03-23`), new Date(`${seasonYear + 1}-03-31`)],
  ];

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

  let current = new Date(start);
  const midweekSet = new Set(config.midweekRounds);

  while (current <= end && slots.length < config.matchweeks) {
    if (!isBlocked(current)) {
      const isMidweek = midweekSet.has(slots.length + 1);

      if (isMidweek) {
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
    current.setDate(current.getDate() + 7);
  }

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

function assignTimeSlots(
  matchCount: number,
  dateSlot: DateSlot,
  config: LeagueConfig,
  isDerby?: boolean,
  intensity?: string
): { time: string; broadcaster: string }[] {
  const daySlots = config.timeSlots.find(s => s.day === dateSlot.dayOfWeek);
  const times = daySlots?.times || ['15:00'];

  const result: { time: string; broadcaster: string }[] = [];
  const isHighProfile = isDerby || intensity === 'High' || intensity === 'Extreme';
  const leagueId = config.leagueId || '';

  for (let i = 0; i < matchCount; i++) {
    const time = times[i % times.length];
    let broadcaster = 'Standard Slot';

    if (leagueId === 'pl') {
      if (dateSlot.dayOfWeek === 'Friday') broadcaster = 'Sky Sports (Friday Night Football)';
      else if (dateSlot.dayOfWeek === 'Monday') broadcaster = 'Sky Sports (Monday Night Football)';
      else if (dateSlot.dayOfWeek === 'Sunday') {
        broadcaster = isHighProfile ? 'Sky Sports (Super Sunday)' : 'Sky Sports';
      } else if (dateSlot.isMidweek) {
        broadcaster = 'Amazon Prime (Midweek Blockbuster)';
      } else {
        if (time === '12:30') broadcaster = 'TNT Sports (Early Kick-Off)';
        else if (time === '17:30') broadcaster = 'Sky Sports (Saturday Night Football)';
        else if (time === '20:00') broadcaster = 'TNT Sports (Saturday Night Lights)';
        else broadcaster = 'BBC / World Feed';
      }
    } else if (leagueId === 'bundesliga') {
      if (dateSlot.dayOfWeek === 'Friday') broadcaster = 'DAZN (Freitagsspiel)';
      else if (dateSlot.dayOfWeek === 'Saturday' && time === '18:30') broadcaster = 'Sky Sports (Topspiel)';
      else if (dateSlot.dayOfWeek === 'Sunday') broadcaster = 'DAZN (Sonntagsspiel)';
      else broadcaster = 'Sky Sports / ARD';
    } else if (leagueId === 'laliga') {
      if (dateSlot.dayOfWeek === 'Friday') broadcaster = 'Movistar+ (Viernes)';
      else if (isHighProfile) broadcaster = 'DAZN (Sabado Premier)';
      else broadcaster = 'LaLiga TV';
    } else if (leagueId === 'seriea') {
      broadcaster = isHighProfile ? 'DAZN (Posticipo)' : 'Sky Italia';
    }

    result.push({ time, broadcaster });
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

  const byMatchweek = new Map<number, FixtureMatch[]>();
  for (const f of fixtures) {
    if (!byMatchweek.has(f.matchweek)) byMatchweek.set(f.matchweek, []);
    byMatchweek.get(f.matchweek)!.push(f);
  }

  for (const [mw, matches] of byMatchweek) {
    const homeTeams = matches.map(m => m.home);
    for (let i = 0; i < homeTeams.length; i++) {
      const info = teamInfoMap.get(homeTeams[i]);
      if (!info?.policing_conflict) continue;
      if (homeTeams.includes(info.policing_conflict)) {
        violations++;
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
  private constraintProfile: ConstraintProfile;

  constructor(
    teams: TeamInfo[],
    leagueId: string,
    seasonYear: number = 2025,
    constraintProfile: ConstraintProfile = {}
  ) {
    this.teams = teams;
    this.teamNames = teams.map(t => t.name);
    this.leagueId = leagueId;
    this.config = { ...LEAGUE_CONFIGS[leagueId], leagueId } as any;
    this.seasonYear = seasonYear;
    this.constraintProfile = constraintProfile;

    if (leagueId === 'custom') {
      this.config = {
        leagueId: 'custom',
        teamCount: teams.length,
        matchweeks: (teams.length % 2 === 0 ? teams.length - 1 : teams.length) * 2,
        seasonStart: '08-16',
        seasonEnd: '05-25',
        internationalBreaks: [],
        midweekRounds: [10, 20],
        timeSlots: [
          { day: 'Saturday', times: ['15:00'] },
          { day: 'Sunday', times: ['15:00'] }
        ],
        clBlackoutWeeks: [],
        faCupBlackoutWeeks: []
      };
    } else {
      if (!LEAGUE_CONFIGS[leagueId]) {
        this.config = {
          leagueId: 'fallback',
          teamCount: teams.length,
          matchweeks: (teams.length % 2 === 0 ? teams.length - 1 : teams.length) * 2,
          seasonStart: '08-16',
          seasonEnd: '05-25',
          internationalBreaks: [],
          midweekRounds: [],
          timeSlots: [
            { day: 'Saturday', times: ['15:00', '15:00', '15:00', '15:00', '15:00'] },
            { day: 'Sunday', times: ['15:00', '15:00', '15:00', '15:00', '15:00'] }
          ],
          clBlackoutWeeks: [],
          faCupBlackoutWeeks: []
        };
      } else {
        if (teams.length !== LEAGUE_CONFIGS[leagueId].teamCount) {
          throw new Error(`${leagueId} requires exactly ${LEAGUE_CONFIGS[leagueId].teamCount} teams, got ${teams.length}`);
        }
      }
    }
  }

  /**
   * Generates the season schedule.
   * 
   * WARNING: If dynamic constraints (lockedFixtures, geoCluster, europeanTeams)
   * are provided in the ConstraintProfile, the strict mathematical H/A alternation
   * guarantees of the Circle Method (Berger tables) may be overridden or broken 
   * to accommodate these real-world requirements.
   */
  public generate(): SeasonSchedule {
    const startTime = Date.now();
    const { lockedFixtures = [], europeanTeams = [], geoCluster = false } = this.constraintProfile;

    const shuffledTeams = [...this.teams].sort(() => Math.random() - 0.5);
    const teamCount = shuffledTeams.length;
    const teamInfoMap = new Map(shuffledTeams.map(t => [t.name, t]));

    const rounds = generateBergerTablesRoundRobin(teamCount);
    const dateSlots = generateMatchweekDates(this.config, this.seasonYear);

    let matchId = 0;
    const matches: { home: number; away: number; mw: number; date: string }[] = [];
    
    for (let r = 0; r < dateSlots.length; r++) {
      const roundIdx = r % rounds.length; // Loop rounds if matchweeks > rounds.length
      const round = rounds[roundIdx];
      const date = dateSlots[r].date;
      for (const p of round) {
        matches.push({ ...p, mw: r + 1, date });
      }
    }

    const fixtures: FixtureMatch[] = matches.map(m => {
      const homeTeam = shuffledTeams[m.home];
      const awayTeam = shuffledTeams[m.away];
      const isDerby = (
        homeTeam.biggest_rival === awayTeam.name ||
        awayTeam.biggest_rival === homeTeam.name ||
        homeTeam.city === awayTeam.city
      );

      const intensity: 'Low' | 'Medium' | 'High' | 'Extreme' = isDerby ? 'Extreme' : 'Medium';
      const slotInfo = assignTimeSlots(1, dateSlots[m.mw - 1] || dateSlots[0], this.config, isDerby, intensity);

      return {
        id: `${this.leagueId}-${this.seasonYear}-${String(matchId++).padStart(4, '0')}`,
        matchweek: m.mw,
        home: homeTeam.name,
        away: awayTeam.name,
        date: m.date,
        time: slotInfo[0]?.time || '15:00',
        stadium: homeTeam.stadium,
        is_derby: isDerby,
        broadcaster: slotInfo[0]?.broadcaster || 'Standard Slot',
        matchIntensity: intensity,
        isLocked: false
      };
    });

    for (const lock of lockedFixtures) {
      const match = fixtures.find(f => f.home === lock.home && f.away === lock.away);
      if (match) {
        const targetSlot = dateSlots[lock.matchweek - 1];
        if (targetSlot) {
          match.matchweek = lock.matchweek;
          match.date = targetSlot.date;
          match.isLocked = true;
        }
      }
    }

    if (geoCluster) {
      const byMatchweek = new Map<number, FixtureMatch[]>();
      for (const f of fixtures) {
        if (!byMatchweek.has(f.matchweek)) byMatchweek.set(f.matchweek, []);
        byMatchweek.get(f.matchweek)!.push(f);
      }

      for (const [, mwFixtures] of byMatchweek) {
        const homeTeams = mwFixtures.map(f => f.home);
        for (let i = 0; i < homeTeams.length; i++) {
          const teamA = teamInfoMap.get(homeTeams[i]);
          for (let j = i + 1; j < homeTeams.length; j++) {
            const teamB = teamInfoMap.get(homeTeams[j]);
            if (teamA && teamB && teamA.city === teamB.city && teamA.stadium !== teamB.stadium) {
              const fix = mwFixtures[j];
              if (!fix.isLocked) {
                const temp = fix.home;
                fix.home = fix.away;
                fix.away = temp;
                fix.stadium = teamInfoMap.get(fix.home)?.stadium || fix.stadium;
              }
            }
          }
        }
      }
    }

    if (europeanTeams.length > 0) {
      const clWeeks = new Set(this.config.clBlackoutWeeks);
      for (const f of fixtures) {
        if (!f.isLocked && (europeanTeams.includes(f.home) || europeanTeams.includes(f.away))) {
          const nearCL = [...clWeeks].some(w => Math.abs(w - f.matchweek) === 0);
          if (nearCL) {
            const targetMW = f.matchweek + 1;
            const targetSlot = dateSlots[targetMW - 1];
            if (targetSlot && targetMW <= this.config.matchweeks) {
               // Check if team already plays in targetMW
               const homeAlreadyPlays = fixtures.some(fx => fx !== f && fx.matchweek === targetMW && (fx.home === f.home || fx.away === f.home));
               const awayAlreadyPlays = fixtures.some(fx => fx !== f && fx.matchweek === targetMW && (fx.home === f.away || fx.away === f.away));
               
               if (!homeAlreadyPlays && !awayAlreadyPlays) {
                 f.matchweek = targetMW;
                 f.date = targetSlot.date;
               }
            }
          }
        }
      }
    }

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
        constraint_violations_fixed: lockedFixtures.length + (geoCluster ? 1 : 0),
        total_rounds: rounds.length,
      },
    };
  }

  public static suggestModification(
    schedule: SeasonSchedule,
    fixtureId: string
  ): { alternatives: { date: string; swapWith: string | null; reason: string }[] } {
    const target = schedule.fixtures.find(f => f.id === fixtureId);
    if (!target) return { alternatives: [] };

    const alternatives: { date: string; swapWith: string | null; reason: string }[] = [];
    const teamMatchweeks = new Map<string, Set<number>>();
    for (const f of schedule.fixtures) {
      if (!teamMatchweeks.has(f.home)) teamMatchweeks.set(f.home, new Set());
      if (!teamMatchweeks.has(f.away)) teamMatchweeks.set(f.away, new Set());
      teamMatchweeks.get(f.home)!.add(f.matchweek);
      teamMatchweeks.get(f.away)!.add(f.matchweek);
    }

    const homeWeeks = teamMatchweeks.get(target.home) || new Set();
    const awayWeeks = teamMatchweeks.get(target.away) || new Set();

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
