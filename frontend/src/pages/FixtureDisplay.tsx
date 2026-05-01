import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Shield, ArrowLeft, Settings2, Cpu, Filter, RefreshCw, Save, Shuffle, Zap } from 'lucide-react';
import axios from 'axios';
import StatsPanel from '../components/StatsPanel';
import { getHistory, saveToHistory } from '../utils/fixtureUtils';

// Tactical UI Components
import Hyperspeed from '../components/reactbits/Hyperspeed';
import GridScan from '../components/reactbits/GridScan';
import DecryptedText from '../components/reactbits/DecryptedText';
import TiltedCard from '../components/reactbits/TiltedCard';

interface FixtureMatch {
  id: string;
  matchweek: number;
  home: string;
  away: string;
  date: string;
  time: string;
  stadium: string;
  is_derby: boolean;
}

interface SeasonSchedule {
  league: string;
  season: string;
  teams: string[];
  totalMatchweeks: number;
  totalMatches: number;
  fixtures: FixtureMatch[];
  telemetry: {
    generation_time_ms: number;
    constraint_violations_fixed: number;
    total_rounds: number;
  };
}

const LEAGUE_COLORS: Record<string, { primary: string; bg: string; border: string; glow: string }> = {
  pl: { primary: '#A020F0', bg: 'rgba(160,32,240,0.08)', border: 'rgba(160,32,240,0.3)', glow: '0 0 20px rgba(160,32,240,0.15)' },
  ucl: { primary: '#0052FF', bg: 'rgba(0,82,255,0.08)', border: 'rgba(0,82,255,0.3)', glow: '0 0 20px rgba(0,82,255,0.15)' },
  bundesliga: { primary: '#D3010C', bg: 'rgba(211,1,12,0.08)', border: 'rgba(211,1,12,0.3)', glow: '0 0 20px rgba(211,1,12,0.15)' },
  facup: { primary: '#7B0000', bg: 'rgba(123,0,0,0.08)', border: 'rgba(123,0,0,0.3)', glow: '0 0 20px rgba(123,0,0,0.15)' },
  seriea: { primary: '#008FD7', bg: 'rgba(0,143,215,0.08)', border: 'rgba(0,143,215,0.3)', glow: '0 0 20px rgba(0,143,215,0.15)' },
  laliga: { primary: '#FF4B00', bg: 'rgba(255,75,0,0.08)', border: 'rgba(255,75,0,0.3)', glow: '0 0 20px rgba(255,75,0,0.15)' },
  custom: { primary: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.3)', glow: '0 0 20px rgba(16,185,129,0.15)' },
};

const LEAGUE_NAMES: Record<string, string> = {
  pl: 'Premier League', ucl: 'Champions League', bundesliga: 'Bundesliga',
  facup: 'FA Cup', seriea: 'Serie A', laliga: 'La Liga',
  custom: 'Custom League',
};

const FixtureDisplay: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, leagueId } = (location.state as { schedule: SeasonSchedule; leagueId: string }) || {};

  const [currentMW, setCurrentMW] = useState(1);
  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [modifySuggestions, setModifySuggestions] = useState<any[] | null>(null);
  const [loadingModify] = useState(false);
  const [statsPanelOpen, setStatsPanelOpen] = useState(false);
  const [prediction, setPrediction] = useState<any | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'matchweek' | 'team'>('matchweek');

  const MatchCard: React.FC<{ match: FixtureMatch; index: number; colors: any; onClick: () => void }> = ({ match, index, colors, onClick }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      <TiltedCard 
        className="w-full"
        maxTilt={5}
      >
        <div 
          onClick={onClick}
          className="p-5 rounded-xl border cursor-pointer transition-all group overflow-hidden bg-black/60 backdrop-blur-md"
          style={{
            borderColor: match.is_derby ? `${colors.primary}50` : 'rgba(255,255,255,0.05)',
            boxShadow: match.is_derby ? `0 0 20px ${colors.primary}10` : 'none'
          }}
        >
          {match.is_derby && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="absolute top-0 right-0 p-2"
            >
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
            </motion.div>
          )}

          <div className="flex items-center justify-between gap-6">
            {/* Home Team */}
            <div className="flex-1 text-right">
              <span className="text-white font-medium tracking-tight group-hover:text-emerald-400 transition-colors">
                {match.home}
              </span>
            </div>

            {/* Match Info Central HUD */}
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <div className="text-[10px] font-bold text-white/40 tracking-[0.2em] uppercase">
                {match.time}
              </div>
              <div className="h-px w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="text-[9px] text-white/30 font-mono">
                {match.date}
              </div>
            </div>

            {/* Away Team */}
            <div className="flex-1 text-left">
              <span className="text-white font-medium tracking-tight group-hover:text-emerald-400 transition-colors">
                {match.away}
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-white/20 font-mono">
            <MapPin className="w-3 h-3" />
            <span className="truncate">{match.stadium}</span>
          </div>
        </div>
      </TiltedCard>
    </motion.div>
  );

  const colors = LEAGUE_COLORS[leagueId] || LEAGUE_COLORS.pl;

  // CROSS-COMPETITION LOGIC
  const teamFixturesTimeline = useMemo(() => {
    if (!schedule || selectedTeam === 'all') return [];

    // 1. Get from current competition
    const currentCompMatches = schedule.fixtures
      .filter(f => f.home === selectedTeam || f.away === selectedTeam)
      .map(f => ({ ...f, tournament: LEAGUE_NAMES[leagueId] || 'League' }));

    // 2. Scan History for other competitions
    const history = getHistory();
    const otherCompMatches: any[] = [];

    history.forEach(entry => {
      // Avoid duplicating current competition if it's already in history
      // Usually, we'd check by ID or unique name
      if (entry.name === schedule.league) return; 

      entry.fixtures.forEach((f: any) => {
        if (f.home === selectedTeam || f.away === selectedTeam) {
          otherCompMatches.push({
            ...f,
            tournament: entry.name
          });
        }
      });
    });

    // 3. Merge and Sort by Date
    return [...currentCompMatches, ...otherCompMatches].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [schedule, selectedTeam, leagueId]);

  const matchweekFixtures = useMemo(() => {
    if (!schedule) return [];
    return schedule.fixtures.filter(f => f.matchweek === currentMW);
  }, [schedule, currentMW]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const { data } = await axios.post('http://localhost:3000/api/fixtures/generate', {
        league: leagueId,
        teamNames: schedule.teams,
      });
      // Update local state by forcing a refresh or navigating again
      navigate(location.pathname, { state: { schedule: data, leagueId }, replace: true });
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShuffle = () => {
    // Client-side quick shuffle of dates within the schedule (keeping matchweeks)
    // or just trigger re-render with a shuffle. 
    // Usually "shuffling" in a fixture app means a new generation.
    handleRegenerate();
  };

  const handleSaveToHistory = () => {
    saveToHistory({
      name: LEAGUE_NAMES[leagueId] || 'League',
      format: 'league',
      seed: 0,
      teams: schedule.teams,
      fixtures: schedule.fixtures,
      source: LEAGUE_NAMES[leagueId]
    });
    alert('Fixtures saved to global history!');
  };

  const matchweekDates = useMemo(() => {
    if (!schedule) return new Map<number, string>();
    const map = new Map<number, string>();
    for (const f of schedule.fixtures) {
      if (!map.has(f.matchweek)) map.set(f.matchweek, f.date);
    }
    return map;
  }, [schedule]);

  const handleMatchClick = useCallback(async (match: FixtureMatch) => {
    setSelectedFixture(match.id);
    setStatsPanelOpen(true);
    try {
      const { data } = await axios.post('http://localhost:3000/api/fixtures/predict', {
        homeTeam: match.home,
        awayTeam: match.away,
        isDerby: match.is_derby,
      });
      setPrediction(data);
    } catch (err) {
      console.error('Prediction failed:', err);
    }
  }, []);

  // handleModify removed as it was unused

  const handleOptimizeSquad = useCallback(async () => {
    if (!schedule || leagueId !== 'pl') return;
    setOptimizing(true);
    try {
      const mwFixtures = matchweekFixtures.map(f => ({ home: f.home, away: f.away }));
      const { data } = await axios.post('http://localhost:3000/api/fpl/optimize-matchweek', {
        budget: 100,
        matchweek: currentMW,
        fixtures: mwFixtures,
      });
      navigate('/fpl', { state: { optimizedResult: data, matchweek: currentMW } });
    } catch (err) {
      console.error('FPL optimization failed:', err);
    } finally {
      setOptimizing(false);
    }
  }, [schedule, leagueId, currentMW, matchweekFixtures, navigate]);

  if (!schedule) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#090A0F] text-white/50 min-h-screen">
        <p className="text-lg">No fixture data available.</p>
        <button onClick={() => navigate('/fixtures')} className="mt-4 text-emerald-400 underline">Back to Competitions</button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#030408] text-white relative overflow-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <Hyperspeed 
          effectOptions={{
            distortion: 'turbulentDistortion',
            speedUp: 2,
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xffffff,
              brokenLines: 0xffffff,
              leftCars: [0x10b981, 0x059669, 0x047857],
              rightCars: [0x10b981, 0x059669, 0x047857],
              sticks: 0x10b981
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030408]/80 via-[#030408]/40 to-[#030408]/90 pointer-events-none" />
        <GridScan 
          color={colors.primary} 
        />
      </div>

      <div className="relative z-10">
      {/* Header */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/fixtures')}
              className="p-2 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/50" />
            </motion.button>
            <div>
              <div className="flex items-center gap-2">
                <DecryptedText
                  text={`${LEAGUE_NAMES[leagueId]} ${schedule.season}`}
                  className="text-2xl font-black tracking-tighter uppercase italic"
                  animateOn="view"
                  revealDirection="center"
                  speed={80}
                />
                <div className="px-2 py-0.5 rounded bg-white/5 border border-white/10">
                  <span className="text-[10px] font-mono text-white/40 uppercase">Live Ops</span>
                </div>
              </div>
              <p className="text-[10px] text-white/25 mt-1 font-mono tracking-[0.2em] uppercase">
                {schedule.totalMatches} MATCHES · {schedule.totalMatchweeks} MW · {schedule.telemetry.generation_time_ms}ms · {schedule.telemetry.constraint_violations_fixed} FIXES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-2 h-10 mr-4">
                <Filter className="w-4 h-4 text-white/20 mx-2" />
                <select 
                  value={selectedTeam}
                  onChange={(e) => {
                    setSelectedTeam(e.target.value);
                    setViewMode(e.target.value === 'all' ? 'matchweek' : 'team');
                  }}
                  className="bg-transparent text-xs font-bold text-white outline-none pr-4 capitalize"
                >
                  <option value="all">View All Teams</option>
                  {schedule.teams.sort().map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
             </div>

             <div className="flex items-center gap-2 pr-4 border-r border-white/10 mr-4">
                <button 
                  onClick={handleSaveToHistory}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                  title="Save to Global History"
                >
                  <Save className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleShuffle}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                  title="Shuffle Dates"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className={`p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-all ${isRegenerating ? 'animate-spin' : ''}`}
                  title="Complete Regeneration"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
             </div>

            {/* FPL Optimize Button (PL only) */}
            {leagueId === 'pl' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOptimizeSquad}
                disabled={optimizing}
                className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 border transition-all"
                style={{
                  borderColor: `${colors.primary}50`,
                  backgroundColor: `${colors.primary}10`,
                  color: colors.primary,
                }}
              >
                <Cpu className="w-4 h-4" />
                {optimizing ? 'Optimizing...' : `FPL: Optimize MW${currentMW}`}
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Matchweek Navigator - Only shown in matchweek mode */}
      {viewMode === 'matchweek' && (
        <div className="border-b border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMW(Math.max(1, currentMW - 1))}
              disabled={currentMW === 1}
              className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 disabled:opacity-20 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <div className="flex-1 overflow-x-auto flex gap-1 scrollbar-hide">
              {Array.from({ length: (schedule.totalMatchweeks || 38) }, (_, i) => i + 1).map(mw => (
                <motion.button
                  key={mw}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentMW(mw)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentMW === mw ? 'text-white shadow-lg' : 'text-white/15 hover:text-white/40'
                  }`}
                  style={currentMW === mw ? { backgroundColor: colors.bg, border: `1px solid ${colors.border}`, boxShadow: colors.glow } : {}}
                >
                  {mw}
                </motion.button>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }}
              onClick={() => setCurrentMW(Math.min((schedule.totalMatchweeks || 38), currentMW + 1))}
              disabled={currentMW === (schedule.totalMatchweeks || 38)}
              className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 disabled:opacity-20 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'matchweek' ? (
            <motion.div
              key="mw-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center gap-3 mb-8">
                <Calendar className="w-5 h-5" style={{ color: colors.primary }} />
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tight">Matchweek {currentMW}</h2>
                  <p className="text-xs text-white/25 font-mono">{matchweekDates.get(currentMW) ? formatDate(matchweekDates.get(currentMW)!) : 'TBD'}</p>
                </div>
              </div>

              <div className="space-y-3">
                {matchweekFixtures.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} colors={colors} onClick={() => handleMatchClick(match)} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="team-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white/10 bg-white/5">
                    <Shield className="w-7 h-7 text-white/40" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{selectedTeam}</h2>
                    <p className="text-[10px] text-white/25 uppercase font-bold tracking-widest">Season Roadmap • {teamFixturesTimeline.length} Fixtures</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase text-white/20">
                    Cross-Competition Active
                  </div>
                </div>
              </div>

              <div className="space-y-4 relative pl-8 border-l border-white/5">
                {teamFixturesTimeline.map((match) => (
                  <div key={match.id} className="relative">
                    {/* Timeline Node */}
                    <div className="absolute -left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#090A0F] bg-zinc-800 z-10" 
                         style={{ backgroundColor: match.tournament.includes('Champions') ? '#0052FF' : match.tournament.includes('Premier') ? '#A020F0' : '#333' }} />
                    
                    <motion.div 
                      className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-white/5 text-white/40 uppercase tracking-tighter">
                             {match.tournament}
                           </span>
                           {match.matchweek && <span className="text-[9px] font-bold text-white/10 uppercase">MW {match.matchweek}</span>}
                        </div>
                        <span className="text-[10px] font-mono text-white/30">{formatDate(match.date)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                         <span className={`text-sm font-bold ${match.home === selectedTeam ? 'text-white' : 'text-white/40'}`}>{match.home}</span>
                         <div className="flex items-center gap-4 mx-4">
                            <div className="w-8 h-[1px] bg-white/10" />
                            <span className="text-[9px] font-black text-white/10">VS</span>
                            <div className="w-8 h-[1px] bg-white/10" />
                         </div>
                         <span className={`text-sm font-bold ${match.away === selectedTeam ? 'text-white' : 'text-white/40'}`}>{match.away}</span>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-[9px] text-white/15 uppercase font-black tracking-widest">
                         <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {match.time}</span>
                         <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {match.stadium}</span>
                         {match.is_derby && <span className="text-amber-500/50 flex items-center gap-1"><Zap className="w-3 h-3" /> Rivalry Match</span>}
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modification Suggestions */}
        <AnimatePresence>
          {selectedFixture && modifySuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Reschedule Options</h3>
                <button onClick={() => { setSelectedFixture(null); setModifySuggestions(null); }} className="ml-auto text-xs text-white/30 hover:text-white/60">Close</button>
              </div>
              {loadingModify ? (
                <p className="text-xs text-white/30 animate-pulse">Analyzing...</p>
              ) : modifySuggestions.length === 0 ? (
                <p className="text-xs text-white/30">No alternatives found.</p>
              ) : (
                <div className="space-y-2">
                  {modifySuggestions.map((alt, i) => (
                    <div key={i} className="p-3 rounded-lg border border-white/5 bg-white/[0.02] flex items-center justify-between hover:border-emerald-500/20 transition-colors cursor-pointer">
                      <div>
                        <p className="text-xs text-white/70">{alt.reason}</p>
                        <p className="text-[10px] text-white/30 mt-1">Alternative: {formatDate(alt.date)}</p>
                      </div>
                      {alt.swapWith && (
                        <span className="text-[9px] text-yellow-500/50 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">SWAP</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats Panel Overlay */}
      <StatsPanel
        prediction={prediction}
        isOpen={statsPanelOpen}
        onClose={() => { setStatsPanelOpen(false); setPrediction(null); }}
        leagueColor={colors.primary}
      />
    </div>
  </div>
);
};

export default FixtureDisplay;
