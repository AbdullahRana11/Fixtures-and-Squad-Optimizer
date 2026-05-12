// ============================================================
// FixtureDisplay.tsx  —  REPLACE frontend/src/screens/FixtureDisplay.tsx
// New vs previous:
//   • Calendar view tab (fixtures on monthly grid using date field)
//   • Export as CSV download
//   • Derby badge (🔥) when biggest_rival matches
//   • Rescheduling log drawer (polls GET /api/fixtures/rescheduling-log)
//   • Fixture card flip animation (stats on back)
//   • Transfer diff view (before/after round advance)
// ============================================================
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { League } from '../data/mockData';
import { useAppStore } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';
import { THEMES } from '../utils/themeConfig';
import {
  ChevronDown, RefreshCw, Save, Shuffle, TrendingUp,
  Loader, Download, Calendar, List, Clock, AlertTriangle, Tv, Settings,
  Brain, Zap, Users, Filter, X,
} from 'lucide-react';
import {
  predictMatch, saveTournament, advanceFACupRound,
  advanceUCLRound, getReschedulingLog,
  generateFixtures, generateUCLSwiss,
  PredictMatchResponse, ReschedulingLog,
} from '../api/api';
import { ConstraintHUDPanel } from '../components/ConstraintHUDPanel';
import { TVScheduleView } from '../components/TVScheduleView';
import { BracketView3D } from '../components/BracketView3D';
import { SimulationOverlay } from '../components/SimulationOverlay';
import { SimulationResultsPanel } from '../components/SimulationResultsPanel';
import { GenerationLoadingOverlay } from '../components/GenerationLoadingOverlay';
import { exportICS, ICalFixture } from '../utils/icalExport';

interface FixtureDisplayProps {
  league?: League;
  onBack: () => void;
}

type ViewMode = 'list' | 'calendar' | 'tv' | 'bracket';

export const FixtureDisplay: React.FC<FixtureDisplayProps> = ({ league, onBack }) => {
  const {
    generatedFixtures, selectedLeague,
    setGeneratedFixtures, setCurrentTournamentId, currentTournamentId,
    isGeneratingFixtures, selectedTeams, setIsGeneratingFixtures,
    constraintProfile, backendTeams, addDebugLog,
    simulationResult,
  } = useAppStore();

  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const themeData = THEMES[theme];

  const [
    expandedId, setExpandedId,
  ] = useState<string | null>(null);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [round, setRound] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [predictions, setPredictions] = useState<Record<string, PredictMatchResponse>>({});
  const [loadingPred, setLoadingPred] = useState<string | null>(null);
  const [savingTournament, setSavingTournament] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [advancingRound, setAdvancingRound] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [reschedLog, setReschedLog] = useState<ReschedulingLog[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [hudOpen, setHudOpen] = useState(false);
  const [simFixture, setSimFixture] = useState<any | null>(null);
  const [showSimResults, setShowSimResults] = useState(false);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);

  // Auto-open results when simulation completes
  React.useEffect(() => {
    if (simulationResult) {
      setShowSimResults(true);
    }
  }, [simulationResult]);

  const bracket = generatedFixtures?.bracket || (generatedFixtures?.rounds ? generatedFixtures : null);
  const matches: any[] = generatedFixtures?.matches ||
                         generatedFixtures?.fixtures ||
                         (bracket?.rounds ? bracket.rounds.flatMap((r: any) => r.matches) : []);

  const allRounds = [...new Set(matches.map((m: any) => m.round || m.matchday || m.matchweek || 1))].sort((a: any, b: any) => {
    // Handle named rounds (FA Cup, UCL Knockout)
    const order = ['Third Round Proper', 'Fourth Round Proper', 'Fifth Round Proper', 'Quarter-Finals', 'Semi-Finals', 'Final',
                   'Play-offs', 'Round of 16', 'R3', 'R4', 'R5', 'QF', 'SF', 'F'];
    const aIdx = order.indexOf(String(a));
    const bIdx = order.indexOf(String(b));
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    return (Number(a) || 0) - (Number(b) || 0);
  });

  // Set initial round when fixtures are loaded (for knockout formats with named rounds)
  React.useEffect(() => {
    if (allRounds.length > 0 && !allRounds.includes(round)) {
      setRound(allRounds[0] as any);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedFixtures]);

  const roundMatches = matches.filter((m: any) => (m.round || m.matchday || m.matchweek || 1) === round);

  // All unique team names for filter chips
  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    matches.forEach((m: any) => { if (m.home) teams.add(m.home); if (m.away) teams.add(m.away); });
    return Array.from(teams).sort();
  }, [matches]);

  // Apply team filter on top of round filter
  const filteredRoundMatches = useMemo(() => {
    const base = allRounds.length > 0 ? roundMatches : matches;
    if (!teamFilter) return base;
    return base.filter((m: any) => m.home === teamFilter || m.away === teamFilter);
  }, [roundMatches, matches, teamFilter, allRounds]);

  // Navigate to Squad Optimizer with this fixture's context
  const handleOptimizeSquad = () => {
    const fixtureList = filteredRoundMatches.map((m: any) => ({ home: m.home, away: m.away }));
    useAppStore.getState().setAppMode('squad-optimizer');
    // Store fixture context so Squad Optimizer can pre-load it
    setTimeout(async () => {
      const { useFplStore } = await import('../store/fplStore');
      useFplStore.getState().setFixtureContext(
        Object.fromEntries(fixtureList.flatMap((f: any) => [[f.home, f.away], [f.away, f.home]]))
      );
    }, 100);
  };

  const exportCSV = useCallback(() => {
    const rows = [['Round', 'Home', 'Away', 'Date', 'Predicted Winner']];
    matches.forEach((m: any) => {
      rows.push([m.round || '', m.home || '', m.away || '', m.date || '', m.predicted_winner || '']);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${league?.name?.replace(/\s/g, '_') || 'fixtures'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playSuccess();
  }, [matches, league]);

  // ── Export iCal ───────────────────────────────────────────
  const exportICSFile = useCallback(() => {
    const icsFixtures: ICalFixture[] = matches
      .filter((m: any) => m.date && m.time)
      .map((m: any) => ({
        id: m.id || `${m.home}-${m.away}-${m.round}`,
        home: m.home, away: m.away,
        date: m.date, time: m.time,
        stadium: m.stadium,
        matchweek: m.round || m.matchday || m.matchweek || 1,
      }));
    exportICS(icsFixtures, league?.name || 'Season');
    soundManager.playSuccess();
  }, [matches, league]);


  // ── Predict ────────────────────────────────────────────────
  const handlePredict = async (match: any) => {
    const key = match.id || `${match.home}-${match.away}`;
    setLoadingPred(key);
    try {
      const res = await predictMatch({ homeTeam: match.home, awayTeam: match.away, homeLeague: league?.name, awayLeague: league?.name });
      setPredictions((p) => ({ ...p, [key]: res }));
    } catch {} finally { setLoadingPred(null); }
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    setSavingTournament(true);
    try {
      const saved = await saveTournament({
        id: currentTournamentId || undefined,
        type: selectedLeague || 'custom',
        name: league?.name || 'Tournament',
        status: 'active',
        bracket: generatedFixtures,
      });
      setCurrentTournamentId(saved.id);
      setSavedMsg(`✓ Saved "${saved.name}"`);
      addDebugLog(`Tournament saved successfully: ${saved.name} (ID: ${saved.id})`, 'info');
      setTimeout(() => setSavedMsg(null), 3000);
    } catch (err: any) {
      setSavedMsg(`✗ ${err.message}`);
      addDebugLog(`Failed to save tournament: ${err.message}`, 'error');
      setTimeout(() => setSavedMsg(null), 4000);
    } finally { setSavingTournament(false); }
  };

  // ── Advance Round ──────────────────────────────────────────
  const handleAdvance = async () => {
    if (!bracket) return;
    addDebugLog(`Advancing round: Current Round ${round}`, 'info');
    setAdvancingRound(true);
    const winners = roundMatches.map((m: any) => m.predicted_winner || m.home);
    try {
      const updated = selectedLeague === 'facup'
        ? await advanceFACupRound({ bracket, winners })
        : await advanceUCLRound({ bracket, winners, roundIndex: round - 1 });
      setGeneratedFixtures({ ...generatedFixtures, bracket: updated });
      setRound((r) => r + 1);
      addDebugLog(`Round advanced to ${round + 1} successfully.`, 'info');
    } catch (err: any) {
      addDebugLog(`Failed to advance round: ${err.message}`, 'error');
    } finally { setAdvancingRound(false); }
  };

  // ── Rescheduling log ───────────────────────────────────────
  const handleOpenLog = async () => {
    setShowLog(true);
    if (reschedLog.length > 0) return;
    setLoadingLog(true);
    try {
      const logs = await getReschedulingLog();
      setReschedLog(logs);
    } catch {} finally { setLoadingLog(false); }
  };
  
  // ── Regenerate ─────────────────────────────────────────────
  const handleRegenerate = async () => {
    setIsGeneratingFixtures(true);
    addDebugLog(`Regeneration initiated for league: ${selectedLeague || 'custom'}`, 'info');
    soundManager.playWarp();
    try {
      let data;
      if (selectedLeague === 'ucl-swiss') {
        addDebugLog(`Calling UCL Swiss Engine with ${backendTeams.length} teams...`, 'info');
        data = await generateUCLSwiss({ constraintProfile });
      } else {
        // ✅ Robust fallback: if selectedTeams is empty (e.g., after page refresh),
        // extract team names from the already-generated fixtures
        let teamsToUse = selectedTeams;
        if (!teamsToUse || teamsToUse.length < 2) {
          const extractedTeams = new Set<string>();
          matches.forEach((m: any) => {
            if (m.home) extractedTeams.add(m.home);
            if (m.away) extractedTeams.add(m.away);
          });
          teamsToUse = Array.from(extractedTeams);
          if (teamsToUse.length >= 2) {
            addDebugLog(`selectedTeams empty — extracted ${teamsToUse.length} teams from existing fixtures`, 'info');
            // Persist for future use
            useAppStore.getState().setSelectedTeams(teamsToUse);
          }
        }

        if (!teamsToUse || teamsToUse.length < 2) {
          addDebugLog('Not enough teams to regenerate (need at least 2)', 'error');
          soundManager.playError();
          setIsGeneratingFixtures(false);
          return;
        }

        addDebugLog(`Regenerating with ${teamsToUse.length} teams for league: ${selectedLeague || 'custom'}`, 'info');
        data = await generateFixtures({
          league: selectedLeague || 'custom',
          teamNames: teamsToUse,
          constraintProfile,
        });
      }
      setGeneratedFixtures(data);
      addDebugLog(`Regeneration complete. Generated ${data.matches?.length || data.fixtures?.length || 0} fixtures.`, 'info');
      soundManager.playSuccess();
    } catch (err: any) {
      console.error('Regeneration failed:', err);
      addDebugLog(`Regeneration failed: ${err.message}`, 'error');
      soundManager.playError();
    } finally {
      setIsGeneratingFixtures(false);
    }
  };

  const handleThemeChange = () => {
    const themes = ['mint-cyan', 'purple-rose', 'gold-cyan', 'mint-purple'] as const;
    const i = themes.indexOf(theme as any);
    setTheme(themes[(i + 1) % themes.length]);
    soundManager.playHover();
  };

  if (!generatedFixtures) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="font-mono text-gray-500 text-xs uppercase">No fixture data</p>
      </div>
    );
  }

  // Calendar view — group matches by date
  const byDate: Record<string, any[]> = {};
  matches.forEach((m: any) => {
    const d = m.date || `Round ${m.round || 1}`;
    if (!byDate[d]) byDate[d] = [];
    byDate[d].push(m);
  });

  return (
    <div className="w-full h-full bg-transparent flex flex-col overflow-hidden relative">
      {/* Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(circle at 50% 0%, ${themeData.glow.replace('0.5','0.08')} 0%, transparent 55%)` }}
        transition={{ duration: 0.8 }}
      />

      {/* Header */}
      <motion.div
        className="sticky top-0 z-30 px-8 py-5 border-b border-white/5 tactical-glass backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Animated Gradient Border Bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
          <motion.div 
            className="h-full w-full bg-gradient-to-r from-transparent via-primary/50 to-transparent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          />
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center tactical-glass border border-white/10"
              style={{ color: themeData.primary }}
            >
              {league?.icon || (league?.sport === 'cricket' ? '🏏' : '⚽')}
            </div>
            <div>
              <h1 className="text-2xl font-display font-black tracking-wider" style={{ color: themeData.primary }}>
                {league?.name || 'Fixtures'}
              </h1>
              <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
                {generatedFixtures?.type?.toUpperCase() || 'GENERATED'} · {matches.length} MATCHES · {allRounds.length} ROUNDS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View mode toggle */}
            <div className="flex p-1 tactical-glass rounded-lg border border-white/10 gap-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded transition-all ${viewMode === 'list' ? 'bg-primary text-void' : 'text-gray-500'}`}
                title="List view"
              ><List size={14} /></button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded transition-all ${viewMode === 'calendar' ? 'bg-primary text-void' : 'text-gray-500'}`}
                title="Calendar view"
              ><Calendar size={14} /></button>
              <button
                onClick={() => setViewMode('tv')}
                className={`p-1.5 rounded transition-all ${viewMode === 'tv' ? 'bg-primary text-void' : 'text-gray-500'}`}
                title="TV Schedule view"
              ><Tv size={14} /></button>
              {bracket && (
                <button
                  onClick={() => setViewMode('bracket')}
                  className={`p-1.5 rounded transition-all ${viewMode === 'bracket' ? 'bg-primary text-void' : 'text-gray-500'}`}
                  title="Bracket view"
                >
                  <TrendingUp size={14} />
                </button>
              )}
            </div>

            <ActionBtn onClick={exportCSV} icon={<Download size={13} />} label="CSV" />
            <ActionBtn onClick={exportICSFile} icon={<Calendar size={13} />} label="iCal" />
            <ActionBtn onClick={handleOpenLog} icon={<Clock size={13} />} label="Log" />
            <ActionBtn
              onClick={() => setHudOpen(true)}
              icon={<Settings size={13} />}
              label="Constraints"
            />
            <ActionBtn
              onClick={handleRegenerate}
              icon={<Shuffle size={13} />}
              label="Regenerate"
              disabled={isGeneratingFixtures}
            />
            {bracket && <ActionBtn onClick={handleAdvance} icon={advancingRound ? <Loader size={13} className="animate-spin" /> : <Shuffle size={13} />} label="Next Round" disabled={advancingRound} />}
            <ActionBtn onClick={handleSave} icon={savingTournament ? <Loader size={13} className="animate-spin" /> : <Save size={13} />} label="Save" disabled={savingTournament} />
            <motion.button
              onClick={handleOptimizeSquad}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg font-mono text-[10px] font-bold uppercase border border-emerald-500/50 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Optimize squad for this matchweek"
            >
              <Users size={13} /> Optimize Squad
            </motion.button>

            <button
              onClick={handleThemeChange}
              className="p-2 tactical-glass border border-white/10 rounded-lg hover:border-white/30 transition-all"
            >
              <RefreshCw size={14} className="text-primary" />
            </button>
          </div>
        </div>

        {/* Save feedback */}
        <AnimatePresence>
          {savedMsg && (
            <motion.p className="mt-1.5 font-mono text-[10px] text-green-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {savedMsg}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Round tabs — list mode only */}
      {viewMode === 'list' && allRounds.length > 0 && (
        <div className="relative z-10 px-8 py-3 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {allRounds.map((r) => (
            <motion.button
              key={r}
              onClick={() => { setRound(r); soundManager.playClick(); }}
              className={`px-4 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase whitespace-nowrap transition-all ${
                round === r ? 'bg-primary text-void' : 'tactical-glass border border-white/10 text-gray-400 hover:border-white/25'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Round {r}
            </motion.button>
          ))}
        </div>
      )}

      {/* Team filter chips — list mode only */}
      {viewMode === 'list' && allTeams.length > 0 && (
        <div className="relative z-10 px-8 py-2 border-b border-white/5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Filter size={11} className="text-gray-600 shrink-0" />
          <motion.button
            onClick={() => setTeamFilter(null)}
            className={`px-3 py-1 rounded-md font-mono text-[9px] font-bold uppercase whitespace-nowrap transition-all ${
              !teamFilter ? 'bg-primary/20 border border-primary/50 text-primary' : 'tactical-glass border border-white/5 text-gray-600 hover:border-white/20'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            All
          </motion.button>
          {allTeams.map((t) => (
            <motion.button
              key={t}
              onClick={() => setTeamFilter(teamFilter === t ? null : t)}
              className={`px-3 py-1 rounded-md font-mono text-[9px] font-bold uppercase whitespace-nowrap transition-all ${
                teamFilter === t ? 'bg-primary/20 border border-primary/50 text-primary' : 'tactical-glass border border-white/5 text-gray-600 hover:border-white/20'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {t}
            </motion.button>
          ))}
          {teamFilter && (
            <button onClick={() => setTeamFilter(null)} className="ml-auto shrink-0 text-gray-600 hover:text-white transition-all">
              <X size={12} />
            </button>
          )}
        </div>
      )}

      {/* ── Main content ── */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 p-8">
            <AnimatePresence>
              {filteredRoundMatches.map((match: any, idx: number) => {
                const matchId = match.id || `${match.home}-${match.away}-${idx}`;
                const pred = predictions[matchId];
                const isLoadingThis = loadingPred === matchId;
                const isExpanded = expandedId === matchId;

                return (
                  <motion.div
                    key={matchId}
                    layout
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <FixtureCard
                      match={match}
                      matchId={matchId}
                      isExpanded={isExpanded}
                      prediction={pred}
                      isLoadingPred={isLoadingThis}
                      themeData={themeData}
                      sportIcon={league?.icon || (league?.sport === 'cricket' ? '🏏' : '⚽')}
                      league={league}
                      onToggle={() => {
                        soundManager.playClick();
                        setExpandedId(isExpanded ? null : matchId);
                        if (!isExpanded && !pred) handlePredict(match);
                      }}
                      onSimulate={(m: any) => setSimFixture(m)}
                      backendTeams={backendTeams}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : viewMode === 'tv' ? (
          /* TV Schedule View */
          <div className="p-8">
            <TVScheduleView
              fixtures={matches.map((m: any, i: number) => ({
                id: m.id || `${m.home}-${m.away}-${i}`,
                home: m.home, away: m.away,
                date: m.date || '', time: m.time || '15:00',
                round: m.round || m.matchday || 1,
                matchweek: m.round || m.matchday || 1,
                broadcaster: m.broadcaster,
                is_derby: m.is_derby,
                matchIntensity: m.matchIntensity,
              }))}
              leagueName={league?.name || 'Season'}
            />
          </div>
        ) : viewMode === 'bracket' ? (
          /* Bracket View */
          <div className="p-4 h-full">
            <BracketView3D 
              bracket={bracket} 
              themeColor={themeData.primary} 
            />
          </div>
        ) : (
          /* Calendar View */
          <div className="p-8 space-y-6">
            {Object.entries(byDate).map(([date, dayMatches]) => (
              <motion.div key={date} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="px-3 py-1 rounded-lg bg-primary/10 border border-primary/20 font-mono text-[10px] uppercase text-primary">
                    {date}
                  </div>
                  <div className="h-px flex-1 bg-white/5" />
                  <span className="font-mono text-[9px] text-gray-600">{dayMatches.length} matches</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                  {dayMatches.map((m: any, i: number) => (
                    <CalendarMatchCard key={i} match={m} themeData={themeData} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Simulation Overlay ── */}
      {simFixture && (
        <SimulationOverlay
          isVisible={!!simFixture}
          fixture={simFixture}
          onClose={() => setSimFixture(null)}
        />
      )}

      {/* ── Simulation Results Panel ── */}
      <SimulationResultsPanel
        isOpen={showSimResults}
        onClose={() => setShowSimResults(false)}
      />

      {/* ── Rescheduling log drawer ── */}
      <AnimatePresence>
        {showLog && (
          <motion.div
            className="absolute inset-y-0 right-0 w-80 z-30 tactical-glass border-l border-white/10 flex flex-col"
            initial={{ x: 320 }}
            animate={{ x: 0 }}
            exit={{ x: 320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-primary" />
                <span className="font-mono text-xs uppercase font-bold">Rescheduling Log</span>
              </div>
              <button onClick={() => setShowLog(false)} className="text-gray-500 hover:text-white transition-all text-xs">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-3">
              {loadingLog && <div className="flex items-center gap-2"><Loader size={12} className="animate-spin text-primary" /><span className="font-mono text-[10px] text-gray-500">Loading…</span></div>}
              {!loadingLog && reschedLog.length === 0 && (
                <p className="font-mono text-[10px] text-gray-600 text-center py-8">No rescheduling events</p>
              )}
              {reschedLog.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-white/3 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <AlertTriangle size={10} className="text-yellow-500" />
                    <span className="font-mono text-[9px] text-yellow-500 uppercase">{log.change_type}</span>
                  </div>
                  <p className="font-mono text-[10px] text-gray-400">{log.description}</p>
                  <p className="font-mono text-[9px] text-gray-600 mt-1">{new Date(log.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Constraint HUD Panel ── */}
      <ConstraintHUDPanel
        isOpen={hudOpen}
        onClose={() => setHudOpen(false)}
        teams={matches
          .flatMap((m: any) => [m.home, m.away])
          .filter((v, i, a) => a.indexOf(v) === i)
        }
        totalMatchweeks={allRounds.length || 38}
      />

      {/* ── Generation Loading Overlay ── */}
      <GenerationLoadingOverlay
        isVisible={isGeneratingFixtures}
        league={selectedLeague || undefined}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const ActionBtn = ({ onClick, icon, label, disabled }: any) => (
  <motion.button
    onClick={onClick}
    disabled={disabled}
    className="flex items-center gap-1.5 px-3 py-2 tactical-glass border border-white/10 rounded-lg font-mono text-[10px] font-bold uppercase hover:border-white/25 disabled:opacity-40 transition-all"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {icon} {label}
  </motion.button>
);

const RenderLogo = ({ logo, fallback }: { logo: string; fallback: string }) => {
  const isImage = logo?.startsWith('http') || logo?.startsWith('/') || logo?.includes('.') || logo?.startsWith('data:');
  if (isImage) {
    return <img src={logo} alt="logo" className="w-6 h-6 object-contain filter drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]" />;
  }
  return <div className="text-xl mb-1 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">{logo || fallback}</div>;
};

const FixtureCard = ({ match, matchId, isExpanded, prediction, isLoadingPred, themeData, sportIcon, league, onToggle, onSimulate, backendTeams }: any) => {
  const homeTeamData = backendTeams?.find((t: any) => t.name === match.home);
  const awayTeamData = backendTeams?.find((t: any) => t.name === match.away);
  
  const isCricket = league?.sport === 'cricket' || sportIcon === '🏏';
  
  const getLogo = (teamData: any) => {
    if (!teamData) return sportIcon || (isCricket ? '🏏' : '⚽');
    
    const rawLogo = teamData.logo;
    const isImage = rawLogo?.startsWith('http') || rawLogo?.startsWith('/') || rawLogo?.includes('.') || rawLogo?.startsWith('data:');
    
    if (isImage) return rawLogo;
    
    // Fallback logic for emoji/text logos
    if (isCricket) {
      // If it's a generic football icon or missing, use cricket
      if (rawLogo === '⚽' || !rawLogo) return '🏏';
      return rawLogo;
    } else {
      // Football fallback
      if (rawLogo === '🏏' || !rawLogo) return '⚽';
      return rawLogo;
    }
  };

  const homeLogo = getLogo(homeTeamData);
  const awayLogo = getLogo(awayTeamData);

  return (
  <motion.div
    className="relative overflow-hidden rounded-xl border tactical-glass cursor-pointer"
    onClick={onToggle}
    whileHover={{ scale: 1.01 }}
    style={{
      borderColor: isExpanded ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
      boxShadow: isExpanded ? '0 0 30px var(--glow-primary)' : 'none',
    }}
  >
    {/* Simulation trigger */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onSimulate(match);
      }}
      className="absolute top-2 right-8 p-1 rounded hover:bg-white/5 text-gray-600 hover:text-primary transition-all"
      title="Run Simulation"
    >
      <Shuffle size={12} />
    </button>
    {/* Derby indicator */}
    {match.isDerby && (
      <div className="absolute top-2 left-2 font-mono text-[9px] text-orange-400 flex items-center gap-1">
        🔥 DERBY
      </div>
    )}

    {/* Teams row */}
    <div className="p-5 flex items-center justify-between">
      <div className="flex-1 flex flex-col items-center">
        <RenderLogo logo={homeLogo} fallback={sportIcon} />
        <div className="font-bold uppercase text-xs tracking-wider mt-1">{match.home}</div>
        {match.date && <div className="font-mono text-[8px] text-gray-600 mt-0.5">{match.date}</div>}
      </div>
      <div className="px-3 py-1.5 mx-3 rounded-lg bg-white/5 border border-white/10 font-mono text-[10px] font-black text-gray-500">VS</div>
      <div className="flex-1 flex flex-col items-center">
        <RenderLogo logo={awayLogo} fallback={sportIcon} />
        <div className="font-bold uppercase text-xs tracking-wider mt-1">{match.away}</div>
      </div>
    </div>

    {/* Expanded prediction */}
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          className="px-5 pb-5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <div className="h-px bg-white/5 mb-4" />
          {isLoadingPred ? (
            <div className="flex items-center gap-2 justify-center py-2">
              <Loader size={12} className="animate-spin text-primary" />
              <span className="font-mono text-[9px] text-gray-500">Running AI predictor…</span>
            </div>
          ) : prediction ? (
            <div className="space-y-4">
              {/* Win Probabilities */}
              <div className="grid grid-cols-3 gap-2">
                <ProbBar label="Home Win" value={prediction.homeWin / 100} color="var(--primary)" />
                <ProbBar label="Draw" value={prediction.draw / 100} color="rgba(255,255,255,0.4)" />
                <ProbBar label="Away Win" value={prediction.awayWin / 100} color="var(--secondary)" />
              </div>

              {/* Advanced Metrics (xG, Possession, Clean Sheet) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Home Stats */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-400 font-bold uppercase">{match.home}</span>
                    <div className="flex gap-0.5">
                      {prediction.homeForm.map((res: number, i: number) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${res === 3 ? 'bg-green-500' : res === 1 ? 'bg-gray-500' : 'bg-red-500'}`} title={res === 3 ? 'W' : res === 1 ? 'D' : 'L'} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{prediction.homeXG.toFixed(1)}</div>
                      <div className="text-[7px] text-gray-500 uppercase">xG</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{prediction.homePossession}%</div>
                      <div className="text-[7px] text-gray-500 uppercase">Poss</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{prediction.homeCleanSheet}%</div>
                      <div className="text-[7px] text-gray-500 uppercase">CS</div>
                    </div>
                  </div>
                </div>

                {/* Away Stats */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-400 font-bold uppercase">{match.away}</span>
                    <div className="flex gap-0.5">
                      {prediction.awayForm.map((res: number, i: number) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${res === 3 ? 'bg-green-500' : res === 1 ? 'bg-gray-500' : 'bg-red-500'}`} title={res === 3 ? 'W' : res === 1 ? 'D' : 'L'} />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{prediction.awayXG.toFixed(1)}</div>
                      <div className="text-[7px] text-gray-500 uppercase">xG</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{prediction.awayPossession}%</div>
                      <div className="text-[7px] text-gray-500 uppercase">Poss</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold text-white">{prediction.awayCleanSheet}%</div>
                      <div className="text-[7px] text-gray-500 uppercase">CS</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Intensity and Broadcaster */}
              <div className="grid grid-cols-1">

                <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col justify-between">
                  <div className="font-mono text-[8px] text-gray-500 uppercase mb-1">Match Intensity</div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      prediction.matchIntensity === 'Extreme' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      prediction.matchIntensity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {prediction.matchIntensity}
                    </div>
                    <div className="font-mono text-[9px] text-gray-600">
                      {prediction.broadcasterSlot !== 'Standard Slot' ? prediction.broadcasterSlot : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Insight & Projected Score */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-all">
                  <Zap size={24} className="text-primary" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain size={12} className="text-primary" />
                    <span className="font-mono text-[9px] text-primary uppercase font-bold tracking-widest">Intelligence Insight</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-gray-300 italic">"{prediction.keyInsight}"</p>
                  
                  <div className="mt-3 flex items-center justify-between border-t border-primary/10 pt-3">
                    <div className="flex flex-col">
                      <span className="font-mono text-[8px] text-gray-600 uppercase">Projected Score</span>
                      <span className="text-sm font-black text-white tracking-tighter">{prediction.projectedScoreline.most_likely}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-mono text-[8px] text-gray-600 uppercase">Alternatives</span>
                      <div className="flex gap-1">
                        {prediction.projectedScoreline.alternatives.map((s: string) => (
                          <span key={s} className="font-mono text-[9px] text-gray-500">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 font-mono text-[10px] text-gray-500 hover:text-white transition-all"
            >
              <TrendingUp size={12} /> Run AI Prediction
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>

    <div className="absolute top-3 right-3 text-gray-600">
      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
        <ChevronDown size={14} />
      </motion.div>
    </div>
  </motion.div>
  );
};

const CalendarMatchCard = ({ match, themeData }: any) => (
  <div className="p-3 rounded-lg bg-white/3 border border-white/5 hover:border-white/10 transition-all">
    <div className="flex items-center justify-between">
      <span className="font-bold text-[11px] truncate flex-1">{match.home}</span>
      <span className="font-mono text-[9px] text-gray-600 mx-2">vs</span>
      <span className="font-bold text-[11px] truncate flex-1 text-right">{match.away}</span>
    </div>
    {match.predicted_winner && (
      <div className="mt-1.5 font-mono text-[9px] text-gray-500 flex items-center gap-1">
        <TrendingUp size={8} style={{ color: themeData.primary }} />
        <span style={{ color: themeData.primary }}>{match.predicted_winner}</span>
      </div>
    )}
  </div>
);

const ProbBar = ({ label, value, color }: any) => (
  <div className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-center">
    <div className="font-mono text-[8px] text-gray-600 mb-1 uppercase">{label}</div>
    <div className="font-bold text-sm" style={{ color }}>{(value * 100).toFixed(0)}%</div>
    <div className="mt-1.5 h-0.5 bg-white/5 rounded-full overflow-hidden">
      <motion.div className="h-full rounded-full" style={{ backgroundColor: color }} initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 0.8 }} />
    </div>
  </div>
);
