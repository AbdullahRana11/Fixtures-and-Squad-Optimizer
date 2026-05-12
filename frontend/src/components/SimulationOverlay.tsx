import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { simulateFixtures } from '../api/api';

interface SimulationOverlayProps {
  isVisible: boolean;
  fixture: {
    id: string;
    home: string;
    away: string;
    date: string;
  } | null;
  onClose: () => void;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = ({ isVisible, fixture, onClose }) => {
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const { generatedFixtures, setSimulationResult, setIsSimulating, addForcedResult, addDebugLog } = useAppStore();

  const handleSimulate = async () => {
    if (!fixture) return;
    addDebugLog(`Initializing simulation: ${fixture.home} vs ${fixture.away} (${homeGoals}-${awayGoals})`, 'info');
    setIsSimulating(true);
    onClose();

    try {
      addForcedResult({ fixtureId: fixture.id, homeGoals, awayGoals });
      
      const result = await simulateFixtures({ 
        schedule: generatedFixtures, 
        forcedResults: [{ fixtureId: fixture.id, homeGoals, awayGoals }] 
      });
      
      setSimulationResult(result);
      addDebugLog(`Simulation complete. Butterfly effect recalculated. Found ${result.fatigueWarnings.length} fatigue warnings.`, 'info');
    } catch (err) {
      console.error("Simulation failed:", err);
      addDebugLog(`Simulation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && fixture && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-md bg-[#0a0a0a] border border-emerald-500/20 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-transparent">
              <h3 className="text-emerald-400 font-bold tracking-tight">⚡ RESULT INJECTION ENGINE</h3>
              <p className="text-zinc-500 text-xs mt-1 uppercase tracking-wider">Predicting the Butterfly Effect</p>
            </div>

            {/* Selector */}
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 text-center">
                  <p className="text-white font-medium mb-2 truncate">{fixture.home}</p>
                  <input 
                    type="number" 
                    value={homeGoals} 
                    onChange={(e) => setHomeGoals(parseInt(e.target.value) || 0)}
                    min="0"
                    max="9"
                    className="w-16 h-16 bg-zinc-900 border border-emerald-500/30 rounded-xl text-center text-2xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                
                <div className="text-zinc-600 font-bold text-xl">VS</div>

                <div className="flex-1 text-center">
                  <p className="text-white font-medium mb-2 truncate">{fixture.away}</p>
                  <input 
                    type="number" 
                    value={awayGoals} 
                    onChange={(e) => setAwayGoals(parseInt(e.target.value) || 0)}
                    min="0"
                    max="9"
                    className="w-16 h-16 bg-zinc-900 border border-emerald-500/30 rounded-xl text-center text-2xl font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/10">
                <p className="text-emerald-500/70 text-[10px] uppercase font-bold mb-1">Tactical Impact</p>
                <p className="text-zinc-400 text-xs">Injecting this result will recalculate the entire league table and update fatigue projections for all downstream fixtures.</p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 flex gap-3 bg-white/5">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulate}
                className="flex-[2] px-4 py-3 rounded-xl bg-emerald-500 text-black text-sm font-bold hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                RUN SIMULATION
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
