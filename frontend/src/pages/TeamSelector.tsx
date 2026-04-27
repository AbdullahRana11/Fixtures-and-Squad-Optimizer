import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Loader2, Search, ArrowLeft, Zap } from 'lucide-react';
import axios from 'axios';

interface TeamData {
  id: string;
  name: string;
  league: string;
  city: string;
  stadium: string;
  biggest_rival: string | null;
  country_code: string;
}

interface TeamsResponse {
  league: string;
  totalAvailable: number;
  requiredCount: number;
  topLeague: string;
  teams: TeamData[];
}

const LEAGUE_THEMES: Record<string, { accent: string; glow: string; border: string; bg: string }> = {
  pl: { accent: 'text-purple-400', glow: 'shadow-purple-500/30', border: 'border-purple-500/30', bg: 'bg-purple-500/10' },
  ucl: { accent: 'text-blue-400', glow: 'shadow-blue-500/30', border: 'border-blue-500/30', bg: 'bg-blue-500/10' },
  bundesliga: { accent: 'text-red-400', glow: 'shadow-red-500/30', border: 'border-red-500/30', bg: 'bg-red-500/10' },
  facup: { accent: 'text-rose-400', glow: 'shadow-rose-900/30', border: 'border-rose-900/30', bg: 'bg-rose-900/10' },
  seriea: { accent: 'text-sky-400', glow: 'shadow-sky-500/30', border: 'border-sky-500/30', bg: 'bg-sky-500/10' },
  laliga: { accent: 'text-orange-400', glow: 'shadow-orange-500/30', border: 'border-orange-500/30', bg: 'bg-orange-500/10' },
  custom: { accent: 'text-emerald-400', glow: 'shadow-emerald-500/30', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
};

const LEAGUE_NAMES: Record<string, string> = {
  pl: 'Premier League',
  ucl: 'Champions League',
  bundesliga: 'Bundesliga',
  facup: 'FA Cup',
  seriea: 'Serie A',
  laliga: 'La Liga',
  custom: 'Custom Generator',
};

const TeamSelector: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const leagueId = searchParams.get('league') || 'pl';
  const theme = LEAGUE_THEMES[leagueId] || LEAGUE_THEMES.pl;

  const [teams, setTeams] = useState<TeamData[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [requiredCount, setRequiredCount] = useState(20);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');
  const [filterLeague, setFilterLeague] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);
  const [showStageModal, setShowStageModal] = useState(false);

  // Fetch teams from API
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get<TeamsResponse>(
          `http://localhost:3000/api/fixtures/teams/${leagueId}`
        );
        setTeams(data.teams);
        
        // Custom logic for UCL: standard is 36, but we allow 24 for knockout
        const count = leagueId === 'ucl' ? 36 : data.requiredCount;
        setRequiredCount(count);

        if (data.topLeague) {
          const topTeams = data.teams.filter(t => t.league === data.topLeague);
          if (topTeams.length === count) {
            setSelected(new Set(topTeams.map(t => t.name)));
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, [leagueId]);

  // Unique leagues for filter
  const uniqueLeagues = useMemo(() => {
    const leagues = [...new Set(teams.map(t => t.league))];
    return leagues.sort();
  }, [teams]);

  // Filtered teams
  const filteredTeams = useMemo(() => {
    return teams.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
                          t.city.toLowerCase().includes(search.toLowerCase());
      const matchLeague = filterLeague === 'all' || t.league === filterLeague;
      return matchSearch && matchLeague;
    });
  }, [teams, search, filterLeague]);

  const toggleTeam = (name: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < requiredCount) {
        next.add(name);
      }
      return next;
    });
  };

  const selectAll = (league: string) => {
    const leagueTeams = teams.filter(t => t.league === league);
    setSelected(prev => {
      const next = new Set(prev);
      for (const t of leagueTeams) {
        if (next.size < requiredCount) next.add(t.name);
      }
      return next;
    });
  };

  const autoSelectTop = (n: number) => {
    const topTeams = teams.slice(0, n).map(t => t.name);
    setSelected(new Set(topTeams));
  };

  const clearSelection = () => setSelected(new Set());

  const handleGenerate = async (forceMode?: string) => {
    // For UCL, we first show the modal if no mode is forced
    if (leagueId === 'ucl' && !forceMode) {
      if (selected.size === 36 || selected.size === 24) {
        setShowStageModal(true);
        return;
      }
      return;
    }

    if (leagueId !== 'ucl' && selected.size !== requiredCount) return;
    
    setGenerating(true);
    try {
      const mode = leagueId === 'facup' ? 'auto' : (forceMode || undefined);
      const { data } = await axios.post('http://localhost:3000/api/fixtures/generate', {
        league: leagueId,
        teamNames: Array.from(selected),
        mode,
      });

      // Navigation target
      let targetRoute = '/fixtures/display';
      if (leagueId === 'facup') targetRoute = '/fixtures/bracket';
      if (forceMode === 'ucl-knockout') targetRoute = '/fixtures/ucl-bracket';

      navigate(targetRoute, {
        state: { schedule: data, leagueId },
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Generation failed');
      setGenerating(false);
    }
  };

  const canGenerate = useMemo(() => {
    if (leagueId === 'ucl') return selected.size === 36 || selected.size === 24;
    return selected.size === requiredCount;
  }, [leagueId, selected.size, requiredCount]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090A0F]">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090A0F] text-white">
      {/* Header */}
      <div className="border-b border-white/5 bg-black/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/fixtures')}
              className="p-2 rounded-lg border border-white/10 hover:border-white/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white/50" />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${theme.accent}`}>
                {LEAGUE_NAMES[leagueId]} — Team Selection
              </h1>
              <p className="text-xs text-white/40 mt-1">
                Select {requiredCount} teams from {teams.length} available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`px-4 py-2 rounded-xl border ${canGenerate ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10'} transition-colors`}>
              <span className={`text-lg font-bold ${canGenerate ? 'text-emerald-400' : 'text-white/50'}`}>
                {selected.size}
              </span>
              <span className="text-xs text-white/30 ml-1">/ {leagueId === 'ucl' ? '24 or 36' : requiredCount}</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleGenerate()}
              disabled={!canGenerate || generating}
              className={`px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-all ${
                canGenerate
                  ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/30'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              {leagueId === 'ucl' ? 'Next Step' : 'Generate Fixtures'}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm backdrop-blur-xl"
            onClick={() => setError(null)}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-6 py-6 flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams or cities..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterLeague('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              filterLeague === 'all' ? `${theme.bg} ${theme.accent} ${theme.border} border` : 'bg-white/5 text-white/40 border border-transparent'
            }`}
          >
            All
          </button>
          {uniqueLeagues.map(league => (
            <button
              key={league}
              onClick={() => setFilterLeague(league)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                filterLeague === league ? `${theme.bg} ${theme.accent} ${theme.border} border` : 'bg-white/5 text-white/40 border border-transparent'
              }`}
            >
              {league}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {uniqueLeagues.map(league => (
            <button
              key={`sel-${league}`}
              onClick={() => selectAll(league)}
              className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/30 border border-white/5 hover:border-white/20 hover:text-white/60 transition-colors"
            >
              + {league.split(' ')[0]}
            </button>
          ))}
          <button
            onClick={clearSelection}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400/50 border border-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-colors"
          >
            Clear
          </button>
        </div>

        {leagueId === 'ucl' && (
          <div className="flex items-center gap-2 border-l border-white/5 pl-4">
            <button
              onClick={() => autoSelectTop(24)}
              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all flex items-center gap-2"
            >
              <Zap className="w-3 h-3 fill-current" />
              Auto Select 24
            </button>
            <button
              onClick={() => autoSelectTop(36)}
              className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex items-center gap-2"
            >
              <Check className="w-3 h-3" />
              Auto Select 36
            </button>
          </div>
        )}
      </div>

      {/* Team Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
        >
          {filteredTeams.map(team => {
            const isSelected = selected.has(team.name);
            return (
              <motion.div
                key={team.id}
                variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                onClick={() => toggleTeam(team.name)}
                className={`relative p-4 rounded-xl border cursor-pointer transition-all group overflow-hidden ${
                  isSelected
                    ? `${theme.border} ${theme.bg} shadow-lg ${theme.glow}`
                    : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/5'
                }`}
              >
                {/* Selection Badge */}
                <div className={`absolute top-3 right-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'border-emerald-400 bg-emerald-500' : 'border-white/15'
                }`}>
                  {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                </div>

                <h3 className={`font-bold text-sm pr-8 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                  {team.name}
                </h3>
                <p className="text-[10px] text-white/25 mt-1 uppercase tracking-wider">{team.league}</p>

                <div className="flex items-center gap-3 mt-3">
                  <span className="text-[10px] text-white/30">
                    📍 {team.city}
                  </span>
                  <span className="text-[10px] text-white/20">
                    🏟 {team.stadium}
                  </span>
                </div>

                {team.biggest_rival && (
                  <p className="text-[9px] text-red-400/40 mt-2">
                    ⚔ Rival: {team.biggest_rival}
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* UCL Stage Modal */}
      <AnimatePresence>
        {showStageModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-lg bg-[#0D0F16] border border-white/10 rounded-2xl p-8 overflow-hidden relative shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-4">
                <button onClick={() => setShowStageModal(false)} className="text-white/20 hover:text-white transition-colors">✕</button>
              </div>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <Zap className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-black">Champions League</h2>
                <p className="text-white/40 text-sm mt-1">Select your desired competition format</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleGenerate('ucl-league')}
                  disabled={selected.size !== 36}
                  className={`p-6 rounded-xl border text-left transition-all group ${
                    selected.size === 36 ? 'border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5' : 'opacity-30 cursor-not-allowed border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors">League Stage</h3>
                    {selected.size === 36 && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">Generate the full 36-team Swiss system schedule. All 36 teams must be selected.</p>
                </button>

                <button
                  onClick={() => handleGenerate('ucl-knockout')}
                  disabled={selected.size !== 24}
                  className={`p-6 rounded-xl border text-left transition-all group ${
                    selected.size === 24 ? 'border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5' : 'opacity-30 cursor-not-allowed border-white/5 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition-colors">Knockout Path</h3>
                    {selected.size === 24 && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-xs text-white/40 leading-relaxed">Start from the Play-offs toward the Round of 16. Requires exactly 24 teams.</p>
                </button>
              </div>

              {selected.size !== 36 && selected.size !== 24 && (
                <p className="text-center text-[10px] text-red-400/50 mt-6 uppercase tracking-widest font-bold">
                  Select 24 or 36 teams to proceed
                </p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamSelector;
