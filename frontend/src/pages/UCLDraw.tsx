import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCcw } from 'lucide-react';
import TeamNode, { Team } from '../components/TeamNode';
import TelemetrySidebar from '../components/TelemetrySidebar';
import ActionButton from '../components/ActionButton';

const POT_A: Team[] = [
  { id: 'rm', name: 'Real Madrid', country: 'ESP', pot: 'A', isDrawn: true },
  { id: 'mc', name: 'Manchester City', country: 'ENG', pot: 'A' },
  { id: 'bm', name: 'Bayern Munich', country: 'GER', pot: 'A', isDrawn: true },
  { id: 'psg', name: 'Paris Saint-Germain', country: 'FRA', pot: 'A' },
  { id: 'im', name: 'Inter Milan', country: 'ITA', pot: 'A' },
  { id: 'rbl', name: 'RB Leipzig', country: 'GER', pot: 'A' },
  { id: 'fcp', name: 'FC Porto', country: 'POR', pot: 'A' },
  { id: 'slb', name: 'Benfica', country: 'POR', pot: 'A' },
];

const POT_B: Team[] = [
  { id: 'atm', name: 'Atletico Madrid', country: 'ESP', pot: 'B' },
  { id: 'bvb', name: 'Borussia Dortmund', country: 'GER', pot: 'B' },
  { id: 'liv', name: 'Liverpool', country: 'ENG', pot: 'B', isDrawn: true },
  { id: 'acm', name: 'AC Milan', country: 'ITA', pot: 'B', isDrawn: true },
  { id: 'nap', name: 'Napoli', country: 'ITA', pot: 'B' },
  { id: 'psv', name: 'PSV Eindhoven', country: 'NED', pot: 'B' },
  { id: 'ars', name: 'Arsenal', country: 'ENG', pot: 'B' },
  { id: 'fcb', name: 'FC Barcelona', country: 'ESP', pot: 'B' },
];

const UCLDraw: React.FC = () => {
  const [telemetryData] = useState([
    { label: "Nodes Explored", value: "342", color: 'aqua' as const },
    { label: "Paths Pruned", value: "18", color: 'default' as const },
    { label: "Execution Time", value: "12ms", color: 'mint' as const },
    { label: "Valid Permutations", value: "4", color: 'default' as const },
  ]);

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
      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto">
        <div className="mb-12">
          <div className="font-space text-xs text-neon-aqua uppercase tracking-[0.3em] mb-2">
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
            <motion.div 
              className="space-y-2"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {POT_A.map(team => (
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
            <div className="w-full space-y-4">
              {[1, 2].map((match) => (
                <motion.div 
                  key={match}
                  className="glass-card p-6 flex items-center justify-between relative group"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="font-outfit font-bold text-white">
                    {match === 1 ? 'Real Madrid' : 'Bayern Munich'}
                  </div>
                  <div className="flex flex-col items-center gap-1 mx-4">
                    <div className="h-[1px] w-12 bg-neon-aqua/50" />
                    <span className="font-space text-[8px] text-white/30 uppercase tracking-widest">VS</span>
                    <div className="h-[1px] w-12 bg-neon-aqua/50" />
                  </div>
                  <div className="font-outfit font-bold text-white">
                    {match === 1 ? 'Liverpool' : 'AC Milan'}
                  </div>
                  {/* Neon Glow Line */}
                  <div className="absolute inset-0 border border-neon-aqua/20 rounded-xl pointer-events-none group-hover:border-neon-aqua/40 transition-colors" />
                </motion.div>
              ))}

              {[3, 4, 5, 6, 7, 8].map((slot) => (
                <div 
                  key={slot}
                  className="h-20 border border-dashed border-white/5 rounded-xl flex items-center justify-center"
                >
                  <span className="font-space text-[10px] text-white/10 uppercase tracking-widest">
                    Slot {slot}
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
            <motion.div 
              className="space-y-2"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {POT_B.map(team => (
                <motion.div key={team.id} variants={itemVariants}>
                  <TeamNode team={team} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Floating Actions */}
        <div className="mt-auto flex items-center gap-4 py-8 border-t border-white/5">
          <ActionButton className="flex items-center gap-2">
            <Play className="w-4 h-4 fill-current" />
            Execute Draw
          </ActionButton>
          <ActionButton variant="ghost" className="flex items-center gap-2">
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
