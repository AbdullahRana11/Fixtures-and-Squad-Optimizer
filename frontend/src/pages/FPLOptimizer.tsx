import React, { useState, useEffect } from 'react';
import PlayerCard from '../components/PlayerCard';
import teamPitchBackground from "../assets/pics/background_pic.png";
import logo from "../assets/pics/PSL-logo.png";
import { useFplStore, Player } from '../store/fplStore';
import { RefreshCw, X, Loader2, Settings2, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

// 4-4-2 Football formation mapping, tweaked from cricket's oval.
const formation = [
  { left: "50%", top: "4%" },   // GK
  
  { left: "15%", top: "27%" },  // DEF
  { left: "38%", top: "27%" }, 
  { left: "62%", top: "27%" }, 
  { left: "85%", top: "27%" }, 

  { left: "15%", top: "54%" },  // MID
  { left: "38%", top: "54%" }, 
  { left: "62%", top: "54%" }, 
  { left: "85%", top: "54%" }, 

  { left: "35%", top: "82%" },  // FWD
  { left: "65%", top: "82%" }, 
];

export default function FPLOptimizer() {
  const { squad, budget, gameweek, projectedPoints, isLoading, error, optimize, swapPlayer, clearError } = useFplStore();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [swapCandidates, setSwapCandidates] = useState<Player[]>([]);
  const [modalLoading, setModalLoading] = useState(false);

  const location = useLocation();
  const { optimizedResult, matchweek } = (location.state as any) || {};

  // Parse Top 11 (Starters) based on FPL constraints for 4-4-2
  let starters: Player[] = [];
  if (squad.length === 15) {
    const gks = squad.filter(p => p.position === 'GK');
    const defs = squad.filter(p => p.position === 'DEF');
    const mids = squad.filter(p => p.position === 'MID');
    const fwds = squad.filter(p => p.position === 'FWD');
    starters = [
      gks[0],
      defs[0], defs[1], defs[2], defs[3],
      mids[0], mids[1], mids[2], mids[3],
      fwds[0], fwds[1]
    ];
  }

  // Initial load
  useEffect(() => {
    if (optimizedResult) {
      useFplStore.getState().setOptimizationResult(optimizedResult);
      // clear state so it doesn't re-trigger on refresh if we handle differently later, 
      // but react router window.history holds state. Just consuming it is fine.
    } else if (squad.length === 0 && !isLoading) {
      optimize(false);
    }
  }, [optimizedResult]);

  // Swap Modal logic
  useEffect(() => {
    if (selectedPlayer) {
      setModalLoading(true);
      const clubCounts: Record<string, number> = {};
      squad.forEach(p => { clubCounts[p.club] = (clubCounts[p.club] || 0) + 1; });
      clubCounts[selectedPlayer.club]--; // Remove the player we are swapping out
      const excludeClubs = Object.keys(clubCounts).filter(c => clubCounts[c] >= 3);
      const totalAvailableBudget = budget + Number(selectedPlayer.cost_millions || 0);

      axios.post('http://localhost:3000/api/fpl/swap-node', {
         remaining_budget: totalAvailableBudget,
         required_position: selectedPlayer.position,
         exclude_clubs: excludeClubs
      }).then(res => {
         setSwapCandidates(res.data.candidates);
         setModalLoading(false);
      }).catch(err => {
         console.error(err);
         setModalLoading(false);
      });
    }
  }, [selectedPlayer, squad, budget]);

  return (
    <>
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#E50000]/20 border border-[#E50000] text-white px-6 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-[0_0_20px_rgba(229,0,0,0.4)]"
          >
            <AlertTriangle className="text-[#E50000] w-5 h-5" />
            <span className="font-sans text-sm">{error}</span>
            <button onClick={clearError} className="ml-4 text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 6, 0.3), rgba(7, 11, 8, 0.62), rgba(10, 14, 8, 0.85)), url(${teamPitchBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      
      <section className="relative z-10 min-h-[960px] pt-4 md:pt-6 pb-20 max-w-[2000px] mx-auto overflow-hidden">
        
        {/* Floating Top Panel */}
        <div className="absolute right-4 top-4 z-20 rounded-xl border border-white/20 bg-[#1e2e17]/70 p-4 backdrop-blur-md transition-all hover:scale-105 shadow-[0_0_15px_rgba(163,230,53,0.1)] hover:shadow-[0_20px_40px_rgba(10,20,8,0.7),0_0_35px_rgba(163,230,53,0.2)]">
          <h3 className="text-sm font-semibold text-lime-100 flex items-center gap-2">
            Team Value Prediction: {projectedPoints.toFixed(1)} pts
          </h3>
          <ul className="mt-2 text-xs text-zinc-100 flex flex-col gap-1">
            <li className="flex justify-between w-full"><span>Remaining Budget:</span> <span className="font-bold text-emerald-400">£{budget.toFixed(1)}m</span></li>
            <li className="flex justify-between w-full"><span>Gameweek:</span> <span className="font-bold">{gameweek}</span></li>
          </ul>
          <button 
             onClick={() => optimize(true)} 
             disabled={isLoading}
             className="w-full mt-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-black py-1.5 rounded text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(52,211,153,0.6)] flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {isLoading ? "CALCULATING..." : "SHUFFLE SQUAD"}
          </button>
        </div>

        {/* Title Block */}
        <div className="relative z-10 mb-8 flex items-center justify-center gap-6 mt-16 lg:mt-0 xl:justify-start xl:pl-20">
          <img src={logo} alt="PSL Logo" className="h-16 w-16 md:h-24 md:w-24 scale-110 object-contain drop-shadow-[0_0_15px_rgba(163,230,53,0.6)]" />
          <h2 className="select-none bg-gradient-to-r from-emerald-300 via-teal-200 to-lime-200 bg-clip-text text-2xl font-extrabold uppercase tracking-[0.15em] text-transparent drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] md:text-3xl lg:text-4xl text-center xl:text-left">
            My Fantasy Best 11
          </h2>
        </div>

        {/* Mobile Grid Layout */}
        <div className="grid gap-3 sm:grid-cols-2 lg:hidden px-4">
          {starters.length === 0 && isLoading ? (
            <div className="col-span-full text-center text-emerald-400 mt-20 flex flex-col items-center">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-bold uppercase tracking-widest text-sm">Processing K-Best Logic...</p>
            </div>
          ) : (
            starters.map((player, index) => (
              <div key={player.id} className="flex justify-center w-full">
                <PlayerCard player={player} isActive={index === 0 || index === 9} compact onClick={() => setSelectedPlayer(player)} />
              </div>
            ))
          )}
        </div>

        {/* Desktop Pitch Layout */}
        <div className="relative hidden lg:block" style={{ height: "1150px" }}>
          {starters.length === 0 && isLoading ? (
            <AnimatePresence>
              <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="absolute inset-0 flex justify-center items-center text-emerald-400"
              >
                 <div className="flex flex-col items-center">
                   <Loader2 className="w-16 h-16 animate-spin mb-6" />
                   <p className="font-bold uppercase tracking-[0.3em]">Executing Branch & Bound Constraints...</p>
                 </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <AnimatePresence>
              {starters.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.8, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -30 }}
                  transition={{ delay: index * 0.05, type: "spring", stiffness: 200, damping: 15 }}
                  className="absolute flex justify-center w-[180px] -translate-x-1/2"
                  style={{ left: formation[index].left, top: formation[index].top, zIndex: 30 - index }}
                >
                  <PlayerCard player={player} isActive={index === 9 || index === 10} compact onClick={() => setSelectedPlayer(player)} />
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Constraints Swap Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div 
              className="relative w-full max-w-xl p-8 rounded-xl border border-white/10 bg-[#0a0a0c] shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              onClick={e => e.stopPropagation()}
            >
              <button 
                className="absolute top-5 right-5 text-zinc-500 hover:text-white transition-colors p-2 rounded-full border border-white/5 bg-white/5" 
                onClick={() => setSelectedPlayer(null)}
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-5 mb-8 pb-6 border-b border-white/10">
                <div className="w-16 h-16 rounded border border-emerald-500/50 bg-emerald-500/10 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                  <span className="font-bold text-lg text-emerald-400">{selectedPlayer.position}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold uppercase tracking-widest text-zinc-100 mb-1">{selectedPlayer.name}</h2>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="text-zinc-400">Current Cost: £{selectedPlayer.cost_millions}m</span>
                    <span className="text-emerald-500">Vol: {((selectedPlayer as any).dynamicValue || selectedPlayer.points).toFixed(1)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <h3 className="text-xs text-lime-400 flex items-center justify-between font-bold uppercase tracking-widest mb-4">
                  <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Valid Replacements</span>
                  <span className="text-white/40">Budget: £{(budget + Number(selectedPlayer.cost_millions)).toFixed(1)}m</span>
                </h3>
                
                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center py-10 text-emerald-400/50">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-400" />
                    <span className="text-xs uppercase tracking-widest">Evaluating Nodes...</span>
                  </div>
                ) : (
                  swapCandidates.map((candidate, i) => {
                     const dynDiff = ((candidate as any).dynamicValue || candidate.points) - ((selectedPlayer as any).dynamicValue || selectedPlayer.points);
                     
                     return (
                        <div 
                          key={candidate.id} 
                          className="flex items-center justify-between p-3 rounded bg-[#121316] border border-white/5 hover:border-emerald-400/50 hover:bg-emerald-900/10 transition-colors cursor-pointer group"
                          onClick={() => {
                             swapPlayer(selectedPlayer.id, candidate);
                             setSelectedPlayer(null);
                          }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded border border-white/10 bg-black/50 flex items-center justify-center text-[10px] text-zinc-500 font-mono">
                              {candidate.club.substring(0,3).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-zinc-200 group-hover:text-emerald-400 uppercase tracking-widest">{candidate.name}</span>
                              <div className="flex gap-3 text-[10px] mt-1 items-center font-mono">
                                 <span className="text-zinc-500">£{candidate.cost_millions}m</span>
                                 {dynDiff > 0 ? (
                                    <span className="text-emerald-400">+{dynDiff.toFixed(1)} Pts</span>
                                 ) : (
                                    <span className="text-red-400">{dynDiff.toFixed(1)} Pts</span>
                                 )}
                              </div>
                            </div>
                          </div>
                          <button className="px-4 py-1.5 text-xs text-black font-bold bg-emerald-500 rounded hover:shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                            Swap
                          </button>
                        </div>
                     );
                  })
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
