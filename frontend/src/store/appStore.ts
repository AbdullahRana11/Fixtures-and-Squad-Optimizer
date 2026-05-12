// ============================================================
// appStore.ts — REPLACE frontend/src/store/appStore.ts
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BackendTeam, FPLPlayer, OptimizeSquadResponse, Tournament } from '../api/api';

export type ThemeVariant = 'mint-cyan' | 'purple-rose' | 'gold-cyan' | 'mint-purple' | 'monochrome' | 'light-mono';
export type AppMode = 'entry' | 'mode-select' | 'fixture-generator' | 'squad-optimizer';
export type FixtureView = 'league-select' | 'team-select' | 'fixture-display';

interface AppState {
  // ── Navigation ──────────────────────────────────────────
  appMode: AppMode;
  fixtureView: FixtureView;

  // ── UI ──────────────────────────────────────────────────
  theme: ThemeVariant;
  soundEnabled: boolean;

  // ── Fixture Generator ───────────────────────────────────
  selectedLeague: string | null;
  selectedTeams: string[];          // team *names* from backend
  backendTeams: BackendTeam[];      // all teams fetched from /api/fixtures/teams/:league
  generatedFixtures: any;           // full response from /api/fixtures/generate
  isLoadingTeams: boolean;
  isGeneratingFixtures: boolean;
  fixtureError: string | null;

  // ── Constraint Profile ──────────────────────────────────
  constraintProfile: {
    lockedFixtures: { home: string; away: string; matchweek: number }[];
    europeanTeams: string[];
    geoCluster: boolean;
  };
  // ── Tournament Persistence ──────────────────────────────
  currentTournamentId: string | null;
  savedTournaments: Tournament[];

  // ── Squad Optimizer ─────────────────────────────────────
  fplPlayers: FPLPlayer[];
  squadResult: OptimizeSquadResponse | null;
  squadBudget: number;
  squadKIndex: number;
  isOptimizing: boolean;
  optimizeError: string | null;

  // ── Simulation Engine ──────────────────────────────────
    simulationResult: {
    standings: any[];
    butterflyEffects: any[];
    fatigueWarnings: any[];
    summary?: any;
  } | null;
  forcedResults: { fixtureId: string; homeGoals: number; awayGoals: number }[];
  isSimulating: boolean;

  // ── Actions ─────────────────────────────────────────────
  setAppMode: (mode: AppMode) => void;
  setFixtureView: (view: FixtureView) => void;
  setTheme: (theme: ThemeVariant) => void;
  toggleSound: () => void;

  setSelectedLeague: (leagueId: string | null) => void;
  setSelectedTeams: (teams: string[]) => void;
  setBackendTeams: (teams: BackendTeam[]) => void;
  setGeneratedFixtures: (data: any) => void;
  setIsLoadingTeams: (v: boolean) => void;
  setIsGeneratingFixtures: (v: boolean) => void;
  setFixtureError: (msg: string | null) => void;
  setConstraintProfile: (profile: Partial<AppState['constraintProfile']>) => void;

  setSimulationResult: (result: AppState['simulationResult']) => void;
  setForcedResults: (results: AppState['forcedResults']) => void;
  setIsSimulating: (v: boolean) => void;
  addForcedResult: (res: AppState['forcedResults'][0]) => void;
  clearSimulation: () => void;

  setCurrentTournamentId: (id: string | null) => void;
  setSavedTournaments: (t: Tournament[]) => void;

  setFplPlayers: (players: FPLPlayer[]) => void;
  setSquadResult: (result: OptimizeSquadResponse | null) => void;
  setSquadBudget: (b: number) => void;
  setSquadKIndex: (k: number) => void;
  setIsOptimizing: (v: boolean) => void;
  setOptimizeError: (msg: string | null) => void;

  resetFixtureState: () => void;
  resetSquadState: () => void;

  // ── Debug Logging ───────────────────────────────────────
  debugLogs: { timestamp: string; message: string; type: 'info' | 'warning' | 'error' }[];
  addDebugLog: (msg: string, type?: 'info' | 'warning' | 'error') => void;
  clearDebugLogs: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      appMode: 'entry',
      fixtureView: 'league-select',

      // UI
      theme: 'mint-cyan',
      soundEnabled: true,

      // Fixture Generator
      selectedLeague: null,
      selectedTeams: [],
      backendTeams: [],
      generatedFixtures: null,
      isLoadingTeams: false,
      isGeneratingFixtures: false,
      fixtureError: null,

      // Constraint Profile defaults
      constraintProfile: {
        lockedFixtures: [],
        europeanTeams: [],
        geoCluster: false,
      },

      // Tournament
      currentTournamentId: null,
      savedTournaments: [],

      // Squad Optimizer
      fplPlayers: [],
      squadResult: null,
      squadBudget: 100,
      squadKIndex: 1,
      isOptimizing: false,
      optimizeError: null,

      // Simulation Engine
      simulationResult: null,
      forcedResults: [],
      isSimulating: false,

      // Debug Logging
      debugLogs: [],

      // Actions
      setAppMode: (mode) => set({ appMode: mode }),
      setFixtureView: (view) => set({ fixtureView: view }),
      setTheme: (theme) => set({ theme }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),

      setSelectedLeague: (leagueId) => set({ selectedLeague: leagueId }),
      setSelectedTeams: (teams) => set({ selectedTeams: teams }),
      setBackendTeams: (teams) => set({ backendTeams: teams }),
      setGeneratedFixtures: (data) => set({ generatedFixtures: data }),
      setIsLoadingTeams: (v) => set({ isLoadingTeams: v }),
      setIsGeneratingFixtures: (v) => set({ isGeneratingFixtures: v }),
      setFixtureError: (msg) => set({ fixtureError: msg }),
      setConstraintProfile: (profile) =>
        set((s) => ({ constraintProfile: { ...s.constraintProfile, ...profile } })),

      setSimulationResult: (result) => set({ simulationResult: result }),
      setForcedResults: (results) => set({ forcedResults: results }),
      setIsSimulating: (v) => set({ isSimulating: v }),
      addForcedResult: (res) => set((s) => {
        const existing = s.forcedResults.filter(f => f.fixtureId !== res.fixtureId);
        return { forcedResults: [...existing, res] };
      }),
      clearSimulation: () => set({ forcedResults: [], simulationResult: null }),

      setCurrentTournamentId: (id) => set({ currentTournamentId: id }),
      setSavedTournaments: (t) => set({ savedTournaments: t }),

      setFplPlayers: (players) => set({ fplPlayers: players }),
      setSquadResult: (result) => set({ squadResult: result }),
      setSquadBudget: (b) => set({ squadBudget: b }),
      setSquadKIndex: (k) => set({ squadKIndex: k }),
      setIsOptimizing: (v) => set({ isOptimizing: v }),
      setOptimizeError: (msg) => set({ optimizeError: msg }),

      resetFixtureState: () =>
        set({
          selectedLeague: null,
          selectedTeams: [],
          backendTeams: [],
          generatedFixtures: null,
          fixtureView: 'league-select',
          fixtureError: null,
          currentTournamentId: null,
          simulationResult: null,
          forcedResults: [],
        }),

      resetSquadState: () =>
        set({
          fplPlayers: [],
          squadResult: null,
          squadBudget: 100,
          squadKIndex: 1,
          optimizeError: null,
        }),

      addDebugLog: (msg, type = 'info') => set((s) => ({
        debugLogs: [
          { timestamp: new Date().toLocaleTimeString(), message: msg, type },
          ...s.debugLogs.slice(0, 99) // Keep last 100 logs
        ]
      })),
      clearDebugLogs: () => set({ debugLogs: [] }),
    }),
    {
      name: 'fixtures-squad-storage',
      // Only persist certain parts of the state to avoid large or transient data
      partialize: (state) => ({
        theme: state.theme,
        soundEnabled: state.soundEnabled,
        squadBudget: state.squadBudget,
        squadKIndex: state.squadKIndex,
        constraintProfile: state.constraintProfile,
        selectedLeague: state.selectedLeague,
        selectedTeams: state.selectedTeams,
        generatedFixtures: state.generatedFixtures,
        debugLogs: state.debugLogs,
      }),
    }
  )
);
