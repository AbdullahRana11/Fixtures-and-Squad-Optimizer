import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Trophy, ArrowLeft, Zap, ChevronRight, Activity, Cpu } from 'lucide-react';
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
    primary: '#0052FF', // Deep Blue
    bg: '#02040A',
};

const UCLBracketPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryId = searchParams.get('id');
    const { schedule: initialBracket } = (location.state as { schedule: UCLBracket; leagueId: string }) || {};

    const [bracket, setBracket] = useState<UCLBracket | null>(initialBracket || null);
    const [activeRound, setActiveRound] = useState(0);
    const [simulating, setSimulating] = useState(false);
    const [revealedWinners, setRevealedWinners] = useState<Set<string>>(new Set());
    const [statsPanelOpen, setStatsPanelOpen] = useState(false);
    const [prediction, setPrediction] = useState<any | null>(null);
    const [intelLog, setIntelLog] = useState<{text: string, type: string}[]>([]);
    const [tournamentId, setTournamentId] = useState<string | null>(queryId || null);
    const [isLoading, setIsLoading] = useState(!initialBracket);

    // Persistence: Load bracket by query ID, fallback to latest UCL bracket
    React.useEffect(() => {
        const loadBracket = async () => {
            if (initialBracket) {
                setIsLoading(false);
                return;
            }
            try {
                if (queryId) {
                    // Load specific tournament by ID
                    const { data } = await axios.get(`http://localhost:3000/api/tournaments/${queryId}`);
                    if (data) {
                        setBracket(data.bracket);
                        setTournamentId(data.id);
                        const lastIncompleteIdx = data.bracket.rounds?.findIndex((r: any) => !r.isComplete) ?? -1;
                        setActiveRound(lastIncompleteIdx !== -1 ? lastIncompleteIdx : 0);
                    }
                } else {
                    // Fallback: load latest UCL tournament
                    const { data } = await axios.get('http://localhost:3000/api/tournaments/type/ucl');
                    if (data && data.length > 0) {
                        const latest = data[0];
                        setBracket(latest.bracket);
                        setTournamentId(latest.id);
                        const lastIncompleteIdx = latest.bracket.rounds?.findIndex((r: any) => !r.isComplete) ?? -1;
                        if (lastIncompleteIdx !== -1) setActiveRound(lastIncompleteIdx);
                        else setActiveRound(latest.bracket.rounds?.length - 1 ?? 0);
                    }
                }
            } catch (err) {
                console.error('Failed to load bracket:', err);
            } finally {
                setIsLoading(false);
            }
        };
        loadBracket();
    }, [initialBracket, queryId]);

    // Persistence: Auto-save on bracket change
    React.useEffect(() => {
        const saveBracket = async () => {
            if (bracket) {
                try {
                    const { data } = await axios.post('http://localhost:3000/api/tournaments/save', {
                        id: tournamentId,
                        name: `UCL Tournament ${new Date().toLocaleDateString()}`,
                        type: 'ucl',
                        bracket,
                        status: bracket.champion ? 'completed' : 'active'
                    });
                    if (!tournamentId) setTournamentId(data.id);
                } catch (err) {
                    console.error('Failed to save bracket:', err);
                }
            }
        };
        
        const timeout = setTimeout(saveBracket, 1000);
        return () => clearTimeout(timeout);
    }, [bracket, tournamentId]);

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-void text-zinc-400 min-h-screen">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                    className="w-16 h-16 rounded-full border-4 border-zinc-800 border-t-teal-500"
                />
                <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-zinc-400 font-open">Loading Knockout Data...</p>
            </div>
        );
    }

    if (!bracket) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-void text-zinc-300 min-h-screen relative overflow-hidden font-open">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 flex flex-col items-center gap-8 p-12 rounded-3xl border border-zinc-800 bg-zinc-900/50 text-center max-w-md shadow-sm"
                >
                    <div className="w-20 h-20 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Trophy className="w-10 h-10 text-zinc-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">No Active Tournament</p>
                        <h2 className="text-3xl font-merriweather font-bold text-white tracking-tight">Bracket Offline</h2>
                        <p className="text-zinc-400 text-sm mt-3 leading-relaxed">Generate a Knockout tournament first, then open the bracket here.</p>
                    </div>
                    <div className="flex flex-col gap-3 w-full mt-4">
                        <button
                            onClick={() => navigate('/fixtures/custom')}
                            className="w-full py-4 rounded-xl bg-teal-600 text-white font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-3 hover:bg-teal-700 transition-colors"
                        >
                            <Zap className="w-4 h-4" /> Generate Tournament
                        </button>
                        <button
                            onClick={() => navigate('/fixtures')}
                            className="w-full py-4 rounded-xl border border-zinc-700 text-zinc-400 font-bold uppercase text-xs tracking-wider hover:bg-zinc-800 hover:text-white transition-colors"
                        >
                            Return to Hub
                        </button>
                    </div>
                </motion.div>
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

            setIntelLog(prev => [...prev, { text: `Simulating: ${match.home?.name ?? 'TBD'} vs ${match.away?.name ?? 'TBD'}`, type: 'info' }]);
            await new Promise(resolve => setTimeout(resolve, 300));
            setIntelLog(prev => [...prev, { text: `Winner: ${winner.name}`, type: 'success' }]);
            
            newRevealed.add(match.id);
            setRevealedWinners(new Set(newRevealed));
            await new Promise(resolve => setTimeout(resolve, 150));
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
        <div className="min-h-screen bg-void text-white font-open relative overflow-x-hidden">
            <div className="absolute inset-0 z-0 opacity-5 bg-[url('/noise.svg')]" />

            {/* Header */}
            <header className="relative z-40 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
                <div className="max-w-[1800px] mx-auto px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/fixtures')} className="p-3 rounded-full border border-zinc-700 hover:bg-zinc-800 transition-colors">
                            <ArrowLeft className="w-5 h-5 text-zinc-400 hover:text-white" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-teal-500">Knockout Stage</span>
                            </div>
                            <h1 className="text-3xl font-merriweather font-bold text-white tracking-wide">
                                Champions League
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!currentRound?.isComplete && (
                            <button
                                onClick={simulateRound}
                                disabled={simulating}
                                className="px-6 py-3 rounded-lg bg-teal-600 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50"
                            >
                                <Zap className="w-4 h-4" />
                                {simulating ? 'Simulating...' : 'Execute Draw'}
                            </button>
                        )}
                        {currentRound?.isComplete && activeRound < bracket.rounds.length - 1 && (
                            <button
                                onClick={() => { setActiveRound(activeRound + 1); setRevealedWinners(new Set()); setIntelLog([]); }}
                                className="px-6 py-3 rounded-lg bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-700 transition-colors"
                            >
                                Next Round <ChevronRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Rounds Navigation */}
            <div className="relative z-30 bg-zinc-900/50 border-b border-zinc-800 overflow-x-auto">
                <div className="max-w-[1800px] mx-auto px-8 h-14 flex items-center gap-8">
                    {bracket.rounds.map((round, idx) => (
                        <button
                            key={round.name}
                            onClick={() => { setActiveRound(idx); setRevealedWinners(new Set()); setIntelLog([]); }}
                            className={`relative h-full px-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeRound === idx ? 'text-teal-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            {round.name}
                            {activeRound === idx && (
                                <motion.div layoutId="round-active" className="absolute bottom-0 left-0 right-0 h-[2px] bg-teal-500" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <main className="relative z-20 max-w-[1800px] mx-auto px-8 py-12 grid lg:grid-cols-[1fr_380px] gap-12">
                <div className="space-y-10">
                    <div>
                        <h2 className="text-4xl font-merriweather font-bold mb-2">{currentRound.name}</h2>
                        <div className="flex items-center gap-4 text-zinc-500 text-sm font-semibold">
                           <p>{currentRound.matches.length} {currentRound.matches.length === 1 ? 'Final' : 'Matches'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {currentRound.matches.map((match, i) => {
                            const isRevealed = revealedWinners.has(match.id) || (currentRound.isComplete && match.winner);
                            const isHomeWin = match.winner === match.home?.name;
                            const isAwayWin = match.winner === match.away?.name;

                            return (
                                <motion.div
                                    key={match.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => handleMatchStats(match)}
                                    className={`relative p-6 rounded-xl border transition-all cursor-pointer group bg-zinc-900/50 ${
                                        isRevealed ? 'border-zinc-700 hover:border-teal-500' : 'border-zinc-800'
                                    }`}
                                >
                                    <div className="flex justify-between items-center mb-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                        <span className="flex items-center gap-2"><Cpu className="w-4 h-4" /> Match {match.matchNumber}</span>
                                        <span className="group-hover:text-teal-500 transition-colors">Details</span>
                                    </div>

                                    <div className="space-y-4">
                                        <div className={`flex justify-between items-center transition-opacity ${isRevealed && !isHomeWin ? 'opacity-50' : 'opacity-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${isHomeWin ? 'bg-teal-500' : 'bg-zinc-700'}`} />
                                                <span className={`text-lg font-bold ${isHomeWin ? 'text-white' : 'text-zinc-300'}`}>
                                                    {match.home?.name || 'TBD'}
                                                </span>
                                            </div>
                                            {isRevealed && isHomeWin && <Trophy className="w-5 h-5 text-teal-500" />}
                                        </div>

                                        <div className="h-px bg-zinc-800" />

                                        <div className={`flex justify-between items-center transition-opacity ${isRevealed && !isAwayWin ? 'opacity-50' : 'opacity-100'}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-2 rounded-full ${isAwayWin ? 'bg-teal-500' : 'bg-zinc-700'}`} />
                                                <span className={`text-lg font-bold ${isAwayWin ? 'text-white' : 'text-zinc-300'}`}>
                                                    {match.away?.name || 'TBD'}
                                                </span>
                                            </div>
                                            {isRevealed && isAwayWin && <Trophy className="w-5 h-5 text-teal-500" />}
                                        </div>

                                        {/* Win Probability Bar */}
                                        <div className="mt-6 space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                                <span>Probability</span>
                                                <span className="text-teal-500">{(match.home?.overallStrength && match.away?.overallStrength) ? (0.5 + (match.home.overallStrength - match.away.overallStrength) / 100).toFixed(2) : '0.00'}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: isRevealed ? '100%' : '50%' }}
                                                    className="h-full bg-teal-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Event Log Sidebar */}
                <aside className="space-y-6">
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                           <Activity className="w-5 h-5 text-teal-500" />
                           <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Match Events</h3>
                        </div>
                        
                        <div className="h-[400px] overflow-y-auto custom-scrollbar pr-2 space-y-3">
                           {intelLog.length === 0 ? (
                               <p className="text-sm text-zinc-500 text-center mt-10">Awaiting simulation...</p>
                           ) : (
                               intelLog.map((log, i) => (
                                  <motion.div 
                                    key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                    className="flex items-start gap-3 border-l-2 border-zinc-800 pl-3 py-1"
                                  >
                                     <span className={`text-xs font-semibold ${log.type === 'success' ? 'text-teal-400' : 'text-zinc-400'}`}>
                                        {log.text}
                                     </span>
                                  </motion.div>
                               ))
                           )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* Champion Section */}
            <AnimatePresence>
                {bracket.champion && activeRound === 4 && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-12 p-12 rounded-2xl border border-teal-500/20 bg-teal-900/20 text-center max-w-2xl mx-auto"
                    >
                        <Trophy className="w-20 h-20 text-teal-500 mx-auto mb-6" />
                        <h2 className="text-5xl font-merriweather font-bold mb-4 text-white">
                            {bracket.champion}
                        </h2>
                        <p className="text-teal-400 text-sm font-bold uppercase tracking-widest">
                            Champions League Winners
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

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
