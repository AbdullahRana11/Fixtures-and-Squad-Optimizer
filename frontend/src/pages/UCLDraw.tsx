import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw, Loader2 } from 'lucide-react';
import axios from 'axios';
import TeamNode, { Team } from '../components/TeamNode';
import TelemetrySidebar from '../components/TelemetrySidebar';
import ActionButton from '../components/ActionButton';

const POT_A: Team[] = [
  { id: 'rm', name: 'Real Madrid', country: 'ESP', pot: 'A' },
  { id: 'mc', name: 'Manchester City', country: 'ENG', pot: 'A' },
  { id: 'bm', name: 'Bayern Munich', country: 'GER', pot: 'A' },
  { id: 'psg', name: 'Paris Saint-Germain', country: 'FRA', pot: 'A' },
  { id: 'im', name: 'Inter Milan', country: 'ITA', pot: 'A' },
  { id: 'rbl', name: 'RB Leipzig', country: 'GER', pot: 'A' },
  { id: 'fcp', name: 'FC Porto', country: 'POR', pot: 'A' },
  { id: 'slb', name: 'Benfica', country: 'POR', pot: 'A' },
];

const POT_B: Team[] = [
  { id: 'atm', name: 'Atletico Madrid', country: 'ESP', pot: 'B' },
  { id: 'bvb', name: 'Borussia Dortmund', country: 'GER', pot: 'B' },
  { id: 'liv', name: 'Liverpool', country: 'ENG', pot: 'B' },
  { id: 'acm', name: 'AC Milan', country: 'ITA', pot: 'B' },
  { id: 'nap', name: 'Napoli', country: 'ITA', pot: 'B' },
  { id: 'psv', name: 'PSV Eindhoven', country: 'NED', pot: 'B' },
  { id: 'ars', name: 'Arsenal', country: 'ENG', pot: 'B' },
  { id: 'fcb', name: 'FC Barcelona', country: 'ESP', pot: 'B' },
];

const UCLDraw: React.FC = () => {
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [telemetryData, setTelemetryData] = useState([
    { label: "Nodes Explored", value: "-", color: 'aqua' as const },
    { label: "Paths Pruned", value: "-", color: 'default' as const },
    { label: "Execution Time", value: "-", color: 'mint' as const },
    { label: "Valid Permutations", value: "Locked", color: 'default' as const },
  ]);

  const drawnIds = useMemo(() => {
    return matches.flatMap(m => [m.team_a.id, m.team_b.id]);
  }, [matches]);

  const displayPotA = POT_A.map(team => ({ ...team, isDrawn: drawnIds.includes(team.id) }));
  const displayPotB = POT_B.map(team => ({ ...team, isDrawn: drawnIds.includes(team.id) }));

  const handleExecuteDraw = async () => {
    if (matches.length >= 8 || isLoading) return;
    setIsLoading(true);

    try {
      const response = await axios.post('/api/ucl/draw-match', {
        drawn_team_ids: drawnIds
      });

      if (response.data?.match) {
        setMatches(prev => [...prev, response.data.match]);
        
        const tel = response.data.telemetry;
        setTelemetryData([
          { label: "Nodes Explored", value: tel.nodes_explored.toString(), color: 'aqua' },
          { label: "Paths Pruned", value: tel.paths_pruned.toString(), color: 'default' },
          { label: "Execution Time", value: tel.execution_time_ms + "ms", color: 'mint' },
          { label: "Valid Permutations", value: "Verified", color: 'default' }
        ]);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error?.message || 'Error connecting to backend or dead-end reached.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetDraw = () => {
     setMatches([]);
     setTelemetryData([
      { label: "Nodes Explored", value: "-", color: 'aqua' },
      { label: "Paths Pruned", value: "-", color: 'default' },
      { label: "Execution Time", value: "-", color: 'mint' },
      { label: "Valid Permutations", value: "Locked", color: 'default' }
     ]);
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="mb-12">
          <div className="font-space text-xs text-emerald-400 uppercase tracking-[0.3em] mb-2">
            Constraint Satisfaction Engine
          </div>
          <h1 className="text-4xl font-clash">UCL Round of 16 Draw</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-Draw grid-cols-3 gap-8 items-start mb-12">
          {/* Pot A */}
          <div className="space-y-4">
            <h2 className="font-space text-[10px] text-white/30 uppercase tracking-[0.3em] pl-2 mb-6">
              Pot A — Seeded
            </h2>
            <motion.div className="space-y-2" variants={listVariants} initial="hidden" animate="visible">
              {displayPotA.map(team => (
                <motion.div key={team.id} variants={itemVariants}>
                  <TeamNode team={team} />
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Match Canvas */}
          <div className="flex flex-col items-center">
            <h2 className="font-space text-[10px] text-white/30 uppercase tracking-[0.3em] mb-6">
              Match Canvas
            </h2>
            <div className="w-full space-y-4 relative">
              {matches.map((match, i) => (
                <motion.div 
                  key={i}
                  className="glass-card p-6 flex items-center justify-between relative group"
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="font-outfit font-bold text-white max-w-[120px] truncate text-center">
                    {match.team_a.name}
                  </div>
                  <div className="flex flex-col items-center gap-1 mx-4 shrink-0">
                    <div className="h-[1px] w-8 sm:w-12 bg-emerald-400/50" />
                    <span className="font-space text-[8px] text-white/30 uppercase tracking-widest">VS</span>
                    <div className="h-[1px] w-8 sm:w-12 bg-emerald-400/50" />
                  </div>
                  <div className="font-outfit font-bold text-white max-w-[120px] truncate text-center">
                    {match.team_b.name}
                  </div>
                  {/* Neon Glow Line */}
                  <div className="absolute inset-0 border border-emerald-400/20 rounded-xl pointer-events-none group-hover:border-emerald-400/40 transition-colors" />
                </motion.div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: 8 - matches.length }).map((_, i) => (
                <div 
                  key={`empty-${i}`}
                  className="h-20 border border-dashed border-white/5 rounded-xl flex items-center justify-center transition-all"
                >
                  <span className="font-space text-[10px] text-white/10 uppercase tracking-widest">
                    Slot {matches.length + i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pot B */}
          <div className="space-y-4">
            <h2 className="font-space text-[10px] text-white/30 uppercase tracking-[0.3em] pl-2 mb-6">
              Pot B — Unseeded
            </h2>
            <motion.div className="space-y-2" variants={listVariants} initial="hidden" animate="visible">
              {displayPotB.map(team => (
                <motion.div key={team.id} variants={itemVariants}>
                  <TeamNode team={team} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="mt-auto flex items-center gap-4 py-8 border-t border-white/5">
          <ActionButton onClick={handleExecuteDraw} className="flex items-center gap-2" disabled={isLoading || matches.length >= 8}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            Execute Draw
          </ActionButton>
          <ActionButton onClick={resetDraw} variant="ghost" className="flex items-center gap-2" disabled={isLoading}>
            <RotateCcw className="w-4 h-4" />
            Reset Draw
          </ActionButton>
        </div>
      </div>

      {/* Telemetry Sidebar */}
      <TelemetrySidebar data={telemetryData} />
    </div>
  );
};

export default UCLDraw;
