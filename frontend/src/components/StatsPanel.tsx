import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Shield, Flame, Zap, Target, BarChart3, Eye } from 'lucide-react';

interface TeamStats {
  gf: number;
  ga: number;
  gd: number;
  cs: number;
  pos?: number;
}

interface MatchPrediction {
  homeTeam: string;
  awayTeam: string;
  homeWin: number;
  draw: number;
  awayWin: number;
  homeXG: number;
  awayXG: number;
  homePossession: number;
  awayPossession: number;
  homeCleanSheet: number;
  awayCleanSheet: number;
  homeForm: number[];
  awayForm: number[];
  keyInsight: string;
  matchIntensity: 'Low' | 'Medium' | 'High' | 'Extreme';
  
  homeLastSeason: TeamStats;
  awayLastSeason: TeamStats;
  homeThisSeason: TeamStats;
  awayThisSeason: TeamStats;
}

interface StatsPanelProps {
  prediction: MatchPrediction | null;
  isOpen: boolean;
  onClose: () => void;
  leagueColor: string;
}

const INTENSITY_CONFIG = {
  Low: { color: '#4ade80', bg: 'rgba(74,222,128,0.08)', label: 'Routine' },
  Medium: { color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', label: 'Competitive' },
  High: { color: '#f97316', bg: 'rgba(249,115,22,0.08)', label: 'Fierce' },
  Extreme: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', label: 'Volcanic' },
};

const FormDot: React.FC<{ result: number; delay: number }> = ({ result, delay }) => {
  const colors = { 3: '#4ade80', 1: '#fbbf24', 0: '#ef4444' };
  const labels = { 3: 'W', 1: 'D', 0: 'L' };
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 15 }}
      className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-black"
      style={{ backgroundColor: `${colors[result as keyof typeof colors]}20`, color: colors[result as keyof typeof colors], border: `1.5px solid ${colors[result as keyof typeof colors]}40` }}
    >
      {labels[result as keyof typeof labels]}
    </motion.div>
  );
};

const AnimatedBar: React.FC<{ value: number; max: number; color: string; delay: number; label: string; suffix?: string }> = ({ value, max, color, delay, label, suffix = '%' }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-white/40 uppercase tracking-wider font-bold">{label}</span>
      <span className="text-xs font-bold" style={{ color }}>{value}{suffix}</span>
    </div>
    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / max) * 100}%` }}
        transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  </div>
);

const SeasonStatsBox: React.FC<{ title: string; stats: TeamStats; color: string; delay: number }> = ({ title, stats, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-2"
  >
    <div className="flex justify-between items-center mb-1">
      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">{title}</span>
      {stats.pos && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/10 text-white/60">Pos: {stats.pos}</span>}
    </div>
    <div className="grid grid-cols-4 gap-2">
      <div className="text-center">
        <p className="text-[8px] text-white/20 uppercase font-bold">GF</p>
        <p className="text-xs font-black" style={{ color }}>{stats.gf}</p>
      </div>
      <div className="text-center">
        <p className="text-[8px] text-white/20 uppercase font-bold">GA</p>
        <p className="text-xs font-black text-rose-400">{stats.ga}</p>
      </div>
      <div className="text-center">
        <p className="text-[8px] text-white/20 uppercase font-bold">GD</p>
        <p className="text-xs font-black text-sky-400">{stats.gd > 0 ? `+${stats.gd}` : stats.gd}</p>
      </div>
      <div className="text-center">
        <p className="text-[8px] text-white/20 uppercase font-bold">CS</p>
        <p className="text-xs font-black text-indigo-400">{stats.cs}</p>
      </div>
    </div>
  </motion.div>
);

const WinProbabilityBar: React.FC<{ homeWin: number; draw: number; awayWin: number; homeColor: string }> = ({ homeWin, draw, awayWin, homeColor }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between text-[10px] text-white/30 uppercase tracking-wider font-bold">
      <span>Home</span>
      <span>Draw</span>
      <span>Away</span>
    </div>
    <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${homeWin}%` }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-l-full"
        style={{ backgroundColor: homeColor }}
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${draw}%` }}
        transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full bg-white/20"
      />
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${awayWin}%` }}
        transition={{ delay: 0.4, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-r-full bg-white/40"
      />
    </div>
    <div className="flex items-center justify-between">
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="text-lg font-black"
        style={{ color: homeColor }}
      >
        {homeWin}%
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="text-lg font-black text-white/30"
      >
        {draw}%
      </motion.span>
      <motion.span
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-lg font-black text-white/60"
      >
        {awayWin}%
      </motion.span>
    </div>
  </div>
);

const StatsPanel: React.FC<StatsPanelProps> = ({ prediction, isOpen, onClose, leagueColor }) => {
  if (!prediction) return null;

  const intensity = INTENSITY_CONFIG[prediction.matchIntensity];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 bg-[#0A0B10] border-l border-white/5 overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" style={{ color: leagueColor }} />
                  <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: leagueColor }}>
                    Match Intelligence
                  </h2>
                </div>
                <button onClick={onClose} className="p-1.5 rounded-lg border border-white/10 hover:border-white/30 transition-colors">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              {/* Teams */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="text-lg font-black text-white">{prediction.homeTeam}</p>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mt-0.5">Home</p>
                </div>
                <div className="px-4">
                  <div className="text-[10px] text-white/10 font-bold">VS</div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">{prediction.awayTeam}</p>
                  <p className="text-[9px] text-white/20 uppercase tracking-wider mt-0.5">Away</p>
                </div>
              </motion.div>

              {/* Intensity Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ backgroundColor: intensity.bg, border: `1px solid ${intensity.color}30` }}
              >
                <Flame className="w-3 h-3" style={{ color: intensity.color }} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: intensity.color }}>
                  {intensity.label} Intensity
                </span>
              </motion.div>
            </div>

            {/* Win Probability */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-white/30" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Win Probability</h3>
              </div>
              <WinProbabilityBar
                homeWin={prediction.homeWin}
                draw={prediction.draw}
                awayWin={prediction.awayWin}
                homeColor={leagueColor}
              />
            </div>

            {/* Key Stats */}
            <div className="p-6 border-b border-white/5 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-white/30" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Match Stats</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AnimatedBar value={prediction.homeXG} max={4} color={leagueColor} delay={0.3} label="Home xG" suffix="" />
                <AnimatedBar value={prediction.awayXG} max={4} color="#94a3b8" delay={0.4} label="Away xG" suffix="" />
              </div>

              <AnimatedBar value={prediction.homePossession} max={100} color={leagueColor} delay={0.5} label="Home Possession" />
              <AnimatedBar value={prediction.awayPossession} max={100} color="#94a3b8" delay={0.6} label="Away Possession" />

              <div className="grid grid-cols-2 gap-4">
                <AnimatedBar value={prediction.homeCleanSheet} max={100} color="#4ade80" delay={0.7} label="Home CS" />
                <AnimatedBar value={prediction.awayCleanSheet} max={100} color="#4ade80" delay={0.8} label="Away CS" />
              </div>
            </div>

            {/* Seasonal Comparison */}
            <div className="p-6 border-b border-white/5 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-4 h-4 text-white/30" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Last Season (23-24)</h3>
                </div>
                <div className="space-y-3">
                  <SeasonStatsBox title="Home" stats={prediction.homeLastSeason} color={leagueColor} delay={0.9} />
                  <SeasonStatsBox title="Away" stats={prediction.awayLastSeason} color="#94a3b8" delay={1.0} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-white/30" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">This Season (24-25)</h3>
                </div>
                <div className="space-y-3">
                  <SeasonStatsBox title="Home" stats={prediction.homeThisSeason} color={leagueColor} delay={1.1} />
                  <SeasonStatsBox title="Away" stats={prediction.awayThisSeason} color="#94a3b8" delay={1.2} />
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-6 border-b border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-white/30" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">Current Form</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">{prediction.homeTeam}</p>
                  <div className="flex gap-1.5">
                    {prediction.homeForm.map((r, i) => (
                      <FormDot key={`h-${i}`} result={r} delay={1.3 + i * 0.08} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/25 mb-2 uppercase tracking-wider">{prediction.awayTeam}</p>
                  <div className="flex gap-1.5">
                    {prediction.awayForm.map((r, i) => (
                      <FormDot key={`a-${i}`} result={r} delay={1.4 + i * 0.08} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insight */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="p-6"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4" style={{ color: leagueColor }} />
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: leagueColor }}>Key Insight</h3>
              </div>
              <p className="text-sm text-white/50 leading-relaxed italic">
                "{prediction.keyInsight}"
              </p>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default StatsPanel;
