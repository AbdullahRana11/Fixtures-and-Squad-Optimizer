import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { 
  Zap, TrendingUp, AlertTriangle, X, 
  ArrowUp, ArrowDown, Minus, Info
} from 'lucide-react';

interface SimulationResultsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationResultsPanel: React.FC<SimulationResultsPanelProps> = ({ isOpen, onClose }) => {
  const { simulationResult, clearSimulation } = useAppStore();

  if (!simulationResult) return null;

  const { summary, standings, butterflyEffects, fatigueWarnings } = simulationResult;

  // Filter top rank changes
  const significantChanges = standings
    ?.filter((s: any) => s.rankChange !== 0)
    .sort((a: any, b: any) => Math.abs(b.rankChange) - Math.abs(a.rankChange))
    .slice(0, 6);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-y-0 right-0 w-96 z-[120] bg-black/80 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-emerald-900/20 to-transparent flex items-center justify-between">
            <div>
              <h3 className="text-emerald-400 font-bold tracking-tight flex items-center gap-2">
                <Zap size={16} /> SIMULATION RESULTS
              </h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">Butterfly Effect Analysis</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                label="Rank Changes" 
                value={summary?.rankChanges || 0} 
                icon={<TrendingUp size={12} />} 
                color="text-emerald-400"
              />
              <StatCard 
                label="Tactical Flips" 
                value={summary?.predictionsFlipped || 0} 
                icon={<ShuffleIcon size={12} />} 
                color="text-blue-400"
              />
              <StatCard 
                label="Fatigue Risks" 
                value={summary?.fatigueRisks || 0} 
                icon={<AlertTriangle size={12} />} 
                color="text-orange-400"
              />
              <StatCard 
                label="Teams Affected" 
                value={summary?.teamsAffected || 0} 
                icon={<Info size={12} />} 
                color="text-purple-400"
              />
            </div>

            {/* Rank Changes Section */}
            <Section title="PROJECTED RANK SHIFTS">
              <div className="space-y-2">
                {significantChanges?.map((team: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-zinc-500 font-mono text-[10px] w-4">#{team.rank}</span>
                      <span className="text-white text-xs font-bold uppercase">{team.team}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {team.rankChange > 0 ? (
                        <span className="text-emerald-400 text-[10px] font-bold flex items-center gap-0.5">
                          <ArrowUp size={10} /> {team.rankChange}
                        </span>
                      ) : (
                        <span className="text-red-400 text-[10px] font-bold flex items-center gap-0.5">
                          <ArrowDown size={10} /> {Math.abs(team.rankChange)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {(!significantChanges || significantChanges.length === 0) && (
                  <p className="text-zinc-600 text-[10px] italic text-center py-4">No significant rank shifts detected.</p>
                )}
              </div>
            </Section>

            {/* Butterfly Effects Section */}
            <Section title="UPCOMING PREDICTION FLIPS">
              <div className="space-y-3">
                {butterflyEffects?.slice(0, 5).map((effect: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-mono text-[9px] uppercase font-bold">MW {effect.matchweek}</span>
                      <div className="flex items-center gap-1 text-zinc-500 text-[9px]">
                        <span>{effect.originalFavorite}</span>
                        <ArrowRightIcon size={8} />
                        <span className="text-emerald-400 font-bold">{effect.newFavorite}</span>
                      </div>
                    </div>
                    <p className="text-zinc-300 text-[10px] leading-relaxed italic">"{effect.reason}"</p>
                  </div>
                ))}
                {(!butterflyEffects || butterflyEffects.length === 0) && (
                  <p className="text-zinc-600 text-[10px] italic text-center py-4">Current result injection does not flip upcoming predictions.</p>
                )}
              </div>
            </Section>

            {/* Fatigue Section */}
            <Section title="FATIGUE CONGESTION WARNINGS">
              <div className="space-y-3">
                {fatigueWarnings?.slice(0, 3).map((warn: any, i: number) => (
                  <div key={i} className={`p-3 rounded-xl border ${
                    warn.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 
                    warn.severity === 'high' ? 'bg-orange-500/5 border-orange-500/20' : 
                    'bg-zinc-500/5 border-zinc-500/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white text-xs font-bold uppercase">{warn.team}</span>
                      <span className={`text-[9px] font-bold uppercase ${
                        warn.severity === 'critical' ? 'text-red-400' : 'text-orange-400'
                      }`}>{warn.severity} RISK</span>
                    </div>
                    <p className="text-zinc-400 text-[10px]">
                      {warn.gamesInWindow} matches in 10-day window (MW {warn.matchweeks.join(', ')})
                    </p>
                  </div>
                ))}
                {(!fatigueWarnings || fatigueWarnings.length === 0) && (
                  <p className="text-zinc-600 text-[10px] italic text-center py-4">No critical fatigue windows identified.</p>
                )}
              </div>
            </Section>
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 bg-white/2 flex gap-3">
            <button
              onClick={() => {
                clearSimulation();
                onClose();
              }}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-800 text-white text-[10px] font-bold uppercase hover:bg-zinc-700 transition-all"
            >
              Clear Simulation
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 text-black text-[10px] font-bold uppercase hover:bg-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              Acknowledge
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="p-3 rounded-xl bg-white/5 border border-white/5">
    <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
      {icon}
      <span className="font-mono text-[8px] uppercase font-bold tracking-wider">{label}</span>
    </div>
    <div className="text-xl font-black text-white">{value}</div>
  </div>
);

const Section = ({ title, children }: any) => (
  <div className="space-y-4">
    <h4 className="text-zinc-500 font-mono text-[9px] uppercase tracking-[0.2em] font-bold border-l-2 border-emerald-500/50 pl-3">
      {title}
    </h4>
    {children}
  </div>
);

const ShuffleIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 3h5v5" /><path d="M4 20L21 3" /><path d="M21 16v5h-5" /><path d="M15 15l6 6" /><path d="M4 4l5 5" />
  </svg>
);

const ArrowRightIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);
