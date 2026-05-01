import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface Team {
  id: string;
  name: string;
  country: string;
  pot: 'A' | 'B';
  isDrawn?: boolean;
}

interface TeamNodeProps {
  team: Team;
  status?: 'default' | 'active' | 'success' | 'danger';
}

const TeamNode: React.FC<TeamNodeProps> = ({ team, status = 'default' }) => {
  return (
    <motion.div
      className={`relative p-4 rounded-xl glass-card transition-all duration-300 ${
        team.isDrawn ? 'opacity-30' : 'opacity-100'
      } ${
        status === 'active' ? 'border-emerald-400/50 shadow-[0_0_15px_rgba(5,213,255,0.1)]' : ''
      }`}
      whileHover={!team.isDrawn ? { y: -4, scale: 1.02, borderColor: 'rgba(5,213,255,0.3)' } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] border border-white/5 ${
            team.pot === 'A' ? 'bg-cyber-purple/10 text-cyber-purple' : 'bg-emerald-400/10 text-emerald-400'
          }`}>
            {team.country}
          </div>
          <div>
            <div className="font-outfit font-semibold text-sm text-white">
              {team.name}
            </div>
            <div className="font-space text-[10px] text-white/30 tracking-widest uppercase">
              Pot {team.pot}
            </div>
          </div>
        </div>

        {team.isDrawn && (
          <div className="w-5 h-5 rounded-full bg-mint-valid/20 flex items-center justify-center">
            <Check className="w-3 h-3 text-mint-valid" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TeamNode;
