import React, { useState, useEffect, useMemo } from 'react';
import PlayerCard from '../components/PlayerCard';
import teamPitchBackground from "../assets/pics/background_pic.png";
import logo from "../assets/pics/PSL-logo.png";
import { useFplStore, Player } from '../store/fplStore';
import { RefreshCw, X, Loader2, AlertTriangle, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Target, Repeat, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { getHistory } from '../utils/fixtureUtils';

import arsLogo from "../assets/pics/EPL Logos/arsenal.football-logos.cc.png";
import avlLogo from "../assets/pics/EPL Logos/aston-villa.football-logos.cc.png";
import bhaLogo from "../assets/pics/EPL Logos/brighton.football-logos.cc.png";
import cheLogo from "../assets/pics/EPL Logos/chelsea.football-logos.cc.png";
import eveLogo from "../assets/pics/EPL Logos/everton.football-logos.cc.png";
import livLogo from "../assets/pics/EPL Logos/liverpool.football-logos.cc.png";
import mciLogo from "../assets/pics/EPL Logos/manchester-city.football-logos.cc.png";
import munLogo from "../assets/pics/EPL Logos/manchester-united.football-logos.cc.png";
import newLogo from "../assets/pics/EPL Logos/newcastle.football-logos.cc.png";
import totLogo from "../assets/pics/EPL Logos/tottenham.football-logos.cc.png";
import whuLogo from "../assets/pics/EPL Logos/west-ham.football-logos.cc.png";
import wolLogo from "../assets/pics/EPL Logos/wolves.football-logos.cc.png";

const teamFilters = [
  { id: "ARS", logo: arsLogo, name: "Arsenal" },
  { id: "AVL", logo: avlLogo, name: "Aston Villa" },
  { id: "BHA", logo: bhaLogo, name: "Brighton" },
  { id: "CHE", logo: cheLogo, name: "Chelsea" },
  { id: "EVE", logo: eveLogo, name: "Everton" },
  { id: "LIV", logo: livLogo, name: "Liverpool" },
  { id: "MCI", logo: mciLogo, name: "Man City" },
  { id: "MUN", logo: munLogo, name: "Man Utd" },
  { id: "NEW", logo: newLogo, name: "Newcastle" },
  { id: "TOT", logo: totLogo, name: "Tottenham" },
  { id: "WHU", logo: whuLogo, name: "West Ham" },
  { id: "WOL", logo: wolLogo, name: "Wolves" },
];

function FilterPanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-black/40 p-6 shadow-2xl mb-6">
      <h3 className="mb-6 inline-block bg-gradient-to-r from-emerald-300 via-emerald-200 to-lime-200 bg-clip-text text-[10px] font-black uppercase tracking-[0.4em] text-transparent drop-shadow-md">
        {title}
      </h3>
      {children}
    </section>
  );
}



function initialsFromName(name: string) {
  if (!name || typeof name !== 'string') return "??";
  const parts = name.split(" ").filter(Boolean);
  return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
}

export default function FPLOptimizer() {
  const { 
    squad, allPlayers, gameweek, projectedPoints, isLoading, error, 
    optimize, clearError, setGameweek, fetchSeasonPool, fetchAllPlayers, fixtureContext, swapPlayer,
    setOptimizationResult
  } = useFplStore();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSearch, setSwapSearch] = useState("");
  const location = useLocation();

  const totalSquadCost = (squad || []).reduce((sum, p) => sum + Number(p?.cost_millions || 0), 0);
  const realRemainingBudget = 100.0 - totalSquadCost;
  const safeProjectedPoints = typeof projectedPoints === 'number' && !isNaN(projectedPoints) ? projectedPoints : 0;

  const { starters, dynamicFormation } = useMemo(() => {
    if (!squad || squad.length < 11) return { starters: [], dynamicFormation: [] };
    
    // Ensure we take exactly 11 players for the pitch. 
    // Assuming backend returns best XI in the first 11 slots.
    const squadStarters = squad.slice(0, 11);
    
    const gks = squadStarters.filter(p => p?.position === 'GK');
    const defs = squadStarters.filter(p => p?.position === 'DEF');
    const mids = squadStarters.filter(p => p?.position === 'MID');
    const fwds = squadStarters.filter(p => p?.position === 'FWD');
    
    // FPL requires exactly 1 GK. Fallback if the first 11 somehow omitted a GK.
    if (gks.length === 0) {
      const fallbackGk = squad.find(p => p?.position === 'GK');
      if (fallbackGk) {
         gks.push(fallbackGk);
         if (fwds.length > 1) fwds.pop();
         else if (mids.length > 1) mids.pop();
         else if (defs.length > 1) defs.pop();
      }
    }

    const finalStarters = [...gks, ...defs, ...mids, ...fwds];
    
    const coords: { left: string, top: string }[] = [];
    
    // Goalkeepers
    gks.forEach(() => coords.push({ left: '50%', top: '8%' }));
    
    // Defenders
    const defTop = '32%';
    defs.forEach((_, i) => {
      const total = defs.length;
      const spacing = 88 / Math.max(1, total);
      const start = total === 1 ? 50 : 50 - (spacing * (total - 1)) / 2;
      coords.push({ left: `${total === 1 ? 50 : start + (i * spacing)}%`, top: defTop });
    });
    
    // Midfielders
    const midTop = '62%';
    mids.forEach((_, i) => {
      const total = mids.length;
      const spacing = 88 / Math.max(1, total);
      const start = total === 1 ? 50 : 50 - (spacing * (total - 1)) / 2;
      coords.push({ left: `${total === 1 ? 50 : start + (i * spacing)}%`, top: midTop });
    });
    
    // Forwards
    const fwdTop = '88%';
    fwds.forEach((_, i) => {
      const total = fwds.length;
      const spacing = 75 / Math.max(1, total);
      const start = total === 1 ? 50 : 50 - (spacing * (total - 1)) / 2;
      coords.push({ left: `${total === 1 ? 50 : start + (i * spacing)}%`, top: fwdTop });
    });

    return { starters: finalStarters, dynamicFormation: coords };
  }, [squad]);

  const swapCandidates = useMemo(() => {
    if (!selectedPlayer || !allPlayers) return [];
    return allPlayers
      .filter(p => p.position === selectedPlayer.position && p.id !== selectedPlayer.id)
      .filter(p => p.name.toLowerCase().includes(swapSearch.toLowerCase()))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);
  }, [selectedPlayer, allPlayers, swapSearch]);

  const handleGwChange = (newGw: number) => {
    if (newGw < 1 || newGw > 38) return;
    setGameweek(newGw);
    // Automatically trigger a re-optimization for the selected matchweek
    setTimeout(() => {
       optimize(false);
    }, 50);
  };

  const executeSwap = (newPlayer: Player) => {
    if (selectedPlayer) {
      swapPlayer(selectedPlayer.id, newPlayer);
      setIsSwapping(false);
      setSelectedPlayer(null);
    }
  };

  useEffect(() => {
    if (location.state?.seasonalFixtures) {
       useFplStore.setState({ seasonalFixtures: location.state.seasonalFixtures });
    }
    if (location.state?.squadData) {
      setOptimizationResult(location.state.squadData);
    }
    const init = async () => {
      let hasFixtures = !!location.state?.seasonalFixtures;
      if (!hasFixtures) {
         const history = getHistory();
         const latestPL = history.find(h => h.source === 'Premier League' || h.name === 'Premier League' || h.source === 'pl');
         if (latestPL) {
            useFplStore.setState({ seasonalFixtures: { fixtures: latestPL.fixtures, teams: latestPL.teams } });
            hasFixtures = true;
         }
      }
      if (!hasFixtures) {
         await fetchSeasonPool();
      }
      await fetchAllPlayers();
      if (squad.length === 0) optimize(false);
    };
    init();
  }, [location, setOptimizationResult]);

  return (
    <>
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 6, 0.3), rgba(7, 11, 8, 0.4), rgba(10, 14, 8, 0.4)), url(${teamPitchBackground})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      
      <div className="relative z-10 grid gap-8 lg:gap-12 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] max-w-[2400px] mx-auto p-4 sm:p-8 md:p-16">
        
        <aside className="space-y-6">
          <FilterPanel title="EPL CLUBS">
             <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-3 gap-3 sm:gap-4">
               {teamFilters.map(team => (
                 <div key={team.id} className="flex h-12 sm:h-16 items-center justify-center rounded-xl sm:rounded-2xl border border-white/5 bg-black/40 p-2 sm:p-3 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:border-emerald-500/30">
                   <img src={team.logo} alt={team.id} className="h-full w-full object-contain" />
                 </div>
               ))}
             </div>
          </FilterPanel>

          <FilterPanel title="SQUAD ECONOMY">
             <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-6">
                <div className="p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] bg-black/60 border border-white/5 shadow-xl">
                   <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase mb-2 sm:mb-3 tracking-[0.2em]">Total Value</p>
                   <span className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter leading-none">£{totalSquadCost.toFixed(1)}M</span>
                </div>
                <div className="p-4 sm:p-6 rounded-[20px] sm:rounded-[32px] bg-black/60 border border-white/5 shadow-xl">
                   <p className="text-[9px] sm:text-[10px] font-black text-zinc-500 uppercase mb-2 sm:mb-3 tracking-[0.2em]">Remaining Bank</p>
                   <span className="text-2xl sm:text-4xl font-black text-emerald-400 italic tracking-tighter leading-none font-mono">£{realRemainingBudget.toFixed(1)}M</span>
                </div>
             </div>
          </FilterPanel>
        </aside>

        <main className="space-y-8 sm:space-y-12">
          
          <header className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-center lg:items-end justify-between px-2 sm:px-4 w-full">
            <div className="flex flex-col sm:flex-row items-center sm:items-start lg:items-center gap-4 lg:gap-6 shrink-0 w-full lg:w-auto text-center sm:text-left">
               <img src={logo} alt="Logo" className="h-20 w-20 sm:h-16 sm:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 object-contain drop-shadow-4xl shrink-0" />
               <div className="flex flex-col items-center sm:items-start max-w-full">
                  <h1 className="text-4xl sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-black text-white tracking-tighter italic uppercase leading-none break-words max-w-full text-center sm:text-left">
                    SQUAD <span className="text-emerald-500">OPTIMIZER</span>
                  </h1>
                  
                  <div className="mt-4 xl:mt-6 flex items-center justify-center gap-3 lg:gap-6 bg-black/40 border border-emerald-500/20 px-4 lg:px-6 py-2 xl:py-3 rounded-[16px] xl:rounded-[24px] w-fit shadow-[0_0_20px_rgba(16,185,129,0.1)] backdrop-blur-md">
                     <button onClick={() => handleGwChange(gameweek - 1)} className="text-zinc-400 hover:text-emerald-400 transition-all hover:scale-125 shrink-0">
                        <ChevronLeft className="w-5 h-5 lg:w-6 lg:h-6" />
                     </button>
                     <div className="flex flex-col items-center min-w-[70px] lg:min-w-[100px] shrink-0">
                        <span className="text-xl lg:text-2xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">GW {gameweek}</span>
                     </div>
                     <button onClick={() => handleGwChange(gameweek + 1)} className="text-zinc-400 hover:text-emerald-400 transition-all hover:scale-125 shrink-0">
                        <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
                     </button>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-stretch sm:items-center justify-center lg:justify-end shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
               <div className="p-4 lg:p-5 xl:p-6 rounded-[20px] xl:rounded-[32px] bg-black/40 border border-emerald-500/20 flex flex-col items-center flex-1 sm:flex-none sm:min-w-[120px] lg:min-w-[150px] xl:min-w-[180px] shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-md shrink-0">
                  <span className="text-[10px] lg:text-[10px] font-black text-zinc-400 mb-1 xl:mb-2 tracking-[0.3em] uppercase">Expected Yield</span>
                  <span className="text-4xl sm:text-3xl lg:text-4xl xl:text-5xl font-black text-emerald-400 font-mono tracking-tighter italic drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]">{safeProjectedPoints.toFixed(1)}</span>
               </div>
               
               <button 
                onClick={() => optimize(true)}
                disabled={isLoading}
                className="px-6 sm:px-8 lg:px-10 xl:px-14 py-5 lg:py-5 rounded-[20px] xl:rounded-[32px] bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-black text-xl sm:text-lg lg:text-xl xl:text-2xl uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_40px_rgba(16,185,129,0.5)] flex items-center justify-center gap-2 lg:gap-4 group relative overflow-hidden shrink-0 flex-1 sm:flex-none"
               >
                 <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                 {isLoading ? <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 animate-spin relative z-10" /> : <RefreshCw className="w-6 h-6 lg:w-8 lg:h-8 group-hover:rotate-180 transition-transform duration-700 relative z-10" />}
                 <span className="relative z-10">SHUFFLE</span>
               </button>
            </div>
          </header>

          <section className="relative min-h-[400px] sm:min-h-[700px] md:min-h-[900px] lg:min-h-[1150px] rounded-[24px] md:rounded-[80px] bg-black/10 p-2 sm:p-8 md:p-12 border border-white/5 shadow-2xl overflow-hidden sm:overflow-visible">
             {isLoading && starters.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <Loader2 className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 animate-spin text-emerald-500 mb-4 md:mb-6" />
                   <p className="font-black text-[8px] md:text-[10px] text-emerald-400 uppercase tracking-[0.5em] animate-pulse">Computing Matrix...</p>
                </div>
             ) : (
                <div className="relative w-full h-[380px] sm:h-[650px] md:h-[800px] lg:h-[1050px]">
                   {starters.map((player, index) => (
                     player && dynamicFormation[index] && (
                       <motion.div 
                         key={player.id} 
                         layout
                         initial={{ scale: 0.8, opacity: 0 }}
                         animate={{ scale: 1, opacity: 1 }}
                         className="absolute -translate-x-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center" 
                         style={{ left: dynamicFormation[index].left, top: dynamicFormation[index].top, zIndex: 40 - index }}
                       >
                          <div className="scale-[0.3] min-[380px]:scale-[0.35] min-[420px]:scale-[0.4] sm:scale-[0.55] md:scale-[0.7] lg:scale-[0.72] xl:scale-[0.85] hover:scale-[0.4] min-[380px]:hover:scale-[0.45] min-[420px]:hover:scale-[0.5] sm:hover:scale-[0.7] md:hover:scale-[0.85] lg:hover:scale-[0.9] xl:hover:scale-[1.0] transition-all duration-300 origin-center">
                             <PlayerCard player={player} compact onClick={() => { setSelectedPlayer(player); setIsSwapping(false); }} opponent={(fixtureContext as any)[player.club]} />
                          </div>
                       </motion.div>
                     )
                   ))}
                </div>
             )}
          </section>

          <AnimatePresence>
            {selectedPlayer && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center bg-black/95 p-8" onClick={() => setSelectedPlayer(null)}>
                <motion.div initial={{ scale: 0.9, y: 50 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 25 }} className="bg-[#000000] p-16 rounded-[60px] border border-white/5 max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                   {!isSwapping ? (
                     <>
                        <div className="flex items-center gap-10 mb-12">
                           <div className="w-40 h-40 rounded-full border-2 border-emerald-500 bg-emerald-500/5 flex items-center justify-center text-7xl font-black text-emerald-400">
                              {initialsFromName(selectedPlayer.name)}
                           </div>
                           <div className="flex-1">
                             <div className="flex items-center justify-between">
                                <h2 className="text-5xl lg:text-7xl font-black text-white italic tracking-tighter uppercase leading-none">{selectedPlayer.name}</h2>
                                <button onClick={() => setSelectedPlayer(null)} className="p-4 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                                   <X className="w-8 h-8 text-white/40" />
                                </button>
                             </div>
                             <p className="text-3xl font-bold text-emerald-500/80 tracking-[0.4em] uppercase mt-2">{selectedPlayer.club} <span className="text-zinc-800 mx-4">|</span> {selectedPlayer.position}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                           <div className="bg-white/5 p-8 rounded-[40px] border border-white/5">
                              <div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5 text-zinc-600" /><span className="text-[10px] text-zinc-600 font-black uppercase">Market Value</span></div>
                              <div className="text-4xl font-black text-white">£{selectedPlayer.cost_millions}M</div>
                           </div>
                           <div className="bg-white/5 p-8 rounded-[40px] border border-white/5">
                              <div className="flex items-center gap-3 mb-2"><TrendingUp className="w-5 h-5 text-zinc-600" /><span className="text-[10px] text-zinc-600 font-black uppercase">Projected</span></div>
                              <div className="text-4xl font-black text-emerald-400">{selectedPlayer.points}</div>
                           </div>
                           <div className="bg-white/5 p-8 rounded-[40px] border border-white/5">
                              <div className="flex items-center gap-3 mb-2"><Target className="w-5 h-5 text-zinc-600" /><span className="text-[10px] text-zinc-600 font-black uppercase">Fixture</span></div>
                              <div className="text-3xl font-black text-lime-400">{(fixtureContext as any)[selectedPlayer.club] || 'BYE'}</div>
                           </div>
                        </div>

                        <div className="flex gap-6">
                           <button onClick={() => setIsSwapping(true)} className="flex-1 py-10 bg-emerald-500 text-black rounded-[40px] font-black text-2xl uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-6 shadow-glow">
                              <Repeat className="w-8 h-8" /> TRANSFER PLAYER
                           </button>
                           <button onClick={() => setSelectedPlayer(null)} className="flex-1 py-10 bg-white/5 text-zinc-500 rounded-[40px] font-black text-2xl uppercase tracking-widest hover:bg-white/10 transition-all">
                              DISMISS
                           </button>
                        </div>
                     </>
                   ) : (
                     <div className="space-y-10">
                        <div className="flex items-center justify-between px-4">
                           <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">MARKET REPLACEMENTS</h3>
                           <button onClick={() => setIsSwapping(false)} className="text-[12px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">BACK TO STATS</button>
                        </div>
                        <div className="relative">
                           <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-8 h-8 text-zinc-800" />
                           <input type="text" placeholder="PROBE DATABASE..." className="w-full bg-white/5 border-none rounded-[32px] py-8 pl-20 text-xl font-black text-white placeholder:text-zinc-800 focus:ring-1 focus:ring-emerald-500" value={swapSearch} onChange={e => setSwapSearch(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-4">
                           {swapCandidates.map(p => (
                             <button key={p.id} onClick={() => executeSwap(p)} className="flex items-center justify-between p-6 rounded-[32px] bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center font-black text-emerald-400 group-hover:scale-110 transition-transform">{initialsFromName(p.name)}</div>
                                   <div className="text-left">
                                      <p className="font-black text-white uppercase tracking-tighter text-xl">{p.name}</p>
                                      <p className="text-[12px] text-zinc-600 font-bold">{p.club}</p>
                                   </div>
                                </div>
                                <div className="text-right text-emerald-400 font-black italic text-2xl">{p.points}</div>
                             </button>
                           ))}
                        </div>
                     </div>
                   )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </>
  );
}
