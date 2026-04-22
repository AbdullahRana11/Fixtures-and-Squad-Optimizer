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

  optimize: async (shuffle = false) => {
    const { budget, gameweek, kIndex } = get();
    const nextKIndex = shuffle ? kIndex + 1 : 1;

    set({ isLoading: true, error: null });

    try {
      const response = await axios.post('http://localhost:3000/api/fpl/optimize', {
        budget,
        gameweek,
        k_index: nextKIndex
      });

      const { squad, summary } = response.data;
      
      set({ 
        squad, 
        projectedPoints: summary.total_dynamic_value,
        kIndex: nextKIndex,
        isLoading: false
      });
      
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || "Failed to optimize squad mathematically.";
      
      // If we shuffled and hit a dead end, we could revert to 1, but let's show the error
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
    isLoading: false,
    error: null,
  })
}));
