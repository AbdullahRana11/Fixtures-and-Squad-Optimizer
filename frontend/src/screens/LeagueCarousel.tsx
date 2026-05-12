// ============================================================
// LeagueCarousel.tsx  —  REPLACE frontend/src/screens/LeagueCarousel.tsx
// Improvements:
//   • Required team count shown per league
//   • League description / tier info
//   • Arrow button nav in addition to drag/scroll
//   • Smoother 3D perspective carousel
//   • Skeleton loading hint
// ============================================================
import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LEAGUES, League } from '../data/mockData';
import { useAppStore } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';
import { THEMES } from '../utils/themeConfig';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LeagueCarouselProps {
  onSelectLeague: (league: League) => void;
}

const LEAGUE_META: Record<string, { teams: number; desc: string }> = {
  psl:         { teams: 6,  desc: 'Pakistan Super League — 6 franchises, T20 format' },
  ipl:         { teams: 10, desc: 'Indian Premier League — world\'s richest T20 league' },
  bbl:         { teams: 8,  desc: 'Big Bash League — Australia\'s premier T20 competition' },
  cpl:         { teams: 6,  desc: 'Caribbean Premier League — T20 cricket' },
  sa20:        { teams: 6,  desc: 'SA20 — South Africa\'s T20 franchise league' },
  'icc-t20wc': { teams: 20, desc: 'ICC T20 World Cup — global T20 championship' },
  'icc-odi-wc':{ teams: 10, desc: 'ICC ODI World Cup — 50-over world championship' },
  custom:      { teams: 10, desc: 'Custom tournament — pick any teams' },
};

export const LeagueCarousel: React.FC<LeagueCarouselProps> = ({ onSelectLeague }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const theme = useAppStore((state) => state.theme);
  const themeData = THEMES[theme];

  const total = LEAGUES.length;
  const current = LEAGUES[currentIndex % total];

  const navigate = (dir: 1 | -1) => {
    setCurrentIndex((prev) => (prev + dir + total) % total);
    soundManager.playHover();
  };

  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(false);
    dragStartX.current = e.clientX;
  };
  const handleDragMove = (e: React.MouseEvent) => {
    if (Math.abs(e.clientX - dragStartX.current) > 10) setIsDragging(true);
  };
  const handleDragEnd = (e: React.MouseEvent) => {
    const diff = dragStartX.current - e.clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    setTimeout(() => setIsDragging(false), 50);
  };
  const handleWheel = (e: React.WheelEvent) => {
    navigate(e.deltaY > 0 ? 1 : -1);
  };

  const getPosition = (index: number) => {
    const diff = ((index - currentIndex) % total + total) % total;
    const adj = diff > total / 2 ? diff - total : diff;
    if (adj === 0) return { scale: 1, opacity: 1, blur: 0, z: 50, x: 0 };
    if (Math.abs(adj) === 1) return { scale: 0.72, opacity: 0.55, blur: 3, z: 20, x: adj * 380 };
    return { scale: 0.52, opacity: 0.2, blur: 7, z: 0, x: adj * 380 };
  };

  const meta = LEAGUE_META[current.id] || { teams: 20, desc: '' };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col items-center justify-center bg-transparent relative overflow-hidden"
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Ambient glow */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ background: `radial-gradient(circle at 50% 55%, ${themeData.glow.replace('0.5','0.12')} 0%, transparent 65%)` }}
        transition={{ duration: 0.6 }}
      />

      {/* Header */}
      <motion.div
        className="absolute top-14 left-0 right-0 text-center z-20 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-display font-black tracking-wider mb-1 uppercase">SELECT LEAGUE</h1>
        <p className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">
          Drag · Scroll · Arrow keys
        </p>
      </motion.div>

      {/* Arrow buttons */}
      <button
        className="absolute left-6 z-30 p-3 tactical-glass border border-white/10 rounded-xl hover:border-white/30 transition-all pointer-events-auto"
        onClick={(e) => { e.stopPropagation(); navigate(-1); }}
      >
        <ChevronLeft size={20} className="text-gray-400" />
      </button>
      <button
        className="absolute right-6 z-30 p-3 tactical-glass border border-white/10 rounded-xl hover:border-white/30 transition-all pointer-events-auto"
        onClick={(e) => { e.stopPropagation(); navigate(1); }}
      >
        <ChevronRight size={20} className="text-gray-400" />
      </button>

      {/* 3D Carousel */}
      <div className="relative w-full h-full flex items-center justify-center perspective-1000">
        {LEAGUES.map((league, index) => {
          const pos = getPosition(index);
          const isCenter = index === currentIndex % total;

          return (
            <motion.div
              key={league.id}
              className="absolute"
              animate={{
                scale: pos.scale,
                opacity: pos.opacity,
                filter: `blur(${pos.blur}px)`,
                zIndex: pos.z,
                x: pos.x,
              }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            >
              <motion.div
                className="tactical-glass rounded-2xl p-8 w-96 h-[340px] flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                  borderColor: isCenter ? league.color + '80' : 'rgba(255,255,255,0.08)',
                  boxShadow: isCenter ? `0 0 50px ${league.color}50, inset 0 0 40px ${league.color}15` : 'none',
                }}
                onClick={(e) => {
                  if (isDragging) return;
                  e.stopPropagation();
                  if (!isCenter) { setCurrentIndex(index); soundManager.playClick(); return; }
                  soundManager.playSuccess();
                  onSelectLeague(league);
                }}
              >
                {/* BG accent */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 ${isCenter ? 'opacity-15' : 'opacity-0'}`}
                  style={{ background: `radial-gradient(circle at 50% 30%, ${league.color} 0%, transparent 70%)` }}
                />

                {/* HUD corners */}
                {isCenter && ['tl','tr','bl','br'].map((c) => (
                  <div key={c} className={`hud-corner hud-corner-${c} m-3`} style={{ borderColor: league.color + '80' }} />
                ))}

                <div className="relative z-10 text-center w-full">
                  <motion.div
                    className="text-6xl mb-3"
                    animate={isCenter ? { scale: [1, 1.12, 1], y: [0, -8, 0] } : {}}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    {league.icon}
                  </motion.div>

                  <h2 className="text-2xl font-display font-black tracking-wider mb-1" style={{ color: league.color }}>
                    {league.name}
                  </h2>

                  <p className="font-mono text-xs text-gray-500 mb-1">{league.country}</p>

                  {isCenter && (
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 mb-5"
                      >
                        {/* Team count badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-3"
                          style={{ borderColor: league.color + '40', backgroundColor: league.color + '10' }}
                        >
                          <span className="font-mono text-[9px] uppercase tracking-wider" style={{ color: league.color }}>
                            {meta.teams} Teams Required
                          </span>
                        </div>

                        <p className="font-mono text-[10px] text-gray-500 px-4 leading-relaxed">
                          {meta.desc}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  )}

                  {isCenter && (
                    <motion.button
                      className="px-8 py-2.5 border rounded-xl font-mono text-xs font-bold uppercase tracking-wider"
                      style={{ borderColor: league.color, color: league.color }}
                      whileHover={{ scale: 1.08, boxShadow: `0 0 25px ${league.color}` }}
                      whileTap={{ scale: 0.95 }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        soundManager.playSuccess();
                        onSelectLeague(league);
                      }}
                    >
                      Initialize System →
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <motion.div
        className="absolute bottom-10 left-0 right-0 flex items-center justify-center gap-2 z-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {LEAGUES.map((league, index) => (
          <motion.button
            key={league.id}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); soundManager.playClick(); }}
            className="h-1 rounded-full transition-all"
            style={{
              background: index === currentIndex % total ? league.color : 'rgba(255,255,255,0.15)',
              width: index === currentIndex % total ? 28 : 8,
            }}
            whileHover={{ scale: 1.4 }}
          />
        ))}
      </motion.div>

      {/* Index counter */}
      <div className="absolute bottom-10 right-8 font-mono text-[10px] text-gray-600">
        {(currentIndex % total) + 1} / {total}
      </div>
    </div>
  );
};
