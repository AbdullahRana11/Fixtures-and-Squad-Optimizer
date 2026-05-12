import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';

export const EntryScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [showTaskbar, setShowTaskbar] = useState(false);
  const setAppMode = useAppStore((state) => state.setAppMode);

  useEffect(() => {
    soundManager.playBoot();
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowTaskbar(true);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  const handleModeSelect = (mode: 'fixture-generator' | 'squad-optimizer') => {
    soundManager.playTransition();
    setAppMode(mode);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const textVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.05,
        duration: 0.5,
        ease: [0.2, 0.65, 0.3, 0.9],
      },
    }),
  };

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(0, 242, 96, 0.15) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, -30, 0],
            y: [0, 30, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, rgba(5, 213, 255, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -50, 50, 0],
            y: [0, -50, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Content */}
      <motion.div
        className="relative z-10 text-center max-w-2xl px-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="text-6xl font-display font-black tracking-wider mb-4">
            {'TACTICAL'.split('').map((char, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'inline-block' }}
              >
                {char}
              </motion.span>
            ))}
          </div>
          <div className="text-4xl font-display font-black tracking-wider text-mint-sentinel">
            {'COMMAND CENTER'.split('').map((char, i) => (
              <motion.span
                key={i}
                custom={i + 'TACTICAL'.length}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                style={{ display: 'inline-block' }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* Status Line */}
        <motion.div variants={itemVariants} className="mb-12">
          <div className="font-mono text-sm text-cyan-spark uppercase tracking-[0.2em]">
            ▌ Initializing Systems
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={itemVariants} className="mb-12 w-full max-w-xs mx-auto">
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-mint-sentinel via-cyan-spark to-purple-nexus"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ type: 'tween', duration: 0.3 }}
            />
          </div>
          <div className="mt-2 text-xs text-gray-500 font-mono">{Math.min(Math.round(progress), 100)}%</div>
        </motion.div>

        {/* Sub-text */}
        <motion.div variants={itemVariants} className="text-sm text-gray-600 font-mono">
          &gt; SYSTEMS ONLINE &gt; AWAITING COMMAND
        </motion.div>
      </motion.div>

      {/* Taskbar - Slides in from bottom */}
      {showTaskbar && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 px-6 py-12"
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className="tactical-glass rounded-xl p-4 flex items-center justify-center gap-6 max-w-md mx-auto">
            {/* Fixture Generator Button */}
            <motion.button
              onClick={() => handleModeSelect('fixture-generator')}
              className="flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider rounded-lg border border-mint-sentinel text-mint-sentinel hover:bg-mint-sentinel/10 transition-all"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0, 242, 96, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              📋 Fixtures
            </motion.button>

            {/* Divider */}
            <div className="h-8 w-px bg-white/10" />

            {/* Squad Optimizer Button */}
            <motion.button
              onClick={() => handleModeSelect('squad-optimizer')}
              className="flex-1 py-3 px-4 font-mono text-sm font-bold uppercase tracking-wider rounded-lg border border-purple-nexus text-purple-nexus hover:bg-purple-nexus/10 transition-all"
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(176, 38, 255, 0.4)' }}
              whileTap={{ scale: 0.95 }}
            >
              👥 Squad
            </motion.button>
          </div>

          {/* Instructions */}
          <motion.div
            className="text-center text-xs text-gray-600 font-mono mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            SELECT SYSTEM TO BEGIN
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
