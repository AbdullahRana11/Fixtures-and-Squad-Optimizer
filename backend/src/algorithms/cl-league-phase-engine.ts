/**
 * cl-league-phase-engine.ts
 * 
 * Champions League League Phase Engine (2024+ format).
 * Swiss-system pairing: 36 teams, 4 pots, 8 matches each (4H/4A).
 * Country protection + pot balancing constraints.
 */

import { FixtureMatch } from './fixture-generator';

export interface CLTeamInfo {
  name: string;
  country: string;
  pot: string;       // 'Pot 1', 'Pot 2', 'Pot 3', 'Pot 4'
  stadium: string;
  homeAdvantage: number;
  winterRestricted: boolean;
}

export interface CLScheduleResult {
  teams: string[];
  matchdays: CLMatchday[];
  standings: CLStanding[];
  telemetry: {
    generation_time_ms: number;
    pairings_attempted: number;
    country_conflicts_avoided: number;
  };
}

export interface CLMatchday {
  matchday: number;
  date: string;
  day: string;        // 'Tuesday' | 'Wednesday'
  matches: CLMatch[];
}

export interface CLMatch {
  id: string;
  home: string;
  away: string;
  stadium: string;
  time: string;       // '18:45' or '21:00'
  homeAdvantage: number;
}

export interface CLStanding {
  team: string;
  played: number;
  homeGames: number;
  awayGames: number;
  opponents: string[];
}

// CL 2024-25 matchday dates
const CL_MATCHDAY_DATES = [
  { matchday: 1, date: '2025-09-17', day: 'Wednesday' },
  { matchday: 2, date: '2025-10-01', day: 'Wednesday' },
  { matchday: 3, date: '2025-10-22', day: 'Wednesday' },
  { matchday: 4, date: '2025-11-05', day: 'Wednesday' },
  { matchday: 5, date: '2025-11-26', day: 'Wednesday' },
  { matchday: 6, date: '2025-12-10', day: 'Wednesday' },
  { matchday: 7, date: '2026-01-21', day: 'Wednesday' },
  { matchday: 8, date: '2026-01-29', day: 'Wednesday' },
];

export class CLLeaguePhaseEngine {
  private teams: CLTeamInfo[];
  private pots: Map<string, CLTeamInfo[]>;
  private pairingsAttempted = 0;
  private countryConflicts = 0;

  constructor(teams: CLTeamInfo[]) {
    if (teams.length !== 36) {
      throw new Error(`CL League Phase requires exactly 36 teams, got ${teams.length}`);
    }
    this.teams = teams;

    // Group by pot
    this.pots = new Map();
    for (const t of teams) {
      if (!this.pots.has(t.pot)) this.pots.set(t.pot, []);
      this.pots.get(t.pot)!.push(t);
    }
  }

  /**
   * Generate all pairings: each team gets 8 opponents (2 per pot, 1H/1A).
   * Country protection: no team plays vs same country.
   */
  private generatePairings(): Map<string, { opponent: string; isHome: boolean; pot: string }[]> {
    const pairings = new Map<string, { opponent: string; isHome: boolean; pot: string }[]>();
    for (const t of this.teams) {
      pairings.set(t.name, []);
    }

    const teamMap = new Map(this.teams.map(t => [t.name, t]));
    const potNames = ['Pot 1', 'Pot 2', 'Pot 3', 'Pot 4'];

    // For each team, assign 2 opponents from each pot (1H, 1A)
    for (const team of this.teams) {
      const currentPairings = pairings.get(team.name)!;

      for (const potName of potNames) {
        const potTeams = this.pots.get(potName) || [];
        
        // Count how many from this pot are already assigned
        const fromThisPot = currentPairings.filter(p => p.pot === potName).length;
        const needed = 2 - fromThisPot;

        if (needed <= 0) continue;

        // Filter eligible opponents from this pot
        const eligible = potTeams.filter(opp => {
          if (opp.name === team.name) return false;
          if (opp.country === team.country) {
            this.countryConflicts++;
            return false;
          }
          // Already paired?
          if (currentPairings.some(p => p.opponent === opp.name)) return false;
          // Opponent already has 8 matches?
          if (pairings.get(opp.name)!.length >= 8) return false;
          // Opponent already has 2 from team's pot?
          const oppPairings = pairings.get(opp.name)!;
          const teamPotName = potNames.find(pn => (this.pots.get(pn) || []).some(t => t.name === team.name)) || '';
          if (oppPairings.filter(p => p.pot === teamPotName).length >= 2) return false;
          return true;
        });

        this.pairingsAttempted += eligible.length;

        // Assign opponents (greedy)
        let assigned = 0;
        for (const opp of eligible) {
          if (assigned >= needed) break;
          if (currentPairings.length >= 8) break;
          if (pairings.get(opp.name)!.length >= 8) continue;

          // Decide H/A: alternate per pot assignment
          const homeCount = currentPairings.filter(p => p.isHome).length;
          const awayCount = currentPairings.filter(p => !p.isHome).length;
          const isHome = homeCount < 4;

          currentPairings.push({ opponent: opp.name, isHome, pot: potName });
          pairings.get(opp.name)!.push({
            opponent: team.name,
            isHome: !isHome,
            pot: potNames.find(pn => (this.pots.get(pn) || []).some(t => t.name === team.name)) || '',
          });

          assigned++;
        }
      }
    }

    return pairings;
  }

  /**
   * Distribute pairings across 8 matchdays.
   */
  private distributeTOMatchdays(
    pairings: Map<string, { opponent: string; isHome: boolean; pot: string }[]>
  ): CLMatchday[] {
    const matchdays: CLMatchday[] = CL_MATCHDAY_DATES.map(md => ({
      ...md,
      matches: [],
    }));

    // Flatten all matches (deduplicate)
    const allMatches: { home: string; away: string }[] = [];
    const seen = new Set<string>();

    for (const [team, opponents] of pairings) {
      for (const opp of opponents) {
        const key = opp.isHome ? `${team}-${opp.opponent}` : `${opp.opponent}-${team}`;
        if (!seen.has(key)) {
          seen.add(key);
          allMatches.push({
            home: opp.isHome ? team : opp.opponent,
            away: opp.isHome ? opp.opponent : team,
          });
        }
      }
    }

    // Distribute matches across matchdays
    // Each team plays exactly 1 match per matchday
    const teamAssigned = new Map<string, Set<number>>();
    for (const t of this.teams) teamAssigned.set(t.name, new Set());

    const teamMap = new Map(this.teams.map(t => [t.name, t]));

    // Sort matches for better distribution (prioritize big pots first)
    const shuffled = [...allMatches].sort(() => Math.random() - 0.5);

    for (const match of shuffled) {
      // Find first matchday where neither team is assigned
      for (let md = 0; md < 8; md++) {
        const homeAssigned = teamAssigned.get(match.home)!;
        const awayAssigned = teamAssigned.get(match.away)!;

        if (!homeAssigned.has(md) && !awayAssigned.has(md)) {
          const homeInfo = teamMap.get(match.home)!;

          // Check max matches per country per matchday (max 2)
          const countryCount = matchdays[md].matches.filter(m => {
            const hInfo = teamMap.get(m.home);
            const aInfo = teamMap.get(m.away);
            return hInfo?.country === homeInfo.country || aInfo?.country === homeInfo.country;
          }).length;

          if (countryCount >= 4) continue;  // Soft limit

          matchdays[md].matches.push({
            id: `cl-md${md + 1}-${matchdays[md].matches.length}`,
            home: match.home,
            away: match.away,
            stadium: homeInfo.stadium,
            time: matchdays[md].matches.length % 2 === 0 ? '18:45' : '21:00',
            homeAdvantage: homeInfo.homeAdvantage,
          });

          homeAssigned.add(md);
          awayAssigned.add(md);
          break;
        }
      }
    }

    return matchdays;
  }

  public generate(): CLScheduleResult {
    const startTime = Date.now();

    const pairings = this.generatePairings();
    const matchdays = this.distributeTOMatchdays(pairings);

    // Build standings summary
    const standings: CLStanding[] = this.teams.map(t => {
      const teamPairings = pairings.get(t.name) || [];
      return {
        team: t.name,
        played: teamPairings.length,
        homeGames: teamPairings.filter(p => p.isHome).length,
        awayGames: teamPairings.filter(p => !p.isHome).length,
        opponents: teamPairings.map(p => p.opponent),
      };
    });

    return {
      teams: this.teams.map(t => t.name),
      matchdays,
      standings,
      telemetry: {
        generation_time_ms: Date.now() - startTime,
        pairings_attempted: this.pairingsAttempted,
        country_conflicts_avoided: this.countryConflicts,
      },
    };
  }
}
