import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FOOTBALL_MESSAGES = [
  "INITIALIZING CONSTRAINT SOLVER...",
  "EXTRACTING TEAM PROFILES...",
  "BUILDING BERGER TABLES...",
  "RESOLVING POLICING CONFLICTS...",
  "BALANCING HOME/AWAY STREAKS...",
  "INJECTING BROADCAST SLOTS...",
  "OPTIMIZING TRAVEL DISTANCES...",
  "VERIFYING FIFA CALENDAR...",
  "FINALIZING SEASON SCHEDULE...",
];

const CRICKET_MESSAGES = [
  "ANALYZING PITCH CONDITIONS...",
  "SYNCHRONIZING TOSS PROBABILITY...",
  "ESTIMATING DLS TARGETS...",
  "CALCULATING RUN-RATE TRAJECTORIES...",
  "OPTIMIZING BOWLING ROTATIONS...",
  "MAPPING FIELDING POSITIONS...",
  "INJECTING STRATEGIC TIMEOUTS...",
  "VERIFYING ICC COMPLIANCE...",
  "FINALIZING TOURNAMENT FIXTURES...",
];

export const GenerationLoadingOverlay: React.FC<{ isVisible: boolean; league?: string; sport?: string }> = ({ isVisible, league, sport }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  const isCricket = sport === 'cricket' || league?.toLowerCase().includes('ipl') || league?.toLowerCase().includes('psl');
  const messages = isCricket ? CRICKET_MESSAGES : FOOTBALL_MESSAGES;

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 900);
    return () => clearInterval(interval);
  }, [isVisible, messages.length]);

  const accentColor = isCricket ? '#FFB800' : '#10b981'; // Gold for cricket, Emerald for football
  const sportIcon = isCricket ? '🏏' : '⚽';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 backdrop-blur-2xl"
        >
          {/* Animated Background Nodes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
            {Array.from({ length: 30 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * 100 + "%", 
                  y: Math.random() * 100 + "%",
                  opacity: Math.random() * 0.5 + 0.2
                }}
                animate={{ 
                  y: [null, "-10%"],
                  opacity: [null, 0]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 4, 
                  repeat: Infinity, 
                  ease: "linear",
                  delay: Math.random() * 5
                }}
                className="absolute w-px h-12 bg-gradient-to-t from-transparent via-current to-transparent"
                style={{ color: accentColor }}
              />
            ))}
          </div>

          {/* Central Spinner / Hexagon */}
          <div className="relative mb-12">
            {/* Outer Glow */}
            <motion.div
              className="absolute inset-0 rounded-full blur-3xl opacity-20"
              style={{ backgroundColor: accentColor }}
              animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="w-40 h-40 border-t-2 border-r-2 rounded-full flex items-center justify-center"
              style={{ borderColor: `${accentColor}40`, borderTopColor: accentColor }}
            >
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-b-2 border-l-2 rounded-full flex items-center justify-center"
                style={{ borderColor: `${accentColor}20`, borderBottomColor: accentColor }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-24 h-24 border-t-2 rounded-full border-dashed"
                  style={{ borderTopColor: `${accentColor}80` }}
                />
              </motion.div>
            </motion.div>
            
            <motion.div
              animate={{ 
                scale: [0.9, 1.1, 0.9],
                filter: [`drop-shadow(0 0 5px ${accentColor}40)`, `drop-shadow(0 0 20px ${accentColor}80)`, `drop-shadow(0 0 5px ${accentColor}40)`]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <span className="text-5xl mb-2 select-none">{sportIcon}</span>
            </motion.div>
          </div>

          {/* Telemetry Text */}
          <div className="text-center font-mono space-y-3 z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ color: accentColor }} />
              <span className="text-[10px] text-gray-500 uppercase tracking-[0.4em]">Processing Neural Constraints</span>
              <div className="w-1 h-1 rounded-full bg-current animate-pulse" style={{ color: accentColor }} />
            </div>
            
            <motion.h2 
              key={msgIndex}
              initial={{ y: 5, opacity: 0, filter: 'blur(5px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              className="text-xl tracking-[0.2em] font-black uppercase italic"
              style={{ 
                color: accentColor,
                textShadow: `0 0 20px ${accentColor}40`
              }}
            >
              {messages[msgIndex]}
            </motion.h2>
            
            <div className="flex flex-col items-center">
              <p className="text-zinc-600 text-[8px] tracking-[0.6em] font-bold uppercase mt-2">
                COMMAND CENTER · {isCricket ? 'CRICKET' : 'FIXTURE'} CORE V3.1
              </p>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-4 h-[2px] bg-zinc-800"
                    animate={{ backgroundColor: ["#1f2937", accentColor, "#1f2937"] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bar Container */}
          <div className="mt-16 relative">
             <div className="w-80 h-[1px] bg-zinc-900 overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="w-1/2 h-full"
                style={{ 
                  background: `linear-gradient(to right, transparent, ${accentColor}, transparent)` 
                }}
              />
            </div>
            <div className="absolute top-2 left-0 right-0 flex justify-between font-mono text-[7px] text-zinc-700 uppercase tracking-widest">
              <span>0%</span>
              <span className="animate-pulse">Optimizing...</span>
              <span>100%</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
