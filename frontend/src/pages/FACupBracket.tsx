import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, ChevronRight, Activity, Cpu, Zap, Star } from 'lucide-react';
import axios from 'axios';
import StatsPanel from '../components/StatsPanel';
import Hyperspeed from '../components/reactbits/Hyperspeed';
import GridScan from '../components/reactbits/GridScan';
import TiltedCard from '../components/reactbits/TiltedCard';
import DecryptedText from '../components/reactbits/DecryptedText';

interface FACupTeam {
  name: string;
  league: string;
  city: string;
  stadium: string;
}

interface FACupMatch {
  id: string;
  round: string;
  matchNumber: number;
  home: FACupTeam;
  away: FACupTeam;
  date: string;
  time: string;
  venue: string;
  winner: string | null;
  isNeutral: boolean;
}

interface FACupRound {
  name: string;
  shortName: string;
  date: string;
  matchCount: number;
  matches: FACupMatch[];
  isComplete: boolean;
}

interface FACupBracket {
  teams: string[];
  rounds: FACupRound[];
  champion: string | null;
  telemetry: {
    generation_time_ms: number;
    upsets: number;
    total_matches: number;
  };
}

const ROUND_GRADIENTS = [
  { from: '#10b981', to: '#10b981', label: 'Third Round' },
  { from: '#10b981', to: '#10b981', label: 'Fourth Round' },
  { from: '#10b981', to: '#34d399', label: 'Fifth Round' },
  { from: '#f59e0b', to: '#fbbf24', label: 'Quarter-Finals' },
  { from: '#ef4444', to: '#f87171', label: 'Semi-Finals' },
  { from: '#eab308', to: '#fde047', label: 'The Final' },
];

const TIER_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  'Premier League': { color: '#a78bfa', label: 'PL', bg: 'rgba(167,139,250,0.1)' },
  'Championship': { color: '#10b981', label: 'CH', bg: 'rgba(96,165,250,0.1)' },
  'League One': { color: '#2dd4bf', label: 'L1', bg: 'rgba(45,212,191,0.1)' },
  'League Two': { color: '#9ca3af', label: 'L2', bg: 'rgba(156,163,175,0.1)' },
};

const TIER_RANK: Record<string, number> = {
  'Premier League': 4, 'Championship': 3, 'League One': 2, 'League Two': 1,
};

const FACupBracketPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule: initialBracket } = (location.state as { schedule: FACupBracket; leagueId: string }) || {};

  const [bracket, setBracket] = useState<FACupBracket | null>(initialBracket || null);
  const [activeRound, setActiveRound] = useState(0);
  const [simulating, setSimulating] = useState(false);
  const [revealedWinners, setRevealedWinners] = useState<Set<string>>(new Set());
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [intelLog, setIntelLog] = useState<{text: string, type: string}[]>([]);
  const [tournamentId, setTournamentId] = useState<string | null>(location.state?.tournamentId || null);

  // Auto-save bracket state
  React.useEffect(() => {
    if (!bracket) return;
    const saveBracket = async () => {
      try {
        const { data } = await axios.post('http://localhost:3000/api/tournaments/save', {
          id: tournamentId,
          type: 'facup',
          name: 'FA Cup Tournament',
          status: bracket.champion ? 'completed' : 'active',
          bracket: bracket
        });
        if (!tournamentId) setTournamentId(data.id);
      } catch (err) {
        console.error('Failed to auto-save FA Cup bracket:', err);
      }
    };

    const timer = setTimeout(saveBracket, 1000);
    return () => clearTimeout(timer);
  }, [bracket, tournamentId]);

  if (!bracket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#000000] text-white/50 min-h-screen">
        <p className="text-lg">No bracket data.</p>
        <button onClick={() => navigate('/fixtures')} className="mt-4 text-emerald-400 underline">Back</button>
      </div>
    );
  }

  const currentRound = bracket.rounds[activeRound];
  const roundGrad = ROUND_GRADIENTS[activeRound % ROUND_GRADIENTS.length];

  const handleMatchStats = useCallback(async (match: FACupMatch) => {
    setStatsPanelOpen(true);
    try {
      const { data } = await axios.post('http://localhost:3000/api/fixtures/predict', {
        homeTeam: match.home.name,
        awayTeam: match.away.name,
        homeLeague: match.home.league,
        awayLeague: match.away.league,
      });
      setPrediction(data);
    } catch (err) { console.error(err); }
  }, []);

  const simulateRound = async () => {
    if (!currentRound || currentRound.isComplete) return;
    setSimulating(true);

    // Simulate each match with staggered reveal
    const winners: FACupTeam[] = [];

    for (let i = 0; i < currentRound.matches.length; i++) {
      const match = currentRound.matches[i];
      const homeRank = TIER_RANK[match.home.league] || 1;
      const awayRank = TIER_RANK[match.away.league] || 1;
      const homeProb = homeRank >= awayRank ? 0.58 + (homeRank - awayRank) * 0.06 : 0.42 - (awayRank - homeRank) * 0.06;
      const winner = Math.random() < homeProb ? match.home : match.away;

      match.winner = winner.name;
      winners.push(winner);

      setIntelLog(prev => [...prev, { text: `ANALYZING TIE ${match.matchNumber}: ${match.home.name} vs ${match.away.name}`, type: 'info' }]);
      await new Promise(resolve => setTimeout(resolve, 250));
      setIntelLog(prev => [...prev, { text: `PROBABILITY RESOLVED: ${winner.name.toUpperCase()} ADVANCES`, type: 'success' }]);

      setRevealedWinners(prev => new Set(prev).add(match.id));
      await new Promise(resolve => setTimeout(resolve, 80));
    }

    currentRound.isComplete = true;

    // Generate next round if not the final
    if (bracket.rounds.length < 6) {
      try {
        const { data } = await axios.post('http://localhost:3000/api/fixtures/fa-cup/next-round', {
          bracket, winners,
        });
        setBracket(data);
      } catch {
        // Fallback: just update locally
        setBracket({ ...bracket });
      }
    }

    // If final was just simulated, set champion
    if (currentRound.shortName === 'F' && winners.length === 1) {
      setBracket(prev => prev ? { ...prev, champion: winners[0].name } : prev);
    }

    setSimulating(false);
  };

  const advanceToNextRound = () => {
    if (bracket.rounds.length > activeRound + 1) {
      setActiveRound(activeRound + 1);
      setRevealedWinners(new Set());
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleNextRound = () => {
    advanceToNextRound();
    setIntelLog([]);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30 relative overflow-x-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <Hyperspeed 
          effectOptions={{
            distortion: 'turbulentDistortion',
            speedUp: 2,
            colors: {
              roadColor: 0x02040A,
              islandColor: 0x050810,
              background: 0x02040A,
              shoulderLines: 0x2dd4bf,
              brokenLines: 0x2dd4bf,
              leftCars: [0x2dd4bf, 0x0d9488],
              rightCars: [0x8b5cf6, 0x6d28d9],
              sticks: 0x2dd4bf
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#000000]/90 via-[#000000]/40 to-[#000000]/95 pointer-events-none" />
        <GridScan color="#2dd4bf" scanSpeed={3} />
      </div>

      {/* Header */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="border-b border-white/5 bg-black/40 backdrop-blur-3xl sticky top-0 z-40"
      >
        <div className="max-w-[1800px] mx-auto px-12 py-8 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button onClick={() => navigate('/fixtures')} className="p-4 rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all bg-white/[0.02] group">
              <ArrowLeft className="w-5 h-5 text-white/20 group-hover:text-emerald-400" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] uppercase font-black tracking-[0.4em] text-rose-400/60">Stage: Domestic Glory</span>
              </div>
              <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase">
                <DecryptedText text="FA Cup Tournament" animateOn="view" />
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {currentRound && !currentRound.isComplete && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={simulateRound}
                disabled={simulating}
                className="px-10 py-4 rounded-2xl bg-rose-500 text-black font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-rose-400 transition-all shadow-[0_0_40px_rgba(244,63,94,0.2)]"
              >
                <Zap className="w-4 h-4 fill-current" />
                {simulating ? 'PROCESSING TIES...' : 'SIMULATE ROUND'}
              </motion.button>
            )}
            {currentRound?.isComplete && bracket.rounds.length > activeRound + 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={handleNextRound}
                className="px-10 py-4 rounded-2xl bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 shadow-[0_0_40px_rgba(139,92,246,0.2)]"
              >
                NEXT SECTOR <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Round Tabs */}
      <div className="bg-black/40 border-b border-white/5 overflow-x-auto no-scrollbar relative z-30">
        <div className="max-w-[1800px] mx-auto px-12 h-16 flex items-center gap-8">
          {bracket.rounds.map((round, i) => {
            const isActive = activeRound === i;
            return (
              <button
                key={round.shortName}
                onClick={() => { setActiveRound(i); setRevealedWinners(new Set()); setIntelLog([]); }}
                className={`relative h-full px-4 text-[10px] font-black uppercase tracking-[0.5em] transition-all ${isActive ? 'text-emerald-400' : 'text-white/10 hover:text-white/40'}`}
              >
                {round.name}
                {isActive && (
                  <motion.div layoutId="round-active-fa" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_rgba(45,212,191,0.5)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1800px] mx-auto px-12 py-20 grid lg:grid-cols-[1fr_380px] gap-20">
        <div className="space-y-16">
          {currentRound && (
            <motion.div key={activeRound} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="mb-12">
                <h2 className="text-6xl font-black mb-4 opacity-90 italic uppercase tracking-tighter" style={{ color: roundGrad.from }}>{currentRound.name}</h2>
                <div className="flex items-center gap-6">
                  <div className="h-[1px] w-12 bg-white/10" />
                  <p className="text-white/20 text-[10px] font-mono tracking-[0.4em] uppercase">
                    {currentRound.matchCount} DECISIVE TIES // VENUE: {formatDate(currentRound.date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {currentRound.matches.map((match, i) => {
                  const homeTier = TIER_CONFIG[match.home.league] || TIER_CONFIG['League Two'];
                  const awayTier = TIER_CONFIG[match.away.league] || TIER_CONFIG['League Two'];
                  const isRevealed = revealedWinners.has(match.id) || (currentRound.isComplete && match.winner);
                  const isHomeWin = match.winner === match.home.name;
                  const isAwayWin = match.winner === match.away.name;

                  return (
                    <TiltedCard key={match.id} maxTilt={10} glareColor="rgba(45, 212, 191, 0.1)">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleMatchStats(match)}
                        className={`relative p-8 rounded-[2rem] border transition-all cursor-pointer group overflow-hidden ${
                          isRevealed ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-black/60 border-white/5 backdrop-blur-2xl'
                        }`}
                      >
                        <div className="hud-corner hud-corner-tl opacity-20 group-hover:opacity-100 transition-opacity" />
                        <div className="hud-corner hud-corner-br opacity-20 group-hover:opacity-100 transition-opacity" />

                        <div className="flex justify-between items-center mb-8 opacity-20 text-[9px] font-black uppercase tracking-[0.4em]">
                          <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> MATCH {match.matchNumber}</span>
                          <span className="group-hover:text-emerald-400 transition-colors uppercase">Tap for Intel</span>
                        </div>

                        <div className="space-y-6">
                          <div className={`flex justify-between items-center transition-all duration-500 ${isRevealed && !isHomeWin ? 'opacity-20 scale-95' : 'opacity-100'}`}>
                            <div className="flex items-center gap-4">
                              <span className="text-[8px] font-black px-2 py-1 rounded-lg" style={{ color: homeTier.color, backgroundColor: homeTier.bg }}>
                                {homeTier.label}
                              </span>
                              <span className={`text-xl italic ${isHomeWin ? 'font-black text-white' : 'font-bold text-white/40'}`}>
                                {match.home.name}
                              </span>
                            </div>
                            {isRevealed && isHomeWin && <Trophy className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" fill="currentColor" />}
                          </div>

                          <div className="h-px bg-white/5" />

                          <div className={`flex justify-between items-center transition-all duration-500 ${isRevealed && !isAwayWin ? 'opacity-20 scale-95' : 'opacity-100'}`}>
                            <div className="flex items-center gap-4">
                              <span className="text-[8px] font-black px-2 py-1 rounded-lg" style={{ color: awayTier.color, backgroundColor: awayTier.bg }}>
                                {awayTier.label}
                              </span>
                              <span className={`text-xl italic ${isAwayWin ? 'font-black text-white' : 'font-bold text-white/40'}`}>
                                {match.away.name}
                              </span>
                            </div>
                            {isRevealed && isAwayWin && <Trophy className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_10px_rgba(45,212,191,0.5)]" fill="currentColor" />}
                          </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between opacity-20 group-hover:opacity-40 transition-opacity">
                          <p className="text-[8px] font-mono uppercase tracking-[0.2em] truncate max-w-[70%]">
                            🏟 {match.venue}
                          </p>
                          {match.isNeutral && (
                             <span className="text-[7px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20 uppercase font-black">NEUTRAL</span>
                          )}
                        </div>
                      </motion.div>
                    </TiltedCard>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Tactical Intel Sidebar */}
        <aside className="space-y-8">
          <div className="bg-black/60 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-3xl relative overflow-hidden">
            <div className="neon-scanline opacity-10" />
            <div className="flex items-center gap-4 mb-8">
               <Activity className="w-5 h-5 text-rose-400" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Domestic Intel Feed</h3>
            </div>
            
            <div className="h-[500px] overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
               <div className="space-y-4">
                  {intelLog.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full gap-6 opacity-10">
                        <Cpu className="w-10 h-10 animate-pulse" />
                        <p className="text-[9px] font-mono text-white uppercase tracking-widest italic text-center">Awaiting Simulation...</p>
                     </div>
                  ) : (
                     intelLog.map((log, i) => (
                        <motion.div 
                          key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          className="flex items-start gap-4 border-l border-white/5 pl-4 py-3"
                        >
                           <div className={`w-1 h-1 rounded-full mt-2 ${log.type === 'success' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)]' : 'bg-white/20'}`} />
                           <span className={`text-[9px] font-mono leading-relaxed ${log.type === 'success' ? 'text-rose-400' : 'text-white/40'} uppercase tracking-[0.1em]`}>
                              {log.text}
                           </span>
                        </motion.div>
                     ))
                  )}
               </div>
            </div>
          </div>

          <div className="p-10 rounded-[2.5rem] bg-rose-600/5 border border-rose-500/10 flex flex-col items-center gap-6 text-center">
             <Star className="w-8 h-8 text-rose-400/10" />
             <p className="text-[9px] font-mono text-rose-400/30 uppercase tracking-[0.5em] leading-relaxed">
               Wembley Road // Standardized Seed Logic Engaged
             </p>
          </div>
        </aside>
      </main>

        {/* Champion Reveal — only after Final is manually simulated */}
        <AnimatePresence>
          {bracket.champion && activeRound === bracket.rounds.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              className="relative z-10 max-w-[1800px] mx-auto px-12 mt-12 mb-16"
            >
              <div
                className="p-8 rounded-2xl text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(253,224,71,0.04))',
                  border: '1px solid rgba(234,179,8,0.2)',
                  boxShadow: '0 0 60px rgba(234,179,8,0.1)',
                }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                >
                  <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="currentColor" />
                </motion.div>
                <h2 className="text-3xl font-black text-yellow-400 mb-2">{bracket.champion}</h2>
                <p className="text-xs text-yellow-600/50 uppercase tracking-[0.3em] font-bold">FA Cup Champions</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Stats Panel */}
      <StatsPanel
        prediction={prediction}
        isOpen={statsPanelOpen}
        onClose={() => { setStatsPanelOpen(false); setPrediction(null); }}
        leagueColor="#7B0000"
      />
    </div>
  );
};

export default FACupBracketPage;

