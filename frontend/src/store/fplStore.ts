import { create } from 'zustand';
import axios from 'axios';

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  points: number;
  cost_millions: string | number;
  club: string;
}

interface FPLState {
  squad: Player[];
  budget: number;
  projectedPoints: number;
  kIndex: number;
  isLoading: boolean;
  error: string | null;
  gameweek: number;
  seasonalFixtures: any | null;
  fixtureContext: Record<string, string>; // Team -> Opponent Name
  
  fetchSeasonPool: () => Promise<void>;
  optimize: (shuffle?: boolean) => Promise<void>;
  swapPlayer: (oldId: string, newPlayer: Player) => void;
  setBudget: (budget: number) => void;
  setGameweek: (gw: number) => void;
  clearError: () => void;
  setOptimizationResult: (data: any) => void;
}

export const useFplStore = create<FPLState>((set, get) => ({
  squad: [],
  budget: 100.0,
  projectedPoints: 0,
  kIndex: 1,
  isLoading: false,
  error: null,
  gameweek: 1,
  seasonalFixtures: null,
  fixtureContext: {},

  fetchSeasonPool: async () => {
    try {
      const { data } = await axios.get('http://localhost:3000/api/fixtures/pl/season');
      set({ seasonalFixtures: data });
    } catch (err) {
      console.error("Failed to fetch seasonal pool", err);
    }
  },

  optimize: async (shuffle = false) => {
    const { budget, gameweek, kIndex, seasonalFixtures } = get();
    const nextKIndex = shuffle ? kIndex + 1 : 1;

    set({ isLoading: true, error: null });

    try {
      // Extract fixtures for the current gameweek from the flat array
      let fixtures: any[] = [];
      if (seasonalFixtures && seasonalFixtures.fixtures) {
        fixtures = seasonalFixtures.fixtures
          .filter((f: any) => Number(f.matchweek) === Number(gameweek))
          .map((f: any) => ({ home: f.home, away: f.away }));
      }

      // If we have fixtures, use the specialized optimize-matchweek endpoint
      const endpoint = fixtures.length > 0 
        ? 'http://localhost:3000/api/fpl/optimize-matchweek' 
        : 'http://localhost:3000/api/fpl/optimize';
      
      const payload = fixtures.length > 0
        ? { budget, matchweek: gameweek, fixtures, k_index: nextKIndex }
        : { budget, gameweek, k_index: nextKIndex };

      const response = await axios.post(endpoint, payload);
      const { squad, summary } = response.data;

      // Mapping Full Team Name -> FPL Short Code (Robust Variations)
      const TEAM_CODE_MAP: Record<string, string> = {
        'Arsenal': 'ARS', 'Aston Villa': 'AVL', 'Bournemouth': 'BOU', 'Brentford': 'BRE',
        'Brighton': 'BHA', 'Brighton & Hove Albion': 'BHA', 'Chelsea': 'CHE', 'Crystal Palace': 'CRY',
        'Everton': 'EVE', 'Fulham': 'FUL', 'Ipswich Town': 'IPS', 'Ipswich': 'IPS', 'Leicester City': 'LEI', 
        'Leicester': 'LEI', 'Liverpool': 'LIV', 'Manchester City': 'MCI', 'Man City': 'MCI',
        'Manchester United': 'MUN', 'Man Utd': 'MUN', 'Newcastle United': 'NEW', 'Newcastle': 'NEW',
        'Nottingham Forest': 'NFO', 'Southampton': 'SOU', 'Tottenham Hotspur': 'TOT', 'Tottenham': 'TOT', 'Spurs': 'TOT',
        'West Ham United': 'WHU', 'West Ham': 'WHU', 'Wolverhampton Wanderers': 'WOL', 'Wolves': 'WOL'
      };

      // Build fixture context ONLY for the current gameweek (Double-Keyed)
      const fixtureContext: Record<string, string> = {};
      
      // Strict filtering with type normalization
      const currentWeekFixtures = fixtures.filter(f => 
        String(f.matchweek) === String(gameweek)
      );

      currentWeekFixtures.forEach(f => {
        const homeCode = TEAM_CODE_MAP[f.home] || f.home;
        const awayCode = TEAM_CODE_MAP[f.away] || f.away;
        
        // Store under codes
        fixtureContext[homeCode] = awayCode;
        fixtureContext[awayCode] = homeCode;
        
        // Store under original names for safety
        fixtureContext[f.home] = awayCode;
        fixtureContext[f.away] = homeCode;
      });

      set({ 
        squad, 
        projectedPoints: summary.total_dynamic_value,
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
  clearError: () => set({ error: null }),
  setOptimizationResult: (data) => set({
    squad: data.squad,
    projectedPoints: data.summary.total_dynamic_value,
    gameweek: data.matchweek || get().gameweek,
    fixtureContext: data.fixture_context || {},
    isLoading: false,
    error: null,
  })
}));
