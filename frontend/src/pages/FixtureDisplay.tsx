import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Shield, ArrowLeft, Settings2, Cpu, Filter, RefreshCw, Save, Zap, FileText, X } from 'lucide-react';
import axios from 'axios';
import StatsPanel from '../components/StatsPanel';
import { getHistory, saveToHistory, deleteHistoryEntry } from '../utils/fixtureUtils';

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

const LEAGUE_COLORS: Record<string, { primary: string; bg: string; border: string }> = {
  pl: { primary: '#A020F0', bg: 'rgba(160,32,240,0.05)', border: 'rgba(160,32,240,0.2)' },
  ucl: { primary: '#10b981', bg: 'rgba(0,0,0,0.8)', border: 'rgba(255,255,255,0.1)' },
  bundesliga: { primary: '#D3010C', bg: 'rgba(211,1,12,0.05)', border: 'rgba(211,1,12,0.2)' },
  facup: { primary: '#7B0000', bg: 'rgba(123,0,0,0.05)', border: 'rgba(123,0,0,0.2)' },
  seriea: { primary: '#10b981', bg: 'rgba(0,143,215,0.05)', border: 'rgba(0,143,215,0.2)' },
  laliga: { primary: '#FF4B00', bg: 'rgba(255,75,0,0.05)', border: 'rgba(255,75,0,0.2)' },
  custom: { primary: '#10b981', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.2)' },
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

  // New state for FA Cup Rescheduling Integration
  const [syncing, setSyncing] = useState(false);
  const [reschedulingSummary, setReschedulingSummary] = useState<any | null>((schedule as any)?.reschedulingSummary || null);
  const [logDrawerOpen, setLogDrawerOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const handleFASync = async () => {
    setSyncing(true);
    try {
      const { data } = await axios.post('/api/fixtures/sync-tournaments');
      if (data.status === 'rescheduled') {
        alert(`Rescheduled ${data.matchesRescheduled.length} matches due to FA Cup conflicts. Please regenerate or refresh to see the latest full schedule.`);
        if (data.plScheduleUpdated) {
          setReschedulingSummary(data);
        }
      } else if (data.status === 'no_conflicts') {
        alert('No FA Cup conflicts found.');
      } else {
        alert(`Sync failed: ${data.errors?.join(', ')}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(false);
    }
  };

  React.useEffect(() => {
    if (schedule && schedule.fixtures.length > 0) {
      const history = getHistory();
      const latest = history.find(h => 
        h.name === (LEAGUE_NAMES[leagueId] || 'League') || 
        h.source === (LEAGUE_NAMES[leagueId] || leagueId)
      );
      
      // Compare actual fixture content, not just count — fixtures.length is always 380 for PL,
      // so count-based comparison would never detect regenerated fixtures.
      const firstFixture = schedule.fixtures[0];
      const latestFirst = latest?.fixtures?.[0];
      const isSameContent = latest && latestFirst &&
        latestFirst.home === firstFixture.home &&
        latestFirst.away === firstFixture.away &&
        latest.fixtures.length === schedule.fixtures.length;
      
      if (!isSameContent) {
        // Remove old entry for this league before saving the new one
        if (latest) {
          deleteHistoryEntry(latest.id);
        }
        saveToHistory({
          name: LEAGUE_NAMES[leagueId] || 'League',
          format: leagueId === 'ucl' ? 'tournament' : 'league',
          seed: 0,
          teams: schedule.teams,
          fixtures: schedule.fixtures,
          source: LEAGUE_NAMES[leagueId] || leagueId
        });
      }
    }
  }, [schedule, leagueId]);

  const MatchCard: React.FC<{ match: FixtureMatch; index: number; colors: any; onClick: () => void; reschedulingSummary?: any }> = ({ match, index, colors, onClick, reschedulingSummary }) => {
    const isRescheduled = reschedulingSummary?.matchesRescheduled?.some((r: any) => r.matchId === match.id);
    const rescheduleInfo = reschedulingSummary?.matchesRescheduled?.find((r: any) => r.matchId === match.id);

    return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      <div 
        onClick={onClick}
        className={`p-5 rounded-xl border bg-black/50 hover:bg-zinc-800 cursor-pointer transition-all group overflow-hidden relative shadow-sm hover:shadow-md ${isRescheduled ? 'border-amber-500/30 bg-amber-900/10' : 'border-zinc-800'}`}
        style={{
          borderTopColor: match.is_derby && !isRescheduled ? colors.primary : '',
          borderTopWidth: match.is_derby && !isRescheduled ? '2px' : '1px'
        }}
      >
        {match.is_derby && !isRescheduled && (
          <div className="absolute top-0 right-0 p-2 z-20">
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
        )}
        {isRescheduled && (
          <div className="absolute top-0 right-4 bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 rounded-b-md z-20 shadow-md flex items-center gap-1">
            <RefreshCw className="w-2 h-2" /> RESCHEDULED
          </div>
        )}

        <div className="flex items-center justify-between gap-6 relative z-10">
          {/* Home Team */}
          <div className="flex-1 text-right">
            <span className="text-white font-bold tracking-tight text-lg group-hover:text-emerald-400 transition-colors">
              {match.home}
            </span>
          </div>

          {/* Match Info Central HUD */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            <div className="text-xs font-semibold text-zinc-400 tracking-wider">
              {isRescheduled && rescheduleInfo && rescheduleInfo.newTime ? rescheduleInfo.newTime : match.time}
            </div>
            <div className="h-px w-8 bg-zinc-700 my-1" />
            <div className={`text-xs font-open ${isRescheduled ? 'text-amber-500 font-bold' : 'text-zinc-500'}`}>
              {isRescheduled && rescheduleInfo ? rescheduleInfo.newDate : match.date}
            </div>
            {isRescheduled && rescheduleInfo && (
              <div className="text-[9px] text-zinc-500 line-through mt-0.5">
                {rescheduleInfo.oldDate}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex-1 text-left">
            <span className="text-white font-bold tracking-tight text-lg group-hover:text-emerald-400 transition-colors">
              {match.away}
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-zinc-500 font-open relative z-10">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{match.stadium}</span>
        </div>
      </div>
    </motion.div>
    );
  };

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
      // Check by source or name
      const isCurrentLeague = 
        entry.name === schedule.league || 
        entry.name === LEAGUE_NAMES[leagueId] ||
        entry.source === leagueId ||
        entry.source === LEAGUE_NAMES[leagueId];

      if (isCurrentLeague) return; 

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
      const { data } = await axios.post('/api/fixtures/generate', {
        league: leagueId,
        teamNames: schedule.teams,
      });
      navigate(location.pathname, { state: { schedule: data, leagueId }, replace: true });
    } catch (err) {
      console.error('Regeneration failed:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSaveToHistory = async () => {
    try {
      await axios.post('/api/tournaments/save', {
        type: leagueId === 'ucl' ? 'ucl' : 'league',
        name: LEAGUE_NAMES[leagueId] || 'League',
        status: 'active',
        bracket: schedule,
      });
      alert('Fixtures synced to tactical database!');
    } catch (err) {
      console.error('Save failed:', err);
      // Fallback to local storage
      saveToHistory({
        name: LEAGUE_NAMES[leagueId] || 'League',
        format: 'league',
        seed: 0,
        teams: schedule.teams,
        fixtures: schedule.fixtures,
        source: LEAGUE_NAMES[leagueId]
      });
      alert('Synced to local buffer (offline mode).');
    }
  };

  const handleMatchClick = useCallback(async (match: FixtureMatch) => {
    setSelectedFixture(match.id);
    setStatsPanelOpen(true);
    try {
      const { data } = await axios.post('/api/fixtures/predict', {
        homeTeam: match.home,
        awayTeam: match.away,
        isDerby: match.is_derby,
      });
      setPrediction(data);
    } catch (err) {
      console.error('Prediction failed:', err);
    }
  }, []);

  const handleOptimizeSquad = useCallback(async () => {
    if (!schedule || leagueId !== 'pl') return;
    setOptimizing(true);
    try {
      const mwFixtures = matchweekFixtures.map(f => ({ home: f.home, away: f.away }));
      const { data } = await axios.post('/api/fpl/optimize-matchweek', {
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
      <div className="flex-1 flex flex-col items-center justify-center bg-black text-zinc-500 min-h-screen">
        <p className="text-lg font-open">No fixture data available.</p>
        <button onClick={() => navigate('/fixtures')} className="mt-4 text-emerald-600 font-semibold hover:underline">Back to Competitions</button>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden flex flex-col font-open">
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-5 bg-[url('/noise.svg')]" />

      {/* Header Bar */}
      <header className="relative z-20 px-8 py-6 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-zinc-800 bg-black/40">
        <div className="flex items-center gap-6 mb-4 md:mb-0">
          <button 
            onClick={() => navigate('/fixtures')}
            className="p-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Shield className="w-6 h-6" style={{ color: colors.primary }} />
              <h1 className="text-2xl font-merriweather font-bold text-white tracking-wide">
                {LEAGUE_NAMES[leagueId] || 'LEAGUE FIXTURES'}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-emerald-500" />
                {schedule.telemetry?.total_rounds || [...new Set(schedule.fixtures.map(f => f.matchweek))].length} Rounds
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {leagueId === 'pl' && (
            <>
              <button 
                onClick={handleFASync}
                disabled={syncing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                Sync FA Cup
              </button>
              <button 
                onClick={() => {
                  setLogDrawerOpen(true);
                  axios.get('/api/fixtures/rescheduling-log').then(res => setAuditLogs(res.data)).catch(console.error);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-600/30 text-amber-500 hover:bg-amber-600/10 text-xs font-semibold transition-all"
              >
                <FileText className="w-4 h-4" />
                Reschedule Log
              </button>
            </>
          )}

          <button 
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </button>
          <button 
            onClick={handleSaveToHistory}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-all"
          >
            <Save className="w-4 h-4" />
            Commit Data
          </button>
          
          {leagueId === 'ucl' && (
            <button 
              onClick={() => navigate('/fixtures/ucl-bracket', { state: { leagueId: 'ucl' } })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all"
            >
              <Zap className="w-4 h-4" />
              Knockouts
            </button>
          )}
        </div>
      </header>

      {/* Control Center */}
      <div className="relative z-20 px-8 py-6 bg-black/20 border-b border-zinc-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-black/60 p-1 rounded-lg border border-zinc-800">
            <button 
              onClick={() => setViewMode('matchweek')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'matchweek' 
                ? 'bg-zinc-700 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-white'
              }`}
            >
              Timeline View
            </button>
            <button 
              onClick={() => setViewMode('team')}
              className={`px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'team' 
                ? 'bg-zinc-700 text-white shadow-sm' 
                : 'text-zinc-400 hover:text-white'
              }`}
            >
              Team Schedule
            </button>
          </div>

          <div className="flex items-center gap-6">
            {viewMode === 'matchweek' ? (
              <div className="flex items-center gap-4 bg-black/60 rounded-lg px-4 py-1.5 border border-zinc-800">
                <button 
                  onClick={() => setCurrentMW(Math.max(1, currentMW - 1))}
                  className="p-1 hover:text-emerald-400 text-zinc-400 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex flex-col items-center min-w-[100px]">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Matchweek</span>
                  <span className="text-xl font-merriweather font-bold text-white leading-none mt-1">{currentMW}</span>
                </div>
                <button 
                  onClick={() => setCurrentMW(Math.min(schedule.totalMatchweeks, currentMW + 1))}
                  className="p-1 hover:text-emerald-400 text-zinc-400 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-zinc-500" />
                <select 
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="bg-black border border-zinc-700 rounded-lg px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:border-emerald-500 min-w-[200px]"
                >
                  <option value="all">Select Team</option>
                  {schedule.teams.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}

            {leagueId === 'pl' && (
              <button 
                onClick={handleOptimizeSquad}
                disabled={optimizing}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600/10 border border-emerald-600/30 text-xs font-bold text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${optimizing ? 'animate-spin' : ''}`} />
                Optimize Squad
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 relative z-20 px-8 py-8 overflow-y-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'matchweek' ? (
            <motion.div
              key="matchweek"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {matchweekFixtures.map((match, i) => (
                  <MatchCard 
                    key={match.id} 
                    match={match} 
                    index={i} 
                    colors={colors} 
                    onClick={() => handleMatchClick(match)}
                    reschedulingSummary={reschedulingSummary}
                  />
                ))}
              </div>

              {matchweekFixtures.length === 0 && (
                <div className="text-center py-20 bg-black/30 rounded-2xl border border-dashed border-zinc-700">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 font-semibold text-sm">Scanning for fixtures...</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="max-w-3xl mx-auto"
            >
              {selectedTeam === 'all' ? (
                <div className="text-center py-32 bg-black/30 rounded-2xl border border-dashed border-zinc-700">
                  <Filter className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400 font-semibold text-sm">Select a team to view their schedule</p>
                </div>
              ) : (
                <div className="space-y-4 relative pl-8 border-l border-zinc-800">
                  <div className="absolute top-0 -left-1.5 w-3 h-3 rounded-full bg-emerald-500" />
                  
                  {teamFixturesTimeline.map((match, i) => (
                    <motion.div 
                      key={match.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative"
                    >
                      {/* Timeline Node */}
                      <div 
                        className="absolute -left-[39px] top-1/2 -tranzinc-y-1/2 w-3 h-3 rounded-full border-2 border-void z-10" 
                        style={{ 
                          backgroundColor: match.tournament.includes('Champions') ? '#10b981' : 
                                          match.tournament.includes('Premier') ? '#A020F0' : 
                                          match.tournament.includes('FA Cup') ? '#7B0000' : '#52525b' 
                        }} 
                      />
                      
                      <div 
                        onClick={() => handleMatchClick(match)}
                        className="p-5 rounded-xl bg-black/50 border border-zinc-800 hover:bg-zinc-800 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 uppercase tracking-wider">
                              {match.tournament}
                            </span>
                            {match.matchweek && <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Matchweek {match.matchweek}</span>}
                          </div>
                          <span className="text-[11px] font-semibold text-zinc-500">{formatDate(match.date)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-base font-bold ${match.home === selectedTeam ? 'text-white' : 'text-zinc-400'}`}>{match.home}</span>
                          <div className="flex items-center gap-4 mx-4">
                            <div className="w-8 h-[1px] bg-zinc-700" />
                            <span className="text-[10px] font-bold text-zinc-600 group-hover:text-emerald-500 transition-colors">VS</span>
                            <div className="w-8 h-[1px] bg-zinc-700" />
                          </div>
                          <span className={`text-base font-bold ${match.away === selectedTeam ? 'text-white' : 'text-zinc-400'}`}>{match.away}</span>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500 font-semibold">
                          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {match.time}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {match.stadium}</span>
                          {match.is_derby && <span className="text-amber-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Rivalry Match</span>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="absolute bottom-0 -left-1 w-2 h-2 rounded-full bg-zinc-700" />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reschedule Suggestions Overlay */}
        <AnimatePresence>
          {selectedFixture && modifySuggestions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-8 max-w-2xl mx-auto"
            >
              <div className="p-6 rounded-xl border border-zinc-700 bg-zinc-800">
                <div className="flex items-center gap-2 mb-6">
                  <div className="p-1.5 rounded-md bg-zinc-700 text-emerald-400">
                    <Settings2 className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white">Reschedule Optimization</h3>
                  <button 
                    onClick={() => { setSelectedFixture(null); setModifySuggestions(null); }} 
                    className="ml-auto text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
                
                {loadingModify ? (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
                    <p className="text-xs text-zinc-400 font-semibold">Analyzing alternative timelines...</p>
                  </div>
                ) : modifySuggestions.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-4 text-center">No stable alternatives identified.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modifySuggestions.map((alt, i) => (
                      <div 
                        key={i} 
                        className="p-4 rounded-lg border border-zinc-700 bg-black/50 hover:border-emerald-500/50 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold text-zinc-300">{alt.reason}</p>
                          {alt.swapWith && (
                            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">SWAP</span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 font-semibold">New Date: {formatDate(alt.date)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Stats Panel Overlay */}
      <StatsPanel
        prediction={prediction}
        isOpen={statsPanelOpen}
        onClose={() => { setStatsPanelOpen(false); setPrediction(null); }}
        leagueColor={colors.primary}
      />

      {/* Rescheduling Log Drawer */}
      <AnimatePresence>
        {logDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLogDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-zinc-800 z-50 p-6 overflow-y-auto flex flex-col font-open shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">Rescheduling Log</h2>
                  <p className="text-xs text-zinc-500 font-semibold">Audit trail of FA Cup conflicts & moves</p>
                </div>
                <button onClick={() => setLogDrawerOpen(false)} className="p-2 text-zinc-400 hover:text-white bg-zinc-900 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {auditLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 opacity-60">
                  <Clock className="w-12 h-12 mb-4" />
                  <p className="text-sm font-semibold">No rescheduling actions logged yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold px-2 py-1 bg-zinc-800 text-zinc-300 rounded uppercase tracking-wider">
                          {log.action}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-semibold">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{log.team} vs {log.opponent}</h4>
                      <p className="text-xs text-zinc-400 font-medium mb-3">Reason: <span className="text-amber-500">{log.reason}</span></p>
                      
                      <div className="flex items-center gap-3 text-xs bg-black/40 p-3 rounded-lg border border-zinc-800">
                        <div className="flex-1 text-zinc-500 line-through">
                          MW{log.old_matchweek} • {log.old_date}
                        </div>
                        <ArrowLeft className="w-4 h-4 text-zinc-600 rotate-180" />
                        <div className="flex-1 text-emerald-400 font-bold">
                          {log.new_matchweek ? `MW${log.new_matchweek}` : 'End Season'} • {log.new_date}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FixtureDisplay;


