export interface FixtureTelemetry {
  execution_time_ms: number;
  nodes_explored: number;
  depth_reached: number;
  is_complete: boolean;
}

export interface Match {
  home_team: string;
  away_team: string;
}

export interface GameweekSchedule {
  gameweek: number;
  matches: Match[];
}

export interface CSPScheduleResult {
  schedule: GameweekSchedule[];
  telemetry: FixtureTelemetry;
  error?: string;
}

export class FixtureCSPEngine {
  private teams: string[];
  private targetGameweeks: number = 38;
  
  private exclusionWeeks: Set<number> = new Set([7, 14, 21, 28]); // e.g., Cup Dates
  
  private nodesExplored: number = 0;
  private maxDepth: number = 0;
  
  private startTime: number = 0;
  private readonly TIME_LIMIT_MS = 4000; // Hard cutoff 4s
  private timeExceeded: boolean = false;

  private bestSchedule: GameweekSchedule[] = [];

  constructor(teams: string[]) {
    this.teams = teams;
  }

  // Check if a match is valid for a given gameweek
  private isValidAssigment(
    home: string, 
    away: string, 
    gameweek: number, 
    currentSchedule: GameweekSchedule[], 
    matchHistory: Map<string, number> // 'home-away' -> count
  ): boolean {
    if (home === away) return false;
    if (this.exclusionWeeks.has(gameweek)) return false;

    // Has this exact match already been played? (Home/Away twice constraint)
    const matchKey = `${home}-${away}`;
    if ((matchHistory.get(matchKey) || 0) >= 1) return false;

    // Is either team already playing in this Gameweek?
    const currentGW = currentSchedule.find(g => g.gameweek === gameweek);
    if (currentGW) {
      const alreadyPlaying = currentGW.matches.some(
        m => m.home_team === home || m.away_team === home || m.home_team === away || m.away_team === away
      );
      if (alreadyPlaying) return false;
    }

    return true;
  }

  private backtrack(
    currentGameweek: number,
    currentMatches: Match[],
    schedule: GameweekSchedule[],
    matchHistory: Map<string, number>
  ) {
    if (this.timeExceeded) return;
    if (Date.now() - this.startTime > this.TIME_LIMIT_MS) {
      this.timeExceeded = true;
      return;
    }

    // Goal test: Are we done with all gameweeks?
    if (currentGameweek > this.targetGameweeks) {
      if (schedule.length > this.bestSchedule.length) {
        this.bestSchedule = JSON.parse(JSON.stringify(schedule)); // Deep copy
        this.maxDepth = schedule.length;
      }
      return;
    }

    // If current gameweek is an exclusion week, just skip to next
    if (this.exclusionWeeks.has(currentGameweek)) {
      schedule.push({ gameweek: currentGameweek, matches: [] }); // Empty week
      this.backtrack(currentGameweek + 1, [], schedule, matchHistory);
      schedule.pop();
      return;
    }

    // Goal test for inside a gameweek: We need 10 matches for 20 teams
    if (currentMatches.length === this.teams.length / 2) {
      schedule.push({ gameweek: currentGameweek, matches: [...currentMatches] });
      
      // Update max depth tracker
      if (schedule.length > this.bestSchedule.length) {
        this.bestSchedule = JSON.parse(JSON.stringify(schedule));
        this.maxDepth = schedule.length;
      }

      this.backtrack(currentGameweek + 1, [], schedule, matchHistory);
      schedule.pop();
      return;
    }

    this.nodesExplored++;

    // Pick first available team not yet playing in currentMatches
    const availableTeams = this.teams.filter(
      t => !currentMatches.some(m => m.home_team === t || m.away_team === t)
    );

    if (availableTeams.length < 2) return; // Dead end

    // MRV heuristic (simplified): Pick the first available team as Home, try all others as Away
    const homeTeam = availableTeams[0];

    for (let i = 1; i < availableTeams.length; i++) {
      const awayTeam = availableTeams[i];
      
      if (this.isValidAssigment(homeTeam, awayTeam, currentGameweek, schedule, matchHistory)) {
        
        // Apply assignment
        currentMatches.push({ home_team: homeTeam, away_team: awayTeam });
        matchHistory.set(`${homeTeam}-${awayTeam}`, 1);

        // Recursive descent
        this.backtrack(currentGameweek, currentMatches, schedule, matchHistory);

        // Remove assignment (Backtrack)
        currentMatches.pop();
        matchHistory.set(`${homeTeam}-${awayTeam}`, 0);
        
        if (this.timeExceeded) return;
      }
    }
  }

  public generate(): CSPScheduleResult {
    this.startTime = Date.now();
    
    const matchHistory = new Map<string, number>();

    this.backtrack(1, [], [], matchHistory);

    const execTime = Date.now() - this.startTime;

    return {
      schedule: this.bestSchedule,
      telemetry: {
        execution_time_ms: execTime,
        nodes_explored: this.nodesExplored,
        depth_reached: this.maxDepth,
        is_complete: this.maxDepth === this.targetGameweeks && !this.timeExceeded
      }
    };
  }
}
