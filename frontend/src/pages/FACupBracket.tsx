import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Play, ChevronRight } from 'lucide-react';
import axios from 'axios';
import StatsPanel from '../components/StatsPanel';

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
  { from: '#6366f1', to: '#8b5cf6', label: 'Third Round' },
  { from: '#06b6d4', to: '#22d3ee', label: 'Fourth Round' },
  { from: '#10b981', to: '#34d399', label: 'Fifth Round' },
  { from: '#f59e0b', to: '#fbbf24', label: 'Quarter-Finals' },
  { from: '#ef4444', to: '#f87171', label: 'Semi-Finals' },
  { from: '#eab308', to: '#fde047', label: 'The Final' },
];

const TIER_CONFIG: Record<string, { color: string; label: string; bg: string }> = {
  'Premier League': { color: '#a78bfa', label: 'PL', bg: 'rgba(167,139,250,0.1)' },
  'Championship': { color: '#60a5fa', label: 'CH', bg: 'rgba(96,165,250,0.1)' },
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

  if (!bracket) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#090A0F] text-white/50 min-h-screen">
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

      // Stagger reveal with animation delay
      await new Promise(resolve => setTimeout(resolve, 80));
      setRevealedWinners(prev => new Set(prev).add(match.id));
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

  return (
    <div className="min-h-screen bg-[#090A0F] text-white">
      {/* Header */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/fixtures')}
              className="p-2 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/50" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-rose-400">
                FA Cup — Road to Wembley
              </h1>
              <p className="text-[10px] text-white/25 mt-0.5 font-mono tracking-wider">
                {bracket.teams.length} TEAMS · CLICK SIMULATE TO ADVANCE
              </p>
            </div>
          </div>

          {/* NO champion badge shown automatically */}
        </div>
      </motion.div>

      {/* Round Tabs */}
      <div className="border-b border-white/5 bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2 overflow-x-auto">
          {bracket.rounds.map((round, i) => {
            const grad = ROUND_GRADIENTS[i % ROUND_GRADIENTS.length];
            return (
              <motion.button
                key={round.shortName}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveRound(i); setRevealedWinners(new Set()); }}
                className={`shrink-0 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                  activeRound === i ? 'text-white shadow-lg' : 'text-white/15 hover:text-white/40'
                }`}
                style={activeRound === i ? {
                  background: `linear-gradient(135deg, ${grad.from}20, ${grad.to}10)`,
                  border: `1px solid ${grad.from}40`,
                  boxShadow: `0 0 15px ${grad.from}15`,
                } : { border: '1px solid transparent' }}
              >
                {round.shortName}
                {round.isComplete && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
              </motion.button>
            );
          })}

          {/* Action Buttons */}
          <div className="ml-auto flex gap-2">
            {currentRound && !currentRound.isComplete && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={simulateRound}
                disabled={simulating}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                style={{
                  background: `linear-gradient(135deg, ${roundGrad.from}30, ${roundGrad.to}15)`,
                  border: `1px solid ${roundGrad.from}40`,
                  color: roundGrad.from,
                }}
              >
                <Play className="w-3.5 h-3.5" fill="currentColor" />
                {simulating ? 'Simulating...' : 'Simulate Round'}
              </motion.button>
            )}

            {currentRound?.isComplete && bracket.rounds.length > activeRound + 1 && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={advanceToNextRound}
                className="px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
              >
                Next Round <ChevronRight className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Bracket Matches */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {currentRound && (
          <motion.div
            key={activeRound}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-black" style={{ color: roundGrad.from }}>{currentRound.name}</h2>
              <span className="text-xs text-white/15 font-mono">{formatDate(currentRound.date)}</span>
              <span className="text-[10px] text-white/10 bg-white/5 px-2 py-0.5 rounded-full font-bold">
                {currentRound.matchCount} TIES
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentRound.matches.map((match, i) => {
                const homeTier = TIER_CONFIG[match.home.league] || TIER_CONFIG['League Two'];
                const awayTier = TIER_CONFIG[match.away.league] || TIER_CONFIG['League Two'];
                const isRevealed = revealedWinners.has(match.id) || (currentRound.isComplete && match.winner);
                const isHomeWin = match.winner === match.home.name;
                const isAwayWin = match.winner === match.away.name;

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 15, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 250, damping: 25 }}
                    onClick={() => handleMatchStats(match)}
                    className="p-4 rounded-xl border cursor-pointer transition-all hover:bg-white/[0.03] group"
                    style={{
                      borderColor: isRevealed ? `${roundGrad.from}25` : 'rgba(255,255,255,0.04)',
                      backgroundColor: isRevealed ? `${roundGrad.from}05` : 'rgba(255,255,255,0.01)',
                    }}
                  >
                    {/* Match Number + Neutral Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest">
                        TIE {match.matchNumber}
                      </span>
                      <div className="flex items-center gap-2">
                        {match.isNeutral && (
                          <span className="text-[7px] text-yellow-500/40 bg-yellow-500/10 px-1.5 py-0.5 rounded-full border border-yellow-500/15 uppercase font-black tracking-wider">
                            Neutral
                          </span>
                        )}
                        <span className="text-[7px] text-white/8 group-hover:text-white/20 transition-colors uppercase font-bold tracking-widest">
                          Tap for Intel
                        </span>
                      </div>
                    </div>

                    {/* Home Team */}
                    <motion.div
                      animate={isRevealed && !isHomeWin ? { opacity: 0.3 } : { opacity: 1 }}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ color: homeTier.color, backgroundColor: homeTier.bg }}>
                          {homeTier.label}
                        </span>
                        <span className={`text-sm ${isHomeWin ? 'font-black text-white' : 'font-semibold text-white/70'}`}>
                          {match.home.name}
                        </span>
                      </div>
                      <AnimatePresence>
                        {isRevealed && isHomeWin && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          >
                            <Trophy className="w-4 h-4" style={{ color: roundGrad.from }} fill="currentColor" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    <div className="h-px" style={{ backgroundColor: `${roundGrad.from}10` }} />

                    {/* Away Team */}
                    <motion.div
                      animate={isRevealed && !isAwayWin ? { opacity: 0.3 } : { opacity: 1 }}
                      className="flex items-center justify-between py-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded" style={{ color: awayTier.color, backgroundColor: awayTier.bg }}>
                          {awayTier.label}
                        </span>
                        <span className={`text-sm ${isAwayWin ? 'font-black text-white' : 'font-semibold text-white/70'}`}>
                          {match.away.name}
                        </span>
                      </div>
                      <AnimatePresence>
                        {isRevealed && isAwayWin && (
                          <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                          >
                            <Trophy className="w-4 h-4" style={{ color: roundGrad.from }} fill="currentColor" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Venue */}
                    <p className="text-[8px] text-white/10 mt-1.5 truncate font-mono uppercase tracking-wider">
                      🏟 {match.venue}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Champion Reveal — only after Final is manually simulated */}
        <AnimatePresence>
          {bracket.champion && activeRound === bracket.rounds.length - 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 20 }}
              className="mt-12 p-8 rounded-2xl text-center"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
