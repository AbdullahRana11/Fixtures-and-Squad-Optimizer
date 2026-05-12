import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  className = '',
}) => {
  const handleClick = () => {
    soundManager.playTransition();
    setTimeout(onClick, 150);
  };

  return (
    <motion.button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 glass-lg border border-white/10 rounded-lg font-mono text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-300 hover:text-white hover:border-mint-sentinel/50 transition-all ${className}`}
      whileHover={{ scale: 1.05, x: -2 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <ArrowLeft size={14} className="sm:w-4 sm:h-4" />
      <span className="hidden sm:inline">{label}</span>
    </motion.button>
  );
};
