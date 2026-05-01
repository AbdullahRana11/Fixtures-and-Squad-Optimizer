import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Zap, ChevronRight, Star } from 'lucide-react';
import axios from 'axios';
import StatsPanel from '../components/StatsPanel';

interface UCLTeam {
  name: string;
  rank: number;
  overallStrength: number;
}

interface UCLMatch {
  id: string;
  round: string;
  matchNumber: number;
  home: UCLTeam | null;
  away: UCLTeam | null;
  winner: string | null;
  pathId: number;
}

interface UCLRound {
  name: string;
  matches: UCLMatch[];
  isComplete: boolean;
}

interface UCLBracket {
  rounds: UCLRound[];
  champion: string | null;
}

const THEME = {
    primary: '#003399',
    secondary: '#001a4d',
    accent: '#00f2ff',
    bg: '#05070a',
    card: 'rgba(0, 51, 153, 0.1)',
    border: 'rgba(0, 242, 255, 0.2)',
};



const UCLBracketPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { schedule: initialBracket } = (location.state as { schedule: UCLBracket; leagueId: string }) || {};

    const [bracket, setBracket] = useState<UCLBracket | null>(initialBracket || null);
    const [activeRound, setActiveRound] = useState(0);
    const [simulating, setSimulating] = useState(false);
    const [revealedWinners, setRevealedWinners] = useState<Set<string>>(new Set());
    const [statsPanelOpen, setStatsPanelOpen] = useState(false);
    const [prediction, setPrediction] = useState<any | null>(null);

    if (!bracket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#05070a] text-white/50 min-h-screen font-sans">
                <Star className="w-12 h-12 mb-4 text-blue-500/20 animate-pulse" />
                <p className="text-lg font-bold tracking-widest uppercase">No Bracket Data</p>
                <button onClick={() => navigate('/fixtures')} className="mt-4 text-blue-400 hover:text-blue-300 underline underline-offset-4 transition-colors">Return to Hub</button>
            </div>
        );
    }

    const currentRound = bracket.rounds[activeRound];

    const handleMatchStats = useCallback(async (match: UCLMatch) => {
        if (!match.home || !match.away) return;
        setStatsPanelOpen(true);
        try {
            const { data } = await axios.post('http://localhost:3000/api/fixtures/predict', {
                homeTeam: match.home.name,
                awayTeam: match.away.name,
            });
            setPrediction(data);
        } catch (err) { console.error(err); }
    }, []);

    const simulateRound = async () => {
        if (!currentRound || currentRound.isComplete) return;
        setSimulating(true);

        const winners: UCLTeam[] = [];
        const newRevealed = new Set(revealedWinners);

        for (const match of currentRound.matches) {
            if (!match.home || !match.away) continue;
            
            // Basic Elo-based simulation logic
            const hPower = match.home.overallStrength;
            const aPower = match.away.overallStrength;
            const homeProb = 0.5 + (hPower - aPower) / 100;
            const winner = Math.random() < homeProb ? match.home : match.away;

            match.winner = winner.name;
            winners.push(winner);

            await new Promise(resolve => setTimeout(resolve, 150));
            newRevealed.add(match.id);
            setRevealedWinners(new Set(newRevealed));
        }

        currentRound.isComplete = true;

        // Progress to next round
        if (activeRound < bracket.rounds.length - 1) {
            try {
                const { data } = await axios.post('http://localhost:3000/api/fixtures/ucl/next-round', {
                    bracket,
                    winners,
                    roundIndex: activeRound
                });
                setBracket(data);
            } catch (err) {
                console.error('Failed to advance round', err);
            }
        }

        if (currentRound.name === 'Final' && winners.length === 1) {
            setBracket(prev => prev ? { ...prev, champion: winners[0].name } : prev);
        }

        setSimulating(false);
    };

    return (
        <div className="min-h-screen bg-[#05070a] text-white selection:bg-blue-500/30">
            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-b border-blue-500/10 bg-[#0A0C14]/80 backdrop-blur-2xl sticky top-0 z-40"
            >
                <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/fixtures')} className="p-3 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all bg-white/[0.02] group">
                            <ArrowLeft className="w-5 h-5 text-white/30 group-hover:text-blue-400" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Star className="w-3 h-3 text-blue-400 fill-blue-400" />
                                <span className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-400/60">Stage: Knockout Path</span>
                            </div>
                            <h1 className="text-3xl font-black text-white italic">CHAMPIONS LEAGUE</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {!currentRound?.isComplete && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={simulateRound}
                                disabled={simulating}
                                className="px-6 py-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500/20 transition-all shadow-[0_0_30px_rgba(59,130,246,0.1)]"
                            >
                                <Zap className="w-4 h-4 fill-current" />
                                {simulating ? 'Simulating...' : 'Draw & Simulate'}
                            </motion.button>
                        )}
                        {currentRound?.isComplete && activeRound < bracket.rounds.length - 1 && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                onClick={() => { setActiveRound(activeRound + 1); setRevealedWinners(new Set()); }}
                                className="px-6 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black text-xs uppercase tracking-widest flex items-center gap-2"
                            >
                                Next Stage <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Rounds Navigation */}
            <div className="bg-black/20 border-b border-white/5 overflow-x-auto no-scrollbar">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-8">
                    {bracket.rounds.map((round, idx) => (
                        <button
                            key={round.name}
                            onClick={() => { setActiveRound(idx); setRevealedWinners(new Set()); }}
                            className={`relative h-full px-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeRound === idx ? 'text-blue-400' : 'text-white/20 hover:text-white/40'}`}
                        >
                            {round.name}
                            {activeRound === idx && (
                                <motion.div layoutId="round-active" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 shadow-[0_0_10px_rgba(96,165,246,0.5)]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h2 className="text-4xl font-black mb-2 opacity-90">{currentRound.name}</h2>
                    <p className="text-white/20 text-xs font-mono tracking-tighter">
                        {currentRound.matches.length} {currentRound.matches.length === 1 ? 'FINAL MATCH' : 'TWO-LEGGED TIES'} — SEEDED DRAW APPLIED
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentRound.matches.map((match, i) => {
                        const isRevealed = revealedWinners.has(match.id) || (currentRound.isComplete && match.winner);
                        const isHomeWin = match.winner === match.home?.name;
                        const isAwayWin = match.winner === match.away?.name;

                        return (
                            <motion.div
                                key={match.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => handleMatchStats(match)}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer group hover:scale-[1.02] ${
                                    isRevealed ? 'bg-blue-500/5 border-blue-500/20' : 'bg-white/[0.02] border-white/5'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-4 opacity-30 text-[9px] font-black uppercase tracking-widest">
                                    <span>Match {match.matchNumber}</span>
                                    <span>Click for Intel</span>
                                </div>

                                <div className="space-y-3">
                                    <div className={`flex justify-between items-center ${isRevealed && !isHomeWin ? 'opacity-30' : 'opacity-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400/50" />
                                            <span className={`text-base ${isHomeWin ? 'font-black text-white' : 'font-bold text-white/60'}`}>
                                                {match.home?.name || 'Waiting...'}
                                            </span>
                                        </div>
                                        {isRevealed && isHomeWin && <Trophy className="w-4 h-4 text-blue-400" fill="currentColor" />}
                                    </div>

                                    <div className="h-px bg-white/5" />

                                    <div className={`flex justify-between items-center ${isRevealed && !isAwayWin ? 'opacity-30' : 'opacity-100'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                            <span className={`text-base ${isAwayWin ? 'font-black text-white' : 'font-bold text-white/60'}`}>
                                                {match.away?.name || 'Waiting...'}
                                            </span>
                                        </div>
                                        {isRevealed && isAwayWin && <Trophy className="w-4 h-4 text-blue-400" fill="currentColor" />}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Champion Section */}
                <AnimatePresence>
                    {bracket.champion && activeRound === 4 && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="mt-20 p-12 rounded-[2rem] border border-blue-500/20 bg-blue-500/5 text-center relative overflow-hidden shadow-2xl"
                        >
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-50" />
                            <Trophy className="w-20 h-20 text-blue-400 mx-auto mb-6 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]" fill="currentColor" />
                            <h2 className="text-5xl font-black mb-2 tracking-tight italic">{bracket.champion}</h2>
                            <p className="text-blue-400 font-mono text-xs uppercase tracking-[0.5em] font-black">2024-25 Champions League Winners</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            <StatsPanel 
                prediction={prediction} 
                isOpen={statsPanelOpen} 
                onClose={() => { setStatsPanelOpen(false); setPrediction(null); }}
                leagueColor={THEME.primary}
            />
        </div>
    );
};

export default UCLBracketPage;
