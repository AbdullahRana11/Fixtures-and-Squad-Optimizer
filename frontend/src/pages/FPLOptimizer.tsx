import { useState, useEffect, useMemo } from 'react';
import PlayerCard from '../components/PlayerCard';
import logo from "../assets/pics/PSL-logo.png";
import { useFplStore, Player } from '../store/fplStore';
import { RefreshCw, X, Loader2, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Target, Repeat, Search, Activity, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import GridScan from '../components/reactbits/GridScan';
import TiltedCard from '../components/reactbits/TiltedCard';
import DecryptedText from '../components/reactbits/DecryptedText';

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
  { id: "ARS", logo: arsLogo }, { id: "AVL", logo: avlLogo },
  { id: "BHA", logo: bhaLogo }, { id: "CHE", logo: cheLogo },
  { id: "EVE", logo: eveLogo }, { id: "LIV", logo: livLogo },
  { id: "MCI", logo: mciLogo }, { id: "MUN", logo: munLogo },
  { id: "NEW", logo: newLogo }, { id: "TOT", logo: totLogo },
  { id: "WHU", logo: whuLogo }, { id: "WOL", logo: wolLogo },
];

// Positions kept well within bounds so 120px cards don't clip the container edges.
// Effective horizontal range: ~14% – 86%  (card half-width ≈ 7-8% at max-w-5xl)
// Effective vertical range:  ~10% – 88%  (card half-height ≈ 9% at aspect 4/3)
const formation = [
  { left: "50%", top: "12%" },                                                                         // GK
  { left: "14%", top: "34%" }, { left: "38%", top: "34%" }, { left: "62%", top: "34%" }, { left: "86%", top: "34%" }, // DEF
  { left: "14%", top: "56%" }, { left: "38%", top: "56%" }, { left: "62%", top: "56%" }, { left: "86%", top: "56%" }, // MID
  { left: "33%", top: "78%" }, { left: "67%", top: "78%" },                                            // FWD
];

function initialsFromName(name: string) {
  if (!name) return "??";
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

export default function FPLOptimizer() {
  const {
    squad, allPlayers, gameweek, projectedPoints, isLoading,
    optimize, setGameweek, fetchSeasonPool, fetchAllPlayers, fixtureContext, swapPlayer
  } = useFplStore();

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapSearch, setSwapSearch] = useState("");

  const totalSquadCost = (squad || []).reduce((s, p) => s + Number(p?.cost_millions || 0), 0);
  const remainingBudget = 100.0 - totalSquadCost;
  const safePoints = typeof projectedPoints === 'number' && !isNaN(projectedPoints) ? projectedPoints : 0;

  const starters = useMemo(() => {
    if (!squad || squad.length < 11) return [];
    const gks  = squad.filter(p => p?.position === 'GK');
    const defs = squad.filter(p => p?.position === 'DEF');
    const mids = squad.filter(p => p?.position === 'MID');
    const fwds = squad.filter(p => p?.position === 'FWD');
    return [gks[0], ...defs.slice(0, 4), ...mids.slice(0, 4), ...fwds.slice(0, 2)].filter(Boolean);
  }, [squad]);

  const swapCandidates = useMemo(() => {
    if (!selectedPlayer || !allPlayers) return [];
    return allPlayers
      .filter(p => p.position === selectedPlayer.position && p.id !== selectedPlayer.id)
      .filter(p => p.name.toLowerCase().includes(swapSearch.toLowerCase()))
      .sort((a, b) => b.points - a.points)
      .slice(0, 20);
  }, [selectedPlayer, allPlayers, swapSearch]);

  const handleGwChange = (n: number) => {
    if (n < 1 || n > 38) return;
    setGameweek(n);
    setTimeout(() => optimize(false), 50);
  };

  const executeSwap = (newPlayer: Player) => {
    if (selectedPlayer) {
      swapPlayer(selectedPlayer.id, newPlayer);
      setIsSwapping(false);
      setSelectedPlayer(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchSeasonPool();
      await fetchAllPlayers();
      if (squad.length === 0) optimize(false);
    };
    init();
  }, []);

  return (
    <>
      {/* Base background */}
      <div className="fixed inset-0 z-0 bg-void global-bg opacity-30 mix-blend-overlay" />

      {/* Page shell — sits below TopNav (TopNav is ~64px tall) */}
      <div className="relative z-10 flex h-[calc(100vh-64px)] mt-16 overflow-hidden">

        {/* ─── LEFT SIDEBAR ─── */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 border-r border-white/5 bg-black/60 backdrop-blur-2xl overflow-y-auto custom-scrollbar">
          {/* Sidebar header */}
          <div className="px-6 pt-8 pb-4 border-b border-white/5">
            <p className="text-[9px] font-black text-teal-400/50 uppercase tracking-[0.4em] font-mono flex items-center gap-2">
              <Activity className="w-3 h-3" /> Command Sidebar
            </p>
          </div>

          <div className="flex flex-col gap-6 p-6 flex-1">
            {/* EPL Clubs */}
            <div>
              <p className="text-[9px] font-black text-teal-400/40 uppercase tracking-[0.4em] font-mono mb-4">EPL Clubs</p>
              <div className="grid grid-cols-3 gap-2">
                {teamFilters.map(team => (
                  <div key={team.id}
                    className="flex h-12 items-center justify-center rounded-xl border border-white/5 bg-black/40 p-2 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-110 transition-all duration-300 hover:border-teal-500/50 hover:bg-teal-500/10 cursor-pointer"
                  >
                    <img src={team.logo} alt={team.id} className="h-full w-full object-contain" />
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* Squad Economy */}
            <div>
              <p className="text-[9px] font-black text-violet-400/40 uppercase tracking-[0.4em] font-mono mb-4">Squad Economy</p>
              <div className="space-y-3">
                <div className="p-5 rounded-2xl bg-black/60 border border-teal-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-teal-500/5 rounded-full blur-2xl" />
                  <p className="text-[8px] font-mono text-teal-400/50 uppercase tracking-widest mb-1">Capital</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">£{totalSquadCost.toFixed(1)}M</p>
                </div>
                <div className="p-5 rounded-2xl bg-black/60 border border-violet-500/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-violet-500/5 rounded-full blur-2xl" />
                  <p className="text-[8px] font-mono text-violet-400/50 uppercase tracking-widest mb-1">Reserve</p>
                  <p className="text-2xl font-black text-violet-400 italic tracking-tighter font-mono">£{remainingBudget.toFixed(1)}M</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-white/5" />

            {/* System Status */}
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] font-mono mb-4">System Status</p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Core Engine</span>
                  <span className="text-[8px] font-mono text-teal-500 uppercase tracking-widest animate-pulse">Operational</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-teal-500 to-violet-500"
                    animate={{ width: ['20%', '80%', '60%', '90%', '45%'] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                  />
                </div>
                {/* Mini telemetry bars */}
                <div className="flex gap-1 pt-1">
                  {[...Array(8)].map((_, i) => (
                    <motion.div key={i}
                      className="flex-1 h-6 rounded-sm bg-teal-500/10"
                      animate={{ opacity: [0.2, 1, 0.2] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ─── MAIN CONTENT ─── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">

          {/* ── Header bar ── */}
          <header className="shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 xl:px-10 py-5 border-b border-white/5 bg-black/40 backdrop-blur-xl">
            {/* Left: logo + title */}
            <div className="flex items-center gap-5">
              <img src={logo} alt="PSL" className="h-12 w-12 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
              <div>
                <h1 className="text-2xl xl:text-3xl font-black text-white tracking-tighter italic uppercase leading-none">
                  <DecryptedText text="SQUAD" animateOn="view" speed={80} className="text-white" encryptedClassName="text-teal-500" />
                  {' '}
                  <span className="text-teal-400">
                    <DecryptedText text="OPTIMIZER" animateOn="view" speed={80} className="text-teal-400" encryptedClassName="text-white" />
                  </span>
                </h1>
                <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em] mt-1 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-teal-500" /> Knapsack Protocol Active
                </p>
              </div>
            </div>

            {/* Right: GW selector + Expected Yield + Shuffle */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* GW Selector */}
              <div className="flex items-center gap-2 bg-black/60 border border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-xl shadow-inner">
                <button onClick={() => handleGwChange(gameweek - 1)}
                  className="text-zinc-500 hover:text-teal-400 transition-all hover:scale-125 p-1">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-lg font-black text-white uppercase italic tracking-tighter min-w-[64px] text-center">
                  GW {gameweek}
                </span>
                <button onClick={() => handleGwChange(gameweek + 1)}
                  className="text-zinc-500 hover:text-teal-400 transition-all hover:scale-125 p-1">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Expected Yield */}
              <TiltedCard maxTilt={10} glareColor="rgba(45,212,191,0.3)">
                <div className="px-5 py-3 rounded-2xl bg-[#0A1224]/80 border border-teal-500/30 flex flex-col items-center shadow-[0_0_30px_rgba(45,212,191,0.15)] backdrop-blur-2xl min-w-[120px]">
                  <span className="text-[8px] font-black text-teal-300/70 tracking-[0.3em] uppercase font-mono">Expected Yield</span>
                  <span className="text-3xl font-black text-teal-400 font-mono tracking-tighter italic drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]">
                    {safePoints.toFixed(1)}
                  </span>
                </div>
              </TiltedCard>

              {/* Shuffle */}
              <button
                onClick={() => optimize(true)}
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-600 text-black font-black text-xs uppercase tracking-widest hover:bg-teal-500 hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(45,212,191,0.4)] border border-teal-400/50 group"
              >
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />}
                SHUFFLE
              </button>
            </div>
          </header>

          {/* ── Pitch / Formation ── */}
          <div className="flex-1 flex items-start justify-center p-4 xl:p-8">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-5xl rounded-[40px] overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              {/* ── Pitch background ── */}
              <div className="absolute inset-0 bg-zinc-950/80 border border-white/5 backdrop-blur-xl rounded-[40px] squad-bg">
                {/* Centre circle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10 pointer-events-none" />
                {/* Halfway line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10 pointer-events-none" />
              </div>

              {/* ── Players — inside the clipping container ── */}
              {isLoading && starters.length === 0 ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-50">
                  <Loader2 className="w-16 h-16 animate-spin text-teal-500 mb-3 drop-shadow-[0_0_20px_rgba(45,212,191,0.8)]" />
                  <p className="font-black text-[10px] text-teal-400 uppercase tracking-[0.5em] animate-pulse">Computing Matrix...</p>
                </div>
              ) : (
                starters.map((player, index) => (
                  player && formation[index] && (
                    <motion.div
                      key={player.id}
                      layout
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.04, ease: "easeOut" }}
                      className="absolute -tranzinc-x-1/2 -tranzinc-y-1/2 z-10"
                      style={{ left: formation[index].left, top: formation[index].top }}
                    >
                      {/* Scale the 120px card to fit the pitch at each breakpoint */}
                      <div className="scale-[0.48] sm:scale-[0.58] md:scale-[0.70] lg:scale-[0.82] xl:scale-[0.92] 2xl:scale-100 hover:scale-110 transition-transform duration-300 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] origin-center">
                        <PlayerCard
                          player={player}
                          compact
                          onClick={() => { setSelectedPlayer(player); setIsSwapping(false); }}
                        />
                      </div>
                    </motion.div>
                  )
                ))
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* ─── Player Detail / Swap Modal ─── */}
      <AnimatePresence>
        {selectedPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-[#02040A]/85 backdrop-blur-md p-4 sm:p-8"
            onClick={() => setSelectedPlayer(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-[#0A1224] p-8 sm:p-12 rounded-[40px] border border-teal-500/20 shadow-[0_0_80px_rgba(45,212,191,0.15)] max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              {!isSwapping ? (
                <>
                  {/* Player header */}
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full border-2 border-teal-500 bg-teal-500/10 flex items-center justify-center text-3xl sm:text-4xl font-black text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.3)] shrink-0">
                      {initialsFromName(selectedPlayer.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <h2 className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter uppercase leading-none break-words">
                          {selectedPlayer.name}
                        </h2>
                        <button onClick={() => setSelectedPlayer(null)}
                          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0">
                          <X className="w-5 h-5 text-white/40" />
                        </button>
                      </div>
                      <p className="text-base font-bold text-teal-400/70 tracking-[0.3em] uppercase mt-1">
                        {selectedPlayer.club} <span className="text-white/20 mx-2">|</span> {selectedPlayer.position}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                      { icon: DollarSign, color: 'text-teal-500', label: 'Market Value', value: `£${selectedPlayer.cost_millions}M` },
                      { icon: TrendingUp, color: 'text-fuchsia-500', label: 'Projected', value: String(selectedPlayer.points) },
                      { icon: Target, color: 'text-amber-500', label: 'Fixture', value: String((fixtureContext as any)[selectedPlayer.club] || 'BYE') },
                    ].map(({ icon: Icon, color, label, value }) => (
                      <div key={label} className="bg-black/40 p-5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className={`w-4 h-4 ${color}`} />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${color}`}>{label}</span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button onClick={() => setIsSwapping(true)}
                      className="flex-1 py-4 bg-teal-600 text-black rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 hover:bg-teal-500 transition-all flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(45,212,191,0.3)] border border-teal-400/50">
                      <Repeat className="w-5 h-5" /> Transfer
                    </button>
                    <button onClick={() => setSelectedPlayer(null)}
                      className="flex-1 py-4 bg-white/5 text-zinc-500 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all">
                      Dismiss
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Market Replacements</h3>
                    <button onClick={() => setIsSwapping(false)}
                      className="text-[10px] font-black text-zinc-600 uppercase tracking-widest hover:text-white transition-colors">
                      ← Back
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 -tranzinc-y-1/2 w-5 h-5 text-teal-500" />
                    <input
                      type="text"
                      placeholder="PROBE DATABASE..."
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 text-sm font-black text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-teal-500 outline-none tracking-widest"
                      value={swapSearch}
                      onChange={e => setSwapSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {swapCandidates.map(p => (
                      <button key={p.id} onClick={() => executeSwap(p)}
                        className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-teal-500/50 hover:bg-teal-500/10 transition-all group text-left">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center font-black text-teal-400 text-sm group-hover:scale-110 transition-transform">
                            {initialsFromName(p.name)}
                          </div>
                          <div>
                            <p className="font-black text-white uppercase tracking-tight text-sm">{p.name}</p>
                            <p className="text-[9px] text-teal-400/50 font-black uppercase tracking-widest">{p.club}</p>
                          </div>
                        </div>
                        <div className="text-fuchsia-400 font-black italic text-xl">{p.points}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
