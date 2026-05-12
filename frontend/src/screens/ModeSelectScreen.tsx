// ============================================================
// ModeSelectScreen.tsx  —  REPLACE frontend/src/screens/ModeSelectScreen.tsx
// Fixes:
//   • "Enter System" button now correctly navigates
//   • Shows both cards side by side (not toggling)
//   • Feature bullets under each card
//   • Hover reveals animated feature list
// ============================================================
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';
import { Calendar, Users, Zap, Trophy, TrendingUp, Shuffle } from 'lucide-react';

const FIXTURE_FEATURES = [
  { icon: <Calendar size={12} />, text: 'Real constraint-solved schedules' },
  { icon: <Trophy size={12} />, text: 'Premier League, UCL, FA Cup & more' },
  { icon: <TrendingUp size={12} />, text: 'AI match prediction with odds' },
  { icon: <Shuffle size={12} />, text: 'Save & advance tournament rounds' },
];

const SQUAD_FEATURES = [
  { icon: <Users size={12} />, text: 'FPL Knapsack optimization engine' },
  { icon: <Zap size={12} />, text: 'Budget & risk-index configuration' },
  { icon: <TrendingUp size={12} />, text: 'Matchweek-aware squad building' },
  { icon: <Shuffle size={12} />, text: 'Smart player swap suggestions' },
];

export const ModeSelectScreen: React.FC = () => {
  const setAppMode = useAppStore((state) => state.setAppMode);
  const [hoveredCard, setHoveredCard] = useState<'fixtures' | 'squad' | null>(null);

  useEffect(() => { soundManager.playTransition(); }, []);

  const handleSelect = (mode: 'fixture-generator' | 'squad-optimizer') => {
    soundManager.playSuccess();
    setAppMode(mode);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 200 } },
  };

  return (
    <div className="w-full h-full bg-transparent flex flex-col items-center justify-center overflow-hidden relative px-6">

      {/* Ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,242,96,0.06) 0%, transparent 70%)', top: '10%', left: '-10%' }}
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(176,38,255,0.07) 0%, transparent 70%)', bottom: '5%', right: '-5%' }}
          animate={{ x: [0, -40, 0], y: [0, 40, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Title */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-2xl font-display font-black uppercase tracking-[0.3em] text-white/40 mb-1">
          TACTICAL COMMAND CENTER
        </h1>
        <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">
          SELECT OPERATIONAL MODULE
        </p>
      </motion.div>

      {/* Cards */}
      <motion.div
        className="relative z-10 flex flex-col lg:flex-row gap-6 w-full max-w-4xl"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ── Fixture Generator ── */}
        <ModeCard
          variants={cardVariants}
          accentColor="#00F260"
          glowColor="rgba(0,242,96,0.25)"
          title="FIXTURE GENERATOR"
          subtitle="Orchestrate Tournaments"
          emoji="📋"
          features={FIXTURE_FEATURES}
          isHovered={hoveredCard === 'fixtures'}
          onHover={() => setHoveredCard('fixtures')}
          onLeave={() => setHoveredCard(null)}
          onEnter={() => handleSelect('fixture-generator')}
          shortcut="1"
        />

        {/* Divider */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-3 shrink-0">
          <div className="h-32 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
          <span className="font-mono text-[9px] text-gray-600 uppercase">or</span>
          <div className="h-32 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        </div>

        {/* ── Squad Optimizer ── */}
        <ModeCard
          variants={cardVariants}
          accentColor="#B026FF"
          glowColor="rgba(176,38,255,0.25)"
          title="SQUAD OPTIMIZER"
          subtitle="Strategic Team Formation"
          emoji="👥"
          features={SQUAD_FEATURES}
          isHovered={hoveredCard === 'squad'}
          onHover={() => setHoveredCard('squad')}
          onLeave={() => setHoveredCard(null)}
          onEnter={() => handleSelect('squad-optimizer')}
          shortcut="2"
        />
      </motion.div>

      {/* Keyboard hint */}
      <motion.p
        className="relative z-10 mt-10 font-mono text-[9px] text-gray-700 uppercase tracking-widest"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        Press <kbd>1</kbd> or <kbd>2</kbd> to jump directly
      </motion.p>
    </div>
  );
};

interface ModeCardProps {
  variants: any;
  accentColor: string;
  glowColor: string;
  title: string;
  subtitle: string;
  emoji: string;
  features: { icon: React.ReactNode; text: string }[];
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onEnter: () => void;
  shortcut: string;
}

const ModeCard: React.FC<ModeCardProps> = ({
  variants, accentColor, glowColor, title, subtitle, emoji,
  features, isHovered, onHover, onLeave, onEnter, shortcut,
}) => (
  <motion.div
    variants={variants}
    className="flex-1 tactical-glass rounded-2xl p-8 flex flex-col cursor-pointer relative overflow-hidden group"
    style={{
      borderColor: isHovered ? accentColor + '60' : 'rgba(255,255,255,0.08)',
      boxShadow: isHovered ? `0 0 60px ${glowColor}, inset 0 0 40px ${glowColor.replace('0.25','0.05')}` : 'none',
      transition: 'border-color 0.3s, box-shadow 0.3s',
    }}
    onMouseEnter={onHover}
    onMouseLeave={onLeave}
    onClick={onEnter}
    whileHover={{ scale: 1.02, y: -4 }}
    whileTap={{ scale: 0.98 }}
  >
    {/* Background radial glow */}
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{ opacity: isHovered ? 1 : 0 }}
      transition={{ duration: 0.3 }}
      style={{ background: `radial-gradient(circle at 50% 0%, ${glowColor} 0%, transparent 70%)` }}
    />

    {/* Shortcut badge */}
    <div className="absolute top-4 right-4 w-6 h-6 rounded-md border border-white/10 flex items-center justify-center font-mono text-[9px] text-gray-600">
      {shortcut}
    </div>

    {/* HUD corners on hover */}
    <AnimatePresence>
      {isHovered && (
        <>
          {['tl','tr','bl','br'].map((pos) => (
            <motion.div
              key={pos}
              className={`hud-corner hud-corner-${pos} m-3`}
              style={{ borderColor: accentColor + '80' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          ))}
        </>
      )}
    </AnimatePresence>

    <div className="relative z-10 flex flex-col h-full">
      {/* Icon */}
      <motion.div
        className="text-5xl mb-5"
        animate={isHovered ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
        transition={{ duration: 0.5 }}
      >
        {emoji}
      </motion.div>

      {/* Title */}
      <motion.h2
        className="text-2xl font-display font-black tracking-wider mb-1"
        style={{ color: isHovered ? accentColor : '#fff' }}
        transition={{ duration: 0.2 }}
      >
        {title}
      </motion.h2>
      <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-6">{subtitle}</p>

      {/* Feature list */}
      <div className="space-y-2.5 flex-1">
        {features.map((f, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2.5"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: isHovered ? 1 : 0.5, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <span style={{ color: accentColor + 'cc' }}>{f.icon}</span>
            <span className="font-mono text-[10px] text-gray-400">{f.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Enter button */}
      <motion.div
        className="mt-6 w-full py-3 rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-center transition-all"
        style={{
          backgroundColor: isHovered ? accentColor : 'rgba(255,255,255,0.04)',
          color: isHovered ? '#000' : '#555',
          boxShadow: isHovered ? `0 0 30px ${glowColor}` : 'none',
        }}
        animate={{ scale: isHovered ? 1.02 : 1 }}
      >
        Enter System →
      </motion.div>
    </div>
  </motion.div>
);
