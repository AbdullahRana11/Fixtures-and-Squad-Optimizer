import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Play, CheckCircle2 } from 'lucide-react';
import PlayerPitchCard, { Player } from '../components/PlayerPitchCard';
import TelemetrySidebar from '../components/TelemetrySidebar';
import ActionButton from '../components/ActionButton';

const MOCK_SQUAD: Player[] = [
  { id: '1', name: 'Alisson', position: 'GK', cost: 5.5 },
  { id: '2', name: 'Van Dijk', position: 'DEF', cost: 6.5 },
  { id: '3', name: 'Saliba', position: 'DEF', cost: 5.8 },
  { id: '4', name: 'Udogie', position: 'DEF', cost: 5.0 },
  { id: '5', name: 'Porro', position: 'DEF', cost: 5.7 },
  { id: '6', name: 'Salah', position: 'MID', cost: 13.5 },
  { id: '7', name: 'Saka', position: 'MID', cost: 9.0 },
  { id: '8', name: 'Palmer', position: 'MID', cost: 6.2 },
  { id: '9', name: 'Rice', position: 'MID', cost: 5.5 },
  { id: '10', name: 'Haaland', position: 'FWD', cost: 14.3 },
  { id: '11', name: 'Watkins', position: 'FWD', cost: 8.9 },
  { id: '12', name: 'Isak', position: 'FWD', cost: 8.1 },
  // Subs
  { id: '13', name: 'Areola', position: 'GK', cost: 4.2 },
  { id: '14', name: 'Gusto', position: 'DEF', cost: 4.3 },
  { id: '15', name: 'Gordon', position: 'MID', cost: 6.1 },
];

const FPLOptimizer: React.FC = () => {
  const [telemetryData] = useState([
    { label: "Branches Evaluated", value: "150,430", color: 'aqua' as const },
    { label: "Branches Pruned", value: "850,000", color: 'default' as const },
    { label: "Execution Time", value: "1,450ms", color: 'mint' as const },
    { label: "Search Depth", value: "15", color: 'default' as const },
  ]);

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
                type="text" 
                defaultValue="100.0" 
                className="w-full bg-obsidian/80 border border-glass-border px-4 py-3 font-space text-2xl text-white rounded-lg focus:outline-none focus:border-neon-aqua/50 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-space text-sm text-white/20">£m</span>
            </div>
            <p className="font-outfit text-[10px] text-white/20 ml-1">Range: £38.0m — £150.0m</p>
          </div>

          <ActionButton className="w-full flex items-center justify-center gap-2 py-4">
            <Play className="w-4 h-4 fill-current" />
            Optimize Squad
          </ActionButton>

          <div className="h-[1px] w-full bg-white/5 my-8" />

          {/* Results Summary */}
          <div className="space-y-6">
            <div className="font-space text-xs text-neon-aqua uppercase tracking-[0.2em] font-bold">
              Results
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="font-space text-[9px] text-white/30 uppercase tracking-widest mb-1">Total Cost</div>
                <div className="font-space text-lg text-white">£99.5m</div>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="font-space text-[9px] text-white/30 uppercase tracking-widest mb-1">Total Points</div>
                <div className="font-space text-lg text-mint-valid">2,450</div>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Budget Limit', status: 'PASS' },
                { id: 'pos', label: 'Position Quota', status: 'PASS' },
                { id: 'club', label: 'Club Limit (3)', status: 'PASS' },
              ].map((c, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/2">
                  <span className="font-outfit text-[11px] text-white/60">{c.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-space text-[10px] text-mint-valid font-bold tracking-widest">{c.status}</span>
                    <CheckCircle2 className="w-3 h-3 text-mint-valid" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Pitch Area */}
      <div className="flex-1 relative bg-[#090A0F] overflow-hidden p-8 flex items-center justify-center">
        {/* Isometric Pitch Decor */}
        <div className="absolute inset-x-20 inset-y-12 border-2 border-white/5 rounded-[40px] bg-gradient-to-b from-[#1a472a] to-[#0d2113] opacity-30 transform perspective-[1000px] rotateX-[25deg]">
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-[1px] h-full bg-white" />
            <div className="w-48 h-48 border border-white rounded-full flex items-center justify-center" />
          </div>
        </div>

        {/* Player Grid */}
        <motion.div 
          className="relative z-10 w-full max-w-[900px] h-full flex flex-col justify-between py-12"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
        >
          {/* FWDs */}
          <div className="flex justify-center gap-12">
            {[9, 10, 11].map(i => <PlayerPitchCard key={i} player={MOCK_SQUAD[i]} />)}
          </div>
          {/* MIDs */}
          <div className="flex justify-around gap-8 px-12">
            {[5, 6, 7, 8].map(i => <PlayerPitchCard key={i} player={MOCK_SQUAD[i]} />)}
          </div>
          {/* DEFs */}
          <div className="flex justify-around gap-8">
            {[1, 2, 3, 4].map(i => <PlayerPitchCard key={i} player={MOCK_SQUAD[i]} />)}
          </div>
          {/* GKs */}
          <div className="flex justify-center gap-8">
            <PlayerPitchCard player={MOCK_SQUAD[0]} />
          </div>
        </motion.div>

        {/* Substitutes Bench Bar */}
        <div className="absolute bottom-8 right-8 flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
          <div className="w-[1px] h-full bg-white/5 mx-2" />
          {[12, 13, 14].map(i => (
            <div key={i} className="relative scale-75 opacity-70 hover:scale-100 hover:opacity-100 transition-all">
              <PlayerPitchCard player={MOCK_SQUAD[i]} />
              <div className="absolute -top-2 -right-2 bg-void px-2 py-1 rounded text-[8px] font-space text-white/40 border border-white/10">SUB</div>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry Sidebar */}
      <TelemetrySidebar data={telemetryData} />
    </div>
  );
};

export default FPLOptimizer;
