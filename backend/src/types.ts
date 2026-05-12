/**
 * backend/src/types.ts
 * 
 * Shared types across backend engines and controllers.
 */

export interface TeamInfo {
  name: string;
  city: string;
  stadium: string;
  biggest_rival: string | null;
  policing_conflict: string | null;
  uefa_pot?: number;
  rating?: number;
}

export interface PredictionData {
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  predictedScore: { home: number; away: number };
  keyInsight: string;
}

export interface FixtureMatch {
  id: string;
  matchweek: number;
  home: string;
  away: string;
  date: string;        // ISO date string YYYY-MM-DD or full ISO
  time: string;        // HH:MM
  stadium: string;
  is_derby: boolean;
  broadcaster?: string; // TV slot assignment (Sky Sports, TNT, etc.)
  matchIntensity: 'Low' | 'Medium' | 'High' | 'Extreme';
  isLocked?: boolean;
  prediction?: PredictionData;
}

export interface ConstraintProfile {
  lockedFixtures?: { home: string; away: string; matchweek: number }[];
  europeanTeams?: string[];    // Teams requiring 3-day rest after European games
  geoCluster?: boolean;        // Prevent same-city teams being home simultaneously
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

export interface UCLTeam extends TeamInfo {
  country: string;
  pot: number;
  coefficient: number;
  rating: number;
}

export interface ForcedResult {
  fixtureId: string;
  homeGoals: number;
  awayGoals: number;
}
