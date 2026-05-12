import { create } from 'zustand';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
axios.defaults.baseURL = BASE_URL;


export interface Player {
  id: string;
  name: string;
  position: 'WK' | 'BAT' | 'AR' | 'BWL' | 'GK' | 'DEF' | 'MID' | 'FWD' | string;
  points: number;
  cost_millions: string | number;
  club: string;
}

export interface CustomPlayerInput {
  name: string;
  club: string;
  position: 'WK' | 'BAT' | 'AR' | 'BWL' | 'GK' | 'DEF' | 'MID' | 'FWD' | string;
  cost_millions: number;
  overall_ability: number;
  base_form: number;
  expectation_status: string;
}

interface FPLState {
  squad: Player[];
  allPlayers: Player[]; // Full database pool
  customPlayers: CustomPlayerInput[]; // Hypothesis pool (RAM-only, never saved to DB)
  budget: number;
  projectedPoints: number;
  kIndex: number;
  isLoading: boolean;
  error: string | null;
  gameweek: number;
  sportContext: 'football' | 'cricket';
  seasonalFixtures: any | null;
  fixtureContext: Record<string, string>; // Team -> Opponent Name
  
  fetchSeasonPool: () => Promise<void>;
  fetchAllPlayers: () => Promise<void>;
  optimize: (shuffle?: boolean) => Promise<void>;
  swapPlayer: (oldId: string, newPlayer: Player) => void;
  setBudget: (budget: number) => void;
  setGameweek: (gw: number) => void;
  setSportContext: (sport: 'football' | 'cricket') => void;
  clearError: () => void;
  setOptimizationResult: (data: any) => void;
  addCustomPlayer: (player: CustomPlayerInput) => void;
  removeCustomPlayer: (id: string) => void;
  clearCustomPlayers: () => void;
  setFixtureContext: (context: Record<string, string>) => void;
}

let customIdCounter = 0;

export const useFplStore = create<FPLState>((set, get) => ({
  squad: [],
  allPlayers: [],
  customPlayers: [],
  budget: 100.0,
  projectedPoints: 0,
  kIndex: 1,
  isLoading: false,
  error: null,
  gameweek: 1,
  sportContext: 'cricket',
  seasonalFixtures: null,
  fixtureContext: {},

  addCustomPlayer: (player: CustomPlayerInput) => {
    const id = `custom_${++customIdCounter}_${Date.now()}`;
    const enriched = { ...player, id };
    set(state => ({ customPlayers: [...state.customPlayers, enriched as any] }));
  },

  removeCustomPlayer: (id: string) => {
    set(state => ({ customPlayers: state.customPlayers.filter((p: any) => p.id !== id) }));
  },

  clearCustomPlayers: () => set({ customPlayers: [] }),
  
  setFixtureContext: (context: Record<string, string>) => set({ fixtureContext: context }),

  fetchSeasonPool: async () => {
    try {
      const { data } = await axios.get('/api/fixtures/pl/season');
      set({ seasonalFixtures: data });
    } catch (err) {
      console.error("Failed to fetch seasonal pool", err);
    }
  },

  fetchAllPlayers: async () => {
    try {
      const { data } = await axios.get('/api/fpl/players');
      set({ allPlayers: data });
    } catch (err) {
      console.error("Failed to fetch all players", err);
    }
  },

  optimize: async (shuffle = false) => {
    let { budget, gameweek, kIndex, seasonalFixtures, customPlayers, sportContext } = get();
    const nextKIndex = shuffle ? kIndex + 1 : 1;

    set({ isLoading: true, error: null });

    try {
      // Safety: If seasonalFixtures is missing, try to re-hydrate from localStorage
      if (!seasonalFixtures || !seasonalFixtures.fixtures) {
        try {
          const raw = localStorage.getItem('fixture_optimizer_history');
          if (raw) {
            const history = JSON.parse(raw);
            const latestPSL = history.find((h: any) => h.source === 'Pakistan Super League' || h.name === 'Pakistan Super League' || h.source === 'psl' || h.source === 'Premier League' || h.name === 'Premier League');
            if (latestPSL) {
              seasonalFixtures = { fixtures: latestPSL.fixtures, teams: latestPSL.teams };
              set({ seasonalFixtures });
            }
          }
        } catch (e) { /* ignore */ }
      }

      // Extract fixtures for the current gameweek from the flat array
      let fixtures: any[] = [];
      if (seasonalFixtures && seasonalFixtures.fixtures) {
        fixtures = seasonalFixtures.fixtures
          .filter((f: any) => Number(f.matchweek) === Number(gameweek))
          .map((f: any) => ({ home: f.home, away: f.away }));
      }

      console.log(`[FPL] GW${gameweek}: ${fixtures.length} fixtures found, seasonalFixtures has ${seasonalFixtures?.fixtures?.length || 0} total`);

      // If we have fixtures, use the specialized optimize-matchweek endpoint
      const endpoint = fixtures.length > 0 
        ? '/api/fpl/optimize-matchweek' 
        : '/api/fpl/optimize';
      
      // Build backend-compatible custom players payload
      const customPayload = customPlayers.map((cp: any) => ({
        id: cp.id,
        name: cp.name,
        club: cp.club,
        position: cp.position,
        cost_millions: cp.cost_millions,
        overall_ability: cp.overall_ability,
        base_form: cp.base_form,
        expectation_status: cp.expectation_status,
      }));

      const payload = { budget: budget || 100.0, matchweek: gameweek, fixtures, k_index: nextKIndex, customPlayers: customPayload, sport: sportContext };

      const response = await axios.post(endpoint, payload);
      const { squad, summary } = response.data;

      const TEAM_CODE_MAP: Record<string, string> = {
        // PSL full names → short codes
        'Karachi Kings': 'KRK', 'Lahore Qalandars': 'LHQ', 'Islamabad United': 'ISU',
        'Peshawar Zalmi': 'PZL', 'Quetta Gladiators': 'QTG', 'Multan Sultans': 'MLS',
        // Football full names → short codes
        'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE',
        'Brighton': 'BHA', 'Brighton & Hove Albion': 'BHA', 'Chelsea': 'CHE', 'Crystal Palace': 'CRY',
        'Everton': 'EVE', 'Fulham': 'FUL', 'Ipswich Town': 'IPS', 'Ipswich': 'IPS', 'Leicester City': 'LEI', 
        'Leicester': 'LEI', 'Liverpool': 'LIV', 'Manchester City': 'MCI', 'Man City': 'MCI',
        'Manchester United': 'MUN', 'Man Utd': 'MUN', 'Newcastle United': 'NEW', 'Newcastle': 'NEW',
        'Nottingham Forest': 'NFO', 'Southampton': 'SOU', 'Tottenham Hotspur': 'TOT', 'Tottenham': 'TOT', 'Spurs': 'TOT',
        'West Ham United': 'WHU', 'West Ham': 'WHU', 'Wolverhampton Wanderers': 'WOL', 'Wolves': 'WOL',
        // Short code passthrough
        'KRK': 'KRK', 'LHQ': 'LHQ', 'ISU': 'ISU', 'PZL': 'PZL', 'QTG': 'QTG', 'MLS': 'MLS',
        'ARS': 'ARS', 'AVL': 'AVL', 'BOU': 'BOU', 'BRE': 'BRE', 'BHA': 'BHA', 'CHE': 'CHE', 'CRY': 'CRY',
        'EVE': 'EVE', 'FUL': 'FUL', 'IPS': 'IPS', 'LEI': 'LEI', 'LIV': 'LIV', 'MCI': 'MCI', 'MUN': 'MUN',
        'NEW': 'NEW', 'NFO': 'NFO', 'SOU': 'SOU', 'TOT': 'TOT', 'WHU': 'WHU', 'WOL': 'WOL'
      };

      // Build fixture context for the current gameweek
      const fixtureContext: Record<string, string> = {};
      
      // Use the filtered 'fixtures' array directly
      fixtures.forEach(f => {
        const homeCode = TEAM_CODE_MAP[f.home] || f.home;
        const awayCode = TEAM_CODE_MAP[f.away] || f.away;
        
        fixtureContext[homeCode] = awayCode;
        fixtureContext[awayCode] = homeCode;
        fixtureContext[f.home] = awayCode;
        fixtureContext[f.away] = homeCode;
      });

      set({ 
        squad: squad || [], 
        projectedPoints: summary?.total_dynamic_value || 0,
        kIndex: nextKIndex,
        fixtureContext,
        isLoading: false
      });
      
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to optimize squad mathematically.";
      set({ 
        error: msg, 
        isLoading: false,
        kIndex: shuffle ? kIndex : 1 
      });
    }
  },

  swapPlayer: (oldId: string, newPlayer: Player) => {
    const { squad, budget, projectedPoints } = get();
    const oldPlayer = squad.find(p => p.id === oldId);
    
    if (!oldPlayer) return;

    const newSquad = squad.map(p => p.id === oldId ? newPlayer : p);
    
    // Update budget internally (+ old cost - new cost)
    const costDiff = Number(oldPlayer.cost_millions) - Number(newPlayer.cost_millions);
    
    // Naively update points from raw property (assuming they represent dynamic points or fallback)
    const pointDiff = (newPlayer as any).dynamicValue 
      ? (newPlayer as any).dynamicValue - ((oldPlayer as any).dynamicValue || oldPlayer.points)
      : newPlayer.points - oldPlayer.points;

    set({ 
      squad: newSquad,
      budget: budget + costDiff,
      projectedPoints: projectedPoints + pointDiff
    });
  },

  setBudget: (budget) => set({ budget }),
  setGameweek: (gameweek) => set({ gameweek }),
  setSportContext: (sportContext) => set({ sportContext }),
  clearError: () => set({ error: null }),
  setOptimizationResult: (data) => {
    if (!data) return;
    const currentPoints = data.summary?.total_dynamic_value ?? data.points ?? 0;
    set({
      squad: data.squad || [],
      projectedPoints: Number(currentPoints),
      gameweek: data.matchweek || get().gameweek,
      fixtureContext: data.fixtureContext || data.fixture_context || {},
      isLoading: false,
      error: null,
    });
  }
}));
