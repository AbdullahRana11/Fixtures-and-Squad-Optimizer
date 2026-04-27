/**
 * fa-cup-engine.ts
 * 
 * FA Cup Knockout Bracket Engine. 
 * Generates a 64-team single-elimination bracket (Third Round Proper onward).
 * Supports both auto-simulation and manual click-through modes.
 * Uses tier-weighted probability for winner determination.
 */

export interface FACupTeam {
  name: string;
  league: string;      // 'Premier League', 'Championship', 'League One', 'League Two'
  city: string;
  stadium: string;
}

export interface FACupMatch {
  id: string;
  round: string;
  matchNumber: number;
  home: FACupTeam;
  away: FACupTeam;
  date: string;
  time: string;
  venue: string;       // Home team stadium, or Wembley for SF/Final
  winner: string | null;
  isNeutral: boolean;
}

export interface FACupRound {
  name: string;
  shortName: string;
  date: string;
  matchCount: number;
  matches: FACupMatch[];
  isComplete: boolean;
}

export interface FACupBracket {
  teams: string[];
  rounds: FACupRound[];
  champion: string | null;
  telemetry: {
    generation_time_ms: number;
    upsets: number;
    total_matches: number;
  };
}

// Round definitions with dates
const FA_CUP_ROUNDS = [
  { name: 'Third Round Proper', shortName: 'R3', date: '2026-01-10', matchCount: 32 },
  { name: 'Fourth Round Proper', shortName: 'R4', date: '2026-02-07', matchCount: 16 },
  { name: 'Fifth Round Proper', shortName: 'R5', date: '2026-02-25', matchCount: 8 },
  { name: 'Quarter-Finals', shortName: 'QF', date: '2026-03-14', matchCount: 4 },
  { name: 'Semi-Finals', shortName: 'SF', date: '2026-04-25', matchCount: 2 },
  { name: 'Final', shortName: 'F', date: '2026-05-16', matchCount: 1 },
];

// Tier-based win probability (higher tier team's base probability)
const TIER_WIN_PROBABILITY: Record<string, number> = {
  'Premier League': 0.80,
  'Championship': 0.60,
  'League One': 0.45,
  'League Two': 0.35,
};

const TIER_RANK: Record<string, number> = {
  'Premier League': 4,
  'Championship': 3,
  'League One': 2,
  'League Two': 1,
};

export class FACupEngine {
  private teams: FACupTeam[];
  private upsetCount = 0;

  constructor(teams: FACupTeam[]) {
    if (teams.length !== 64) {
      throw new Error(`FA Cup requires exactly 64 teams, got ${teams.length}`);
    }
    this.teams = teams;
  }

  /**
   * Shuffle array (Fisher-Yates)
   */
  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /**
   * Determine match winner using tier-weighted probability.
   */
  private determineWinner(home: FACupTeam, away: FACupTeam): FACupTeam {
    const homeRank = TIER_RANK[home.league] || 1;
    const awayRank = TIER_RANK[away.league] || 1;

    if (homeRank === awayRank) {
      // Same tier: 55-45 home advantage
      return Math.random() < 0.55 ? home : away;
    }

    // Different tiers
    const higherTeam = homeRank > awayRank ? home : away;
    const lowerTeam = homeRank > awayRank ? away : home;
    const tierDiff = Math.abs(homeRank - awayRank);

    // Base probability for higher tier (increases with tier gap)
    const baseProb = TIER_WIN_PROBABILITY[higherTeam.league] || 0.5;
    const adjustedProb = Math.min(0.95, baseProb + (tierDiff - 1) * 0.05);

    const winner = Math.random() < adjustedProb ? higherTeam : lowerTeam;

    if (winner === lowerTeam) {
      this.upsetCount++;
    }

    return winner;
  }

  /**
   * Generate the initial draw (randomized, no seeding).
   */
  public generateDraw(): FACupBracket {
    const startTime = Date.now();
    const shuffled = this.shuffle(this.teams);

    const bracket: FACupBracket = {
      teams: this.teams.map(t => t.name),
      rounds: [],
      champion: null,
      telemetry: {
        generation_time_ms: 0,
        upsets: 0,
        total_matches: 0,
      },
    };

    // Create first round with all 64 teams
    const firstRound = this.createRound(shuffled, FA_CUP_ROUNDS[0]);
    bracket.rounds.push(firstRound);

    bracket.telemetry.generation_time_ms = Date.now() - startTime;
    return bracket;
  }

  /**
   * Auto-generate the entire bracket with simulated results.
   */
  public generateFullBracket(): FACupBracket {
    const startTime = Date.now();
    const shuffled = this.shuffle(this.teams);

    const bracket: FACupBracket = {
      teams: this.teams.map(t => t.name),
      rounds: [],
      champion: null,
      telemetry: {
        generation_time_ms: 0,
        upsets: 0,
        total_matches: 0,
      },
    };

    let currentTeams = shuffled;

    for (let r = 0; r < FA_CUP_ROUNDS.length; r++) {
      const roundDef = FA_CUP_ROUNDS[r];
      const round = this.createRound(currentTeams, roundDef);

      // Simulate all matches
      const winners: FACupTeam[] = [];
      for (const match of round.matches) {
        const winner = this.determineWinner(match.home, match.away);
        match.winner = winner.name;
        winners.push(winner);
      }
      round.isComplete = true;

      bracket.rounds.push(round);
      currentTeams = winners;
    }

    bracket.champion = currentTeams[0]?.name || null;
    bracket.telemetry = {
      generation_time_ms: Date.now() - startTime,
      upsets: this.upsetCount,
      total_matches: bracket.rounds.reduce((sum, r) => sum + r.matches.length, 0),
    };

    return bracket;
  }

  /**
   * Simulate a single round given winners from previous round.
   * Used for manual click-through mode.
   */
  public static simulateNextRound(
    bracket: FACupBracket,
    winners: FACupTeam[]
  ): FACupBracket {
    const nextRoundIdx = bracket.rounds.length;
    if (nextRoundIdx >= FA_CUP_ROUNDS.length) return bracket;

    const roundDef = FA_CUP_ROUNDS[nextRoundIdx];
    
    const round: FACupRound = {
      name: roundDef.name,
      shortName: roundDef.shortName,
      date: roundDef.date,
      matchCount: roundDef.matchCount,
      matches: [],
      isComplete: false,
    };

    // Pair winners for this round
    for (let i = 0; i < winners.length; i += 2) {
      const isNeutral = roundDef.shortName === 'SF' || roundDef.shortName === 'F';
      const home = winners[i];
      const away = winners[i + 1];

      round.matches.push({
        id: `fa-${roundDef.shortName}-${Math.floor(i / 2)}`,
        round: roundDef.name,
        matchNumber: Math.floor(i / 2) + 1,
        home,
        away,
        date: roundDef.date,
        time: roundDef.matchCount <= 2 ? '15:00' : ['12:30', '15:00', '17:30'][i % 3],
        venue: isNeutral ? 'Wembley Stadium' : home.stadium,
        winner: null,
        isNeutral,
      });
    }

    bracket.rounds.push(round);
    return bracket;
  }

  private createRound(teams: FACupTeam[], roundDef: typeof FA_CUP_ROUNDS[0]): FACupRound {
    const round: FACupRound = {
      name: roundDef.name,
      shortName: roundDef.shortName,
      date: roundDef.date,
      matchCount: roundDef.matchCount,
      matches: [],
      isComplete: false,
    };

    for (let i = 0; i < teams.length; i += 2) {
      const isNeutral = roundDef.shortName === 'SF' || roundDef.shortName === 'F';
      const home = teams[i];
      const away = teams[i + 1];

      if (!home || !away) continue;

      round.matches.push({
        id: `fa-${roundDef.shortName}-${Math.floor(i / 2)}`,
        round: roundDef.name,
        matchNumber: Math.floor(i / 2) + 1,
        home,
        away,
        date: roundDef.date,
        time: roundDef.matchCount <= 2 ? '15:00' : ['12:30', '15:00', '17:30'][Math.floor(i / 2) % 3],
        venue: isNeutral ? 'Wembley Stadium' : home.stadium,
        winner: null,
        isNeutral,
      });
    }

    return round;
  }
}
