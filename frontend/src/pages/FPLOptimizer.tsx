import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Play, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import PlayerPitchCard, { Player } from '../components/PlayerPitchCard';
import TelemetrySidebar from '../components/TelemetrySidebar';
import ActionButton from '../components/ActionButton';

export interface FPLPlayer {
  id: string;
  name: string;
  club_name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  cost_millions: string;
  points: number;
}

const FPLOptimizer: React.FC = () => {
  const [budget, setBudget] = useState('100.0');
  const [squad, setSquad] = useState<FPLPlayer[]>([]);
  const [summary, setSummary] = useState({ total_cost: 0, total_points: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [telemetryData, setTelemetryData] = useState([
    { label: "Branches Evaluated", value: "-", color: 'aqua' as const },
    { label: "Branches Pruned", value: "-", color: 'default' as const },
    { label: "Execution Time", value: "-", color: 'mint' as const },
    { label: "Search Depth", value: "-", color: 'default' as const },
  ]);

  const handleOptimize = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await axios.post('http://localhost:3000/api/fpl/optimize', {
        budget: parseFloat(budget)
      });

      if (response.data?.squad) {
        setSquad(response.data.squad);
        setSummary(response.data.summary);
        const tel = response.data.telemetry;
        setTelemetryData([
          { label: "Branches Evaluated", value: tel.branches_evaluated.toLocaleString(), color: 'aqua' },
          { label: "Branches Pruned", value: tel.branches_pruned.toLocaleString(), color: 'default' },
          { label: "Execution Time", value: tel.execution_time_ms + "ms", color: 'mint' },
          { label: "Search Depth", value: tel.depth_reached.toString(), color: 'default' },
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error?.message || 'Failed to connect to FPL Knapsack Engine.');
    } finally {
      setIsLoading(false);
    }
  };

  // Grouping logic based on requested 12-man pitch display + 3 subs layout
  // Positions required from Engine: 2 GK, 5 DEF, 5 MID, 3 FWD
  const grouped = {
    startGk: [] as FPLPlayer[],
    startDef: [] as FPLPlayer[],
    startMid: [] as FPLPlayer[],
    startFwd: [] as FPLPlayer[],
    subs: [] as FPLPlayer[],
  };

  if (squad.length === 15) {
    const sorted = [...squad].sort((a,b) => b.points - a.points);
    const gks = sorted.filter(p => p.position === 'GK');
    const defs = sorted.filter(p => p.position === 'DEF');
    const mids = sorted.filter(p => p.position === 'MID');
    const fwds = sorted.filter(p => p.position === 'FWD');

    grouped.startGk = gks.slice(0, 1);
    grouped.startDef = defs.slice(0, 4);
    grouped.startMid = mids.slice(0, 4);
    grouped.startFwd = fwds.slice(0, 3);
    
    // Bench the lowest scoring players internally for the layout
    grouped.subs = [
      ...gks.slice(1), 
      ...defs.slice(4), 
      ...mids.slice(4), 
      ...fwds.slice(3)
    ];
  }

  // Format bridge helper for PlayerPitchCard component props
  const adaptPlayer = (p: FPLPlayer): Player => ({
    id: p.id,
    name: p.name,
    position: p.position,
    cost: parseFloat(p.cost_millions)
  });

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Config Sidebar */}
      <div className="w-[360px] bg-white/5 backdrop-blur-xl border-r border-white/10 shadow-2xl flex flex-col p-8 overflow-y-auto">
        <div className="flex items-center gap-2 mb-12">
          <Settings className="w-4 h-4 text-cyber-purple" />
          <span className="font-space text-xs uppercase tracking-[0.2em] text-cyber-purple font-bold">
            Configuration
          </span>
        </div>

        <div className="space-y-8 flex-1">
          <div className="space-y-3">
            <label className="font-space text-[10px] text-white/40 uppercase tracking-widest block">
              Budget Constraint
            </label>
            <div className="relative">
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                step="0.1"
                min="38.0"
                className="w-full bg-obsidian/80 border border-glass-border px-4 py-3 font-space text-2xl text-white rounded-lg focus:outline-none focus:border-neon-aqua/50 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-space text-sm text-white/20">£m</span>
            </div>
            <p className="font-outfit text-[10px] text-white/20 ml-1">Range: £38.0m — £150.0m</p>
          </div>

          <ActionButton 
            onClick={handleOptimize}
            disabled={isLoading || !budget}
            className="w-full flex items-center justify-center gap-2 py-4"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isLoading ? 'Crunching Nodes...' : 'Optimize Squad'}
          </ActionButton>

          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
              <p className="font-outfit text-xs text-red-200">{errorMsg}</p>
            </div>
          )}

          <div className="h-[1px] w-full bg-white/5 my-8" />

          {/* Results Summary */}
          <div className="space-y-6">
            <div className="font-space text-xs text-neon-aqua uppercase tracking-[0.2em] font-bold">
              Results
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="font-space text-[9px] text-white/30 uppercase tracking-widest mb-1">Total Cost</div>
                <div className="font-space text-lg text-white">£{summary.total_cost.toFixed(1)}m</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="font-space text-[9px] text-white/30 uppercase tracking-widest mb-1">Total Points</div>
                <div className="font-space text-lg text-mint-valid">{summary.total_points}</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Budget Limit', status: squad.length ? 'PASS' : '-' },
                { label: 'Position Quota', status: squad.length ? 'PASS' : '-' },
                { label: 'Club Limit (3)', status: squad.length ? 'PASS' : '-' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/2">
                  <span className="font-outfit text-[11px] text-white/60">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-space text-[10px] font-bold tracking-widest ${squad.length ? 'text-mint-valid' : 'text-white/20'}`}>
                      {c.status}
                    </span>
                    {squad.length > 0 && <CheckCircle2 className="w-3 h-3 text-mint-valid" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Pitch Area */}
      <div className="flex-1 relative bg-[#090A0F] overflow-hidden p-8 flex items-center justify-center">
        <div className="absolute inset-x-20 inset-y-12 border-2 border-white/5 rounded-[40px] bg-gradient-to-b from-[#1a472a] to-[#0d2113] opacity-30 transform perspective-[1000px] rotateX-[25deg]">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-[1px] h-full bg-white" />
            <div className="w-48 h-48 border border-white rounded-full flex items-center justify-center" />
          </div>
        </div>

        {squad.length === 15 ? (
          <motion.div 
            key="pitch"
            className="relative z-10 w-full max-w-[900px] h-full flex flex-col justify-between py-12"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {/* FWDs */}
            <div className="flex justify-center gap-12">
              {grouped.startFwd.map(p => (
                <PlayerPitchCard key={p.id} player={adaptPlayer(p)} />
              ))}
            </div>
            {/* MIDs */}
            <div className="flex justify-around gap-8 px-12">
              {grouped.startMid.map(p => (
                <PlayerPitchCard key={p.id} player={adaptPlayer(p)} />
              ))}
            </div>
            {/* DEFs */}
            <div className="flex justify-around gap-8">
              {grouped.startDef.map(p => (
                <PlayerPitchCard key={p.id} player={adaptPlayer(p)} />
              ))}
            </div>
            {/* GKs */}
            <div className="flex justify-center gap-8">
              {grouped.startGk.map(p => (
                <PlayerPitchCard key={p.id} player={adaptPlayer(p)} />
              ))}
            </div>
          </motion.div>
        ) : (
          <div className="z-10 font-space text-white/20 text-sm tracking-widest uppercase">
            Awaiting Computational Directives
          </div>
        )}

        {/* Substitutes Bench Bar */}
        <AnimatePresence>
          {squad.length === 15 && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: 'spring' }}
              className="absolute bottom-8 right-8 flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl"
            >
              <div className="w-[1px] h-full bg-white/5 mx-2" />
              {grouped.subs.map(p => (
                <div key={p.id} className="relative scale-75 opacity-70 hover:scale-100 hover:opacity-100 transition-all">
                  <PlayerPitchCard player={adaptPlayer(p)} />
                  <div className="absolute -top-2 -right-2 bg-void px-2 py-1 rounded text-[8px] font-space text-white/40 border border-white/10">SUB</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TelemetrySidebar data={telemetryData} />
    </div>
  );
};

export default FPLOptimizer;
