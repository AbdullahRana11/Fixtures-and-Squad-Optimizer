// ============================================================
// TeamSelector.tsx  —  REPLACE frontend/src/screens/TeamSelector.tsx
// New vs previous:
//   • Search/filter bar (handles 64-team FA Cup pool)
//   • Progress ring showing X/required selected
//   • Derby badge (🔥) from biggest_rival field
//   • Skeleton shimmer while loading
//   • Required count guard before allowing confirm
// ============================================================
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';
import { fetchTeams, BackendTeam } from '../api/api';
import { LEAGUES } from '../data/mockData';
import { Search, X, Settings } from 'lucide-react';
import { ConstraintHUDPanel } from '../components/ConstraintHUDPanel';
import { GenerationLoadingOverlay } from '../components/GenerationLoadingOverlay';
import { DebugLogPanel } from '../components/DebugLogPanel';

interface TeamSelectorProps {
  leagueId: string;
  onConfirm: (teamNames: string[]) => void;
}

// SVG progress ring
const ProgressRing: React.FC<{ value: number; max: number; color: string; size?: number }> = ({
  value, max, color, size = 56,
}) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={3} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 0.5 }}
      />
    </svg>
  );
};

// Skeleton card
const SkeletonCard = () => (
  <div className="w-28 h-28 rounded-xl bg-white/3 border border-white/5 animate-pulse" />
);

export const TeamSelector: React.FC<TeamSelectorProps> = ({ leagueId, onConfirm }) => {
  const {
    backendTeams, isLoadingTeams, fixtureError,
    setBackendTeams, setIsLoadingTeams, setFixtureError,
  } = useAppStore();

  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<'floating' | 'grid' | 'tier'>('floating');
  const [isHUDOpen, setIsHUDOpen] = useState(false);
  const [isDebugOpen, setIsDebugOpen] = useState(false);
  const [hoveredName, setHoveredName] = useState<string | null>(null);
  
  const addDebugLog = useAppStore(s => s.addDebugLog);
  const theme = useAppStore((s) => s.theme);
  const isGeneratingFixtures = useAppStore((s) => s.isGeneratingFixtures);
  const league = LEAGUES.find((l) => l.id === leagueId);

  // Required team count per league - used for "Recommended" or "Perfect" status
  const recommended = useMemo(() => {
    const REC: Record<string, number> = {
      psl: 6, ipl: 10, bbl: 8, cpl: 6, sa20: 6,
      'icc-t20wc': 20, 'icc-odi-wc': 10, custom: 10,
      // football
      pl: 20, laliga: 20, seriea: 20, bundesliga: 18,
      ligue1: 18, ucl: 36, 'ucl-knockout': 24, 'ucl-swiss': 36, facup: 64,
    };
    return REC[leagueId] || backendTeams.length;
  }, [leagueId, backendTeams.length]);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingTeams(true);
    setFixtureError(null);
    addDebugLog(`Fetching teams for league: ${leagueId}...`);
    fetchTeams(leagueId)
      .then((res) => { 
        if (!cancelled) {
          setBackendTeams(res.teams);
          addDebugLog(`Successfully loaded ${res.teams.length} teams.`);
        }
      })
      .catch((err: Error) => { 
        if (!cancelled) {
          setFixtureError(err.message);
          addDebugLog(`Failed to load teams: ${err.message}`, 'error');
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingTeams(false); });
    return () => { cancelled = true; };
  }, [leagueId]);

  const filtered = useMemo(() => {
    if (!search.trim()) return backendTeams;
    const q = search.toLowerCase();
    return backendTeams.filter((t) => t.name.toLowerCase().includes(q));
  }, [backendTeams, search]);

  const occupiedPots = useMemo(() => {
    return [...new Set(filtered.map(t => t.uefa_pot || 4))].sort((a, b) => a - b);
  }, [filtered]);

  const toggle = (name: string) => {
    soundManager.playClick();
    setSelectedNames((prev) => {
      const exists = prev.includes(name);
      if (exists) {
        addDebugLog(`Deselected team: ${name}`);
        return prev.filter((n) => n !== name);
      } else {
        addDebugLog(`Selected team: ${name}`);
        return [...prev, name];
      }
    });
  };

  const autoSelect = () => {
    soundManager.playSuccess();
    const shuffled = [...backendTeams].sort(() => 0.5 - Math.random());
    const selection = shuffled.slice(0, recommended).map((t) => t.name);
    setSelectedNames(selection);
    addDebugLog(`Auto-selected ${selection.length} teams based on recommendation.`);
  };

  const handleConfirm = () => {
    if (selectedNames.length >= 2) {
      soundManager.playTransition();
      // Ensure selectedTeams is updated in store before calling onConfirm if needed
      // But here we just call the prop
      onConfirm(selectedNames);
    }
  };

  const getPosition = (i: number, total: number, team: BackendTeam) => {
    if (mode !== 'floating') return { x: 0, y: 0 }; // We'll use CSS layout for other modes

    const angle = (i / total) * Math.PI * 2;
    const r = Math.min(650, 180 + total * 12);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  };

  // ── Loading ──────────────────────────────────────────────
  if (isLoadingTeams) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-6">
        <div className="flex flex-wrap gap-3 justify-center max-w-xl">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
              <SkeletonCard />
            </motion.div>
          ))}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-gray-500">
          Loading {league?.name} teams…
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────
  if (fixtureError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8">
        <div className="text-3xl">⚠️</div>
        <p className="font-mono text-sm text-red-400 text-center">{fixtureError}</p>
        <p className="font-mono text-[10px] text-gray-600 text-center">
          Make sure backend is running on{' '}
          <span className="text-primary">http://localhost:3001</span>
        </p>
      </div>
    );
  }

  const isCustom = leagueId === 'custom';
  const minRequired = 2;
  const targetRequired = recommended;
  const canConfirm = selectedNames.length >= minRequired;
  const isExact = selectedNames.length >= targetRequired;

  return (
    <div className="w-full h-full bg-transparent flex flex-col items-center justify-center overflow-hidden relative">

      {/* ── Header ── */}
      <motion.div
        className="absolute top-12 left-0 right-0 z-20 pointer-events-none text-center px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-display font-black tracking-wider mb-1" style={{ color: league?.color }}>
          {league?.name}
        </h1>
        <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
          {selectedNames.length} teams selected
          {selectedNames.length < minRequired && <span className="text-gray-600"> — {minRequired - selectedNames.length} more needed</span>}
          {selectedNames.length >= minRequired && selectedNames.length < targetRequired && <span className="text-emerald-500/60"> — Recommended: {targetRequired}</span>}
        </p>
      </motion.div>

      {/* ── Search bar + Tactical Button ── */}
      <motion.div
        className="absolute top-28 w-full flex justify-center z-20 pointer-events-auto"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="relative flex items-center w-[320px]">
          <div className="relative w-full">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search teams…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg font-mono text-xs text-white placeholder-gray-600 focus:outline-none focus:border-primary/40 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X size={12} />
              </button>
            )}
          </div>
          
          <button
            onClick={() => { setIsHUDOpen(true); soundManager.playClick(); }}
            className="absolute -right-12 p-2 tactical-glass border border-white/10 rounded-lg text-emerald-400 hover:border-emerald-400/40 transition-all"
            title="Tactical Constraints"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={() => { setIsDebugOpen(!isDebugOpen); soundManager.playClick(); }}
            className={`absolute -right-24 p-2 tactical-glass border border-white/10 rounded-lg transition-all ${isDebugOpen ? 'text-emerald-400 border-emerald-400/40' : 'text-zinc-500'}`}
            title="System Telemetry"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <div className={`w-1.5 h-1.5 rounded-full ${isDebugOpen ? 'bg-emerald-400' : 'bg-zinc-600'} animate-pulse`} />
            </div>
          </button>
        </div>
      </motion.div>

      <div 
        className="absolute inset-0 flex flex-col items-center overflow-y-auto no-scrollbar py-20 scroll-smooth" 
      >
        <div 
          className="relative w-full flex flex-col items-center py-20 px-4 min-h-full"
        >
          {/* Removed top-level AnimatePresence to prevent scroll-reset/layout-jumps on list updates */}
            {mode === 'tier' ? (
              <motion.div 
                key="tier-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-6xl flex flex-col gap-12"
              >
                {occupiedPots.map((pot) => {
                  const teamsInPot = filtered.filter(t => (t.uefa_pot || 4) === pot);
                  if (teamsInPot.length === 0) return null;

                  return (
                    <div
                      key={`tier-section-${mode}-${pot}`}
                      className="flex flex-col items-center relative"
                    >
                      {/* Modern tactical heading - Sticky with Enhanced Glassmorphism */}
                      <div className="sticky top-[-80px] z-30 w-full flex flex-col items-center py-6 mb-8 bg-void/60 backdrop-blur-2xl border-b border-white/5 transition-all shadow-2xl">
                        <div className="flex items-center gap-6">
                          <motion.div 
                            className="h-[1px] w-24 bg-gradient-to-r from-transparent via-primary/40 to-primary/60"
                            initial={{ width: 0 }}
                            animate={{ width: 96 }}
                          />
                          <div className="px-8 py-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex items-center gap-4 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative w-3 h-3">
                              <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-20" />
                              <div className="relative w-full h-full rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.6)]" />
                            </div>
                            <span className="font-display font-black text-xl tracking-[0.2em] text-white uppercase relative z-10">
                              Tier <span className="text-primary">{pot}</span>
                            </span>
                          </div>
                          <motion.div 
                            className="h-[1px] w-24 bg-gradient-to-l from-transparent via-primary/40 to-primary/60"
                            initial={{ width: 0 }}
                            animate={{ width: 96 }}
                          />
                        </div>
                        <div className="font-mono text-[8px] text-gray-500 uppercase tracking-[0.4em] mt-3 font-bold opacity-50">
                          Tactical Seed Group • Pool {pot}
                        </div>
                      </div>

                      {/* Teams Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 w-full justify-items-center px-4">
                        {teamsInPot.map((team) => (
                          <TeamCard 
                            key={`team-${mode}-${team.id}`}
                            team={team}
                            isSelected={selectedNames.includes(team.name)}
                            isHovered={hoveredName === team.name}
                            isDerby={!!(team.biggest_rival && selectedNames.includes(team.biggest_rival))}
                            leagueIcon={league?.icon || (league?.sport === 'cricket' ? '🏏' : '⚽')}
                            leagueColor={league?.color}
                            mode={mode}
                            onToggle={() => toggle(team.name)}
                            onHover={setHoveredName}
                            backendTeams={backendTeams}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : mode === 'grid' ? (
              <motion.div 
                key="grid-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 w-full max-w-7xl justify-items-center px-4 pb-20"
              >
                {filtered.map((team) => (
                  <TeamCard 
                    key={`team-${mode}-${team.id}`}
                    team={team}
                    isSelected={selectedNames.includes(team.name)}
                    isHovered={hoveredName === team.name}
                    isDerby={!!(team.biggest_rival && selectedNames.includes(team.biggest_rival))}
                    leagueIcon={league?.icon || (league?.sport === 'cricket' ? '🏏' : '⚽')}
                    leagueColor={league?.color}
                    mode={mode}
                    onToggle={() => toggle(team.name)}
                    onHover={setHoveredName}
                    backendTeams={backendTeams}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="orbit-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full h-[600px] flex items-center justify-center"
              >
                {filtered.map((team, i) => {
                  const pos = getPosition(i, filtered.length, team);
                  return (
                    <TeamCard 
                      key={`team-${mode}-${team.id}`}
                      team={team}
                      isSelected={selectedNames.includes(team.name)}
                      isHovered={hoveredName === team.name}
                      isDerby={!!(team.biggest_rival && selectedNames.includes(team.biggest_rival))}
                      leagueIcon={league?.icon || (league?.sport === 'cricket' ? '🏏' : '⚽')}
                      leagueColor={league?.color}
                      mode={mode}
                      absolutePos={pos}
                      onToggle={() => toggle(team.name)}
                      onHover={setHoveredName}
                      backendTeams={backendTeams}
                    />
                  );
                })}
              </motion.div>
            )}
        </div>
      </div>

      {/* ── Controls ── */}
      <motion.div
        className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Mode + actions row */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className="flex p-1 tactical-glass rounded-xl border border-white/10 gap-1">
            {(['floating', 'grid', 'tier'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { soundManager.playTransition(); setMode(m); }}
                className={`px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold uppercase transition-all ${
                  mode === m ? 'bg-primary text-void' : 'text-gray-500 hover:text-white'
                }`}
              >
                {m === 'floating' ? '◎ Orbit' : m === 'grid' ? '▦ Grid' : '▤ Tier'}
              </button>
            ))}
          </div>

          <button
            onClick={autoSelect}
            className="px-4 py-2 font-mono text-[10px] font-bold uppercase rounded-lg tactical-glass border border-white/10 text-cyan-400 hover:border-cyan-400/40 transition-all"
          >
            ⚡ Auto Select All
          </button>

          {selectedNames.length > 0 && (
            <button
              onClick={() => setSelectedNames([])}
              className="px-4 py-2 font-mono text-[10px] font-bold uppercase rounded-lg tactical-glass border border-white/10 text-red-400 hover:border-red-400/40 transition-all"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Progress ring + confirm */}
        <AnimatePresence>
          {canConfirm && (
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              {/* Ring */}
              <div className="relative">
                <ProgressRing
                  value={selectedNames.length}
                  max={recommended}
                  color={league?.color || '#00F260'}
                  size={52}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-mono text-[9px] font-bold" style={{ color: league?.color }}>
                    {selectedNames.length}
                  </span>
                </div>
              </div>

              <motion.button
                onClick={handleConfirm}
                className="px-10 py-4 bg-primary text-void font-display font-black tracking-widest uppercase rounded-2xl shadow-glow transition-all"
                whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(var(--primary-rgb), 0.6)' }}
                whileTap={{ scale: 0.95 }}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                Initialize Tactical Fixtures →
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      {/* ── Overlays ── */}
      <ConstraintHUDPanel 
        isOpen={isHUDOpen} 
        onClose={() => setIsHUDOpen(false)} 
        teams={backendTeams.map(t => t.name)}
        totalMatchweeks={['psl', 'ipl', 'bbl', 'cpl', 'sa20', 'icc-t20wc', 'icc-odi-wc'].includes(leagueId) ? 14 : leagueId === 'ucl-swiss' ? 8 : 38}
      />

      <GenerationLoadingOverlay isVisible={isGeneratingFixtures} league={league?.name} />
      
      <DebugLogPanel isOpen={isDebugOpen} onClose={() => setIsDebugOpen(false)} />
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────

interface TeamCardProps {
  team: BackendTeam;
  isSelected: boolean;
  isHovered: boolean;
  isDerby: boolean;
  leagueIcon: string;
  leagueColor?: string;
  mode: 'floating' | 'grid' | 'tier';
  absolutePos?: { x: number; y: number };
  onToggle: () => void;
  onHover: (name: string | null) => void;
  backendTeams: BackendTeam[];
}

const TeamCard: React.FC<TeamCardProps> = ({
  team, isSelected, isHovered, isDerby, leagueIcon, leagueColor, mode, absolutePos, onToggle, onHover, backendTeams
}) => {
  const teamData = backendTeams.find(t => t.id === team.id || t.name === team.name);
  const logo = teamData?.logo || team.logo;
  const isImage = logo?.startsWith('http') || logo?.startsWith('/') || logo?.includes('.');

  return (
    <motion.button
      layout
      onClick={onToggle}
      onMouseEnter={() => onHover(team.name)}
      onMouseLeave={() => onHover(null)}
      className={`${(mode === 'tier' || mode === 'grid') ? 'relative' : 'absolute'} w-28 h-28 rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-shadow ${
        isSelected
          ? 'tactical-glass shadow-lg z-10'
          : 'glass border border-white/5 hover:border-white/15'
      }`}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        x: absolutePos?.x,
        y: absolutePos?.y,
        scale: isSelected || isHovered ? 1.15 : 1,
        opacity: 1,
        zIndex: isSelected || isHovered ? 20 : 1,
      }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ 
        type: 'spring', 
        damping: 30, 
        stiffness: 250,
      }}
      style={{
        borderColor: isSelected ? leagueColor || 'var(--primary)' : undefined,
        boxShadow: (isSelected || isHovered) ? `0 0 35px ${leagueColor || 'var(--primary)'}40` : undefined,
      }}
    >
      <div className="w-12 h-12 flex items-center justify-center mb-2">
        {isImage ? (
          <img src={logo || undefined} alt={team.name} className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
        ) : (
          <div className="text-3xl">{logo || leagueIcon}</div>
        )}
      </div>
      <div className="text-[9px] font-black uppercase leading-tight text-center px-1 break-words w-full">
        {(isHovered || isSelected || team.name.length <= 14) 
          ? team.name 
          : team.name.slice(0, 12) + '…'}
      </div>
      {(mode === 'tier' || team.uefa_pot || isHovered) && (
        <div className="font-mono text-[8px] text-gray-600 mt-0.5">
          {isHovered ? team.country_code || 'INTL' : `TIER ${team.uefa_pot || 4}`}
        </div>
      )}

      {/* Derby indicator */}
      {isDerby && (
        <div className="absolute -top-1.5 -left-1.5 text-sm" title="Derby match!">🔥</div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-void flex items-center justify-center text-[10px] font-bold shadow-glow"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          style={{ backgroundColor: leagueColor }}
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  );
};
