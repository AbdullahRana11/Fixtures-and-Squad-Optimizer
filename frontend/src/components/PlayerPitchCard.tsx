import React from 'react';
import { motion } from 'framer-motion';

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  cost: number;
  points?: number;
  club?: string;
  isSelected?: boolean;
}

interface PlayerPitchCardProps {
  player?: Player;
  positionLabel?: string;
}

const PlayerPitchCard: React.FC<PlayerPitchCardProps> = ({ player, positionLabel }) => {
  return (
    <motion.div
      className={`w-28 h-32 rounded-lg border flex flex-col items-center justify-between p-3 transition-all duration-300 backdrop-blur-sm ${
        player 
          ? 'bg-obsidian/80 border-white/5 shadow-[0_0_15px_rgba(0,0,0,0.2)]' 
          : 'bg-white/5 border-dashed border-white/5'
      }`}
      initial={player ? { opacity: 0, scale: 0.8 } : {}}
      animate={player ? { opacity: 1, scale: 1 } : {}}
      whileHover={player ? { y: -4, scale: 1.02, borderColor: 'rgba(5,213,255,0.3)' } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Position Label */}
      <div className="font-space text-[8px] uppercase tracking-widest text-mint-sentinel font-bold">
        {player?.position || positionLabel}
      </div>

      {/* Avatar Circle */}
      <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${
        player ? 'bg-black border-emerald-400/30 shadow-[0_0_10px_rgba(5,213,255,0.2)]' : 'bg-white/5 border-white/5'
      }`}>
        {player && (
          <span className="font-clash text-lg text-white/20">
            {player.name.charAt(0)}
          </span>
        )}
      </div>

      {/* Info Container */}
      <div className="w-full text-center space-y-1">
        <div className="font-outfit text-[10px] font-medium text-white truncate px-1">
          {player?.name || 'Empty Slot'}
        </div>
        {player && (
          <div className="font-space text-[9px] text-mint-valid font-bold">
            £{player.cost.toFixed(1)}m
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default PlayerPitchCard;
