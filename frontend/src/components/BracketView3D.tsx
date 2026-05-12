import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

interface Matchup {
  id: string;
  home: { name: string; score?: number };
  away: { name: string; score?: number };
  prediction?: string;
}

interface Round {
  name: string;
  shortName: string;
  matches: Matchup[];
}

interface BracketView3DProps {
  bracket: {
    rounds: Round[];
  };
  themeColor?: string;
}

export const BracketView3D: React.FC<BracketView3DProps> = ({ bracket, themeColor = '#10b981' }) => {
  const [activeMatch, setActiveMatch] = useState<string | null>(null);
  
  // Mouse tracking for 3D perspective
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100 };
  const rotateX = useSpring(useTransform(y, [0, window.innerHeight], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(x, [0, window.innerWidth], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    x.set(e.clientX);
    y.set(e.clientY);
  };

  return (
    <div 
      className="relative w-full h-[80vh] overflow-hidden rounded-3xl bg-black/40 border border-white/5 cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      style={{ perspective: 1500 }}
    >
      <motion.div
        style={{ rotateX, rotateY }}
        className="flex h-full items-center gap-32 p-20 px-40 min-w-max"
      >
        {bracket.rounds.map((round, rIdx) => (
          <div key={round.name} className="flex flex-col justify-around h-full gap-8">
            <div className="text-center mb-8">
              <h3 className="font-bold tracking-[0.3em] text-xs uppercase" style={{ color: themeColor }}>{round.name}</h3>
              <div className="h-[2px] w-8 mx-auto mt-2" style={{ backgroundColor: `${themeColor}33` }} />
            </div>

            <div className="flex flex-col gap-12 justify-around flex-1">
              {round.matches.map((match, mIdx) => (
                <motion.div
                  key={match.id}
                  layoutId={match.id}
                  onHoverStart={() => setActiveMatch(match.id)}
                  onHoverEnd={() => setActiveMatch(null)}
                  className={`relative w-64 p-4 rounded-2xl border transition-all duration-500 ${
                    activeMatch === match.id 
                      ? 'shadow-lg scale-110 z-10' 
                      : 'bg-zinc-900/50 border-white/5 opacity-80'
                  }`}
                  style={{
                    backgroundColor: activeMatch === match.id ? `${themeColor}1a` : undefined,
                    borderColor: activeMatch === match.id ? themeColor : undefined,
                    boxShadow: activeMatch === match.id ? `0 0 30px ${themeColor}26` : undefined,
                  }}
                >
                  {/* Connection Lines (Visual only) */}
                  {rIdx < bracket.rounds.length - 1 && (
                    <div className="absolute top-1/2 -right-32 w-32 h-[1px]" style={{ background: `linear-gradient(to r, ${themeColor}4d, transparent)` }} />
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span 
                        className={`text-xs font-bold truncate pr-2 ${match.home.score !== undefined && match.home.score > (match.away.score || 0) ? '' : 'text-zinc-400'}`}
                        style={{ color: match.home.score !== undefined && match.home.score > (match.away.score || 0) ? themeColor : undefined }}
                      >
                        {match.home.name || 'TBD'}
                      </span>
                      {match.home.score !== undefined && (
                        <span className="text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded">{match.home.score}</span>
                      )}
                    </div>
                    
                    <div className="h-[1px] bg-white/5" />

                    <div className="flex justify-between items-center">
                      <span 
                        className={`text-xs font-bold truncate pr-2 ${match.away.score !== undefined && match.away.score > (match.home.score || 0) ? '' : 'text-zinc-400'}`}
                        style={{ color: match.away.score !== undefined && match.away.score > (match.home.score || 0) ? themeColor : undefined }}
                      >
                        {match.away.name || 'TBD'}
                      </span>
                      {match.away.score !== undefined && (
                        <span className="text-xs font-mono font-black text-white bg-white/5 px-2 py-0.5 rounded">{match.away.score}</span>
                      )}
                    </div>
                  </div>

                  {/* Prediction Overlay */}
                  <AnimatePresence>
                    {activeMatch === match.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-10 left-4 right-4 text-black text-[9px] font-black py-1 px-2 rounded-full text-center uppercase tracking-tighter shadow-lg"
                        style={{ backgroundColor: themeColor }}
                      >
                        {match.prediction || 'CALCULATING PROBABILITY...'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Depth Fog */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-[#050505] via-transparent to-[#050505] opacity-60" />
      
      {/* Legend */}
      <div className="absolute bottom-8 right-8 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 text-[9px] text-zinc-500 space-y-1">
        <p>DRAG TO EXPLORE SPATIAL TREE</p>
        <p>HOVER TO REVEAL TACTICAL PREDICTIONS</p>
      </div>
    </div>
  );
};
