// ============================================================
// api.ts — Central API service layer
// Place this file at: frontend/src/api/api.ts
// ============================================================

// In production (HF Spaces / Docker) VITE_API_URL is "" so requests go to
// the same origin that serves the React app (Express handles /api/* routes).
// In local dev it falls back to the backend dev server on port 3001.
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';


async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface BackendTeam {
  id: string | number;
  name: string;
  league: string;
  city: string;
  stadium: string;
  biggest_rival: string | null;
  policing_conflict: string | null;
  other_rivals: string | null;
  country_code: string | null;
  uefa_pot: number | null;
  home_advantage: number | null;
  geographic_zone: string | null;
  winter_restricted: boolean | null;
  logo: string | null;
}

export interface TeamsResponse {
  league: string;
  totalAvailable: number;
  requiredCount: number;
  topLeague: string | null;
  teams: BackendTeam[];
}

export interface FixtureMatch {
  id: string;
  home: string;
  away: string;
  round: number;
  matchday?: number;
  date?: string;
  time?: string;
  matchweek?: number;
  broadcaster?: string;
  stadium?: string;
  is_derby?: boolean;
  matchIntensity?: string;
  predicted_winner?: string;
  homeWinProb?: number;
  drawProb?: number;
  awayWinProb?: number;
  odds?: { home: number; draw: number; away: number };
}

export interface GeneratedFixturesResponse {
  league: string;
  type: string;
  rounds?: number;
  matches?: FixtureMatch[];
  bracket?: any;
  schedule?: any;
}

export interface ProjectedScoreline {
  most_likely: string;
  alternatives: string[];
  home_cs_probability: number;
  away_cs_probability: number;
}

export interface PredictMatchResponse {
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
  broadcasterSlot: string;
  derbyModifierApplied: boolean;
}

export interface FPLPlayer {
  id: string | number;
  name: string;
  club: string;
  position: string;
  cost_millions: number;
  overall_ability: number;
  base_form: number;
  expectation_status: string;
  goals?: number;
  assists?: number;
  clean_sheets?: number;
  points?: number;
}

export interface OptimizeSquadResponse {
  squad: FPLPlayer[];
  starting_xi: FPLPlayer[];
  bench: FPLPlayer[];
  total_cost: number;
  projected_points: number;
  telemetry?: any;
}

export interface SwapCandidatesResponse {
  candidates: (FPLPlayer & { dynamicValue: number })[];
}

export interface Tournament {
  id: string;
  type: string;
  name: string;
  status: string;
  bracket: any;
  settings: any;
  updated_at?: string;
}

export interface ReschedulingLog {
  id: string;
  change_type: string;
  description: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// FIXTURE ENDPOINTS
// ─────────────────────────────────────────────

/** Fetch all available teams for a given league from the DB */
export const fetchTeams = (league: string) =>
  request<TeamsResponse>('GET', `/api/fixtures/teams/${league}`);

/** Generate fixtures using the real backend algorithm */
export const generateFixtures = (payload: {
  league: string;
  teamNames: string[];
  mode?: string;
  constraintProfile?: any;
}) => request<GeneratedFixturesResponse>('POST', '/api/fixtures/generate', payload);

/** AI-powered match prediction */
export const predictMatch = (payload: {
  homeTeam: string;
  awayTeam: string;
  homeLeague?: string;
  awayLeague?: string;
  isDerby?: boolean;
  homePot?: number;
  awayPot?: number;
}) => request<PredictMatchResponse>('POST', '/api/fixtures/predict', payload);

/** Suggest a modification for a fixture inside an existing schedule */
export const modifyFixture = (payload: { schedule: any; fixtureId: string }) =>
  request<any>('POST', '/api/fixtures/modify', payload);

/** Advance FA Cup to the next round given current winners */
export const advanceFACupRound = (payload: { bracket: any; winners: string[] }) =>
  request<any>('POST', '/api/fixtures/fa-cup/next-round', payload);

/** Advance UCL knockout bracket to the next round */
export const advanceUCLRound = (payload: {
  bracket: any;
  winners: string[];
  roundIndex: number;
}) => request<any>('POST', '/api/fixtures/ucl/next-round', payload);

/** Fetch a full PL season schedule (38 matchweeks) */
export const getSeasonFixtures = () =>
  request<any>('GET', '/api/fixtures/pl/season');

/** Sync tournaments (cross-competition conflict resolution) */
export const syncTournaments = (payload: {
  plTournamentId?: string;
  faCupTournamentId?: string;
}) => request<any>('POST', '/api/fixtures/sync-tournaments', payload);

/** Fetch the rescheduling log */
export const getReschedulingLog = () =>
  request<ReschedulingLog[]>('GET', '/api/fixtures/rescheduling-log');

/** Generate 36-team UCL Swiss model schedule */
export const generateUCLSwiss = (payload?: { constraintProfile?: any }) =>
  request<any>('POST', '/api/fixtures/ucl-swiss/generate', payload);

/** Run What-If simulation on a schedule */
export const simulateFixtures = (payload: { schedule: any; forcedResults: any[] }) =>
  request<any>('POST', '/api/fixtures/simulate', payload);

// ─────────────────────────────────────────────
// TOURNAMENT PERSISTENCE
// ─────────────────────────────────────────────

export const saveTournament = (payload: {
  id?: string;
  type: string;
  name?: string;
  status?: string;
  bracket: any;
  settings?: any;
}) => request<Tournament>('POST', '/api/tournaments/save', payload);

export const getTournament = (id: string) =>
  request<Tournament>('GET', `/api/tournaments/${id}`);

export const getTournamentsByType = (type: string) =>
  request<Tournament[]>('GET', `/api/tournaments/type/${type}`);

// ─────────────────────────────────────────────
// FPL / SQUAD OPTIMIZER
// ─────────────────────────────────────────────

/** Fetch all FPL players from the backend DB */
export const fetchFPLPlayers = () =>
  request<FPLPlayer[]>('GET', '/api/fpl/players');

/** Run the knapsack optimizer to find the best 15-man squad */
export const optimizeSquad = (payload: {
  budget: number;
  gameweek?: number;
  k_index?: number;
  customPlayers?: Partial<FPLPlayer>[];
}) => request<OptimizeSquadResponse>('POST', '/api/fpl/optimize', payload);

/** Find best swap candidates for a given position within budget */
export const getSwapCandidates = (payload: {
  remaining_budget: number;
  required_position: string;
  exclude_clubs: string[];
}) => request<SwapCandidatesResponse>('POST', '/api/fpl/swap-node', payload);

/** Optimize for a specific matchweek given upcoming fixtures */
export const optimizeMatchweek = (payload: {
  budget?: number;
  matchweek: number;
  fixtures: Array<{ home: string; away: string }>;
  k_index?: number;
  customPlayers?: Partial<FPLPlayer>[];
}) => request<OptimizeSquadResponse>('POST', '/api/fpl/optimize-matchweek', payload);

// ─────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────

/** Fetch top 50 player stats leaderboard */
export const fetchPlayerStats = () =>
  request<FPLPlayer[]>('GET', '/api/stats/players');

// ─────────────────────────────────────────────
// UCL DRAW
// ─────────────────────────────────────────────

/** Run the constraint-based UCL draw for the next match */
export const drawUCLMatch = (drawn_team_ids: string[]) =>
  request<any>('POST', '/api/ucl/draw-match', { drawn_team_ids });
