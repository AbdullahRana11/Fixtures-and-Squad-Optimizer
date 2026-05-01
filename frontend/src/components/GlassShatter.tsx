import React from 'react';
import { motion } from 'framer-motion';

interface Shard {
  id: number;
  clipPath: string;
  x: number;
  y: number;
  rotate: number;
  scale: number;
  delay: number;
}

const generateShards = (count: number): Shard[] => {
  return Array.from({ length: count }).map((_, i) => {
    // Random triangular/polygonal shapes
    const p1 = [Math.random() * 100, Math.random() * 100];
    const p2 = [Math.random() * 100, Math.random() * 100];
    const p3 = [Math.random() * 100, Math.random() * 100];
    
    return {
      id: i,
      clipPath: `polygon(${p1[0]}% ${p1[1]}%, ${p2[0]}% ${p2[1]}%, ${p3[0]}% ${p3[1]}%)`,
      x: (Math.random() - 0.5) * 800, // Explode outward
      y: (Math.random() - 0.5) * 800,
      rotate: (Math.random() - 0.5) * 720,
      scale: Math.random() * 0.5 + 0.2,
      delay: Math.random() * 0.1,
    };
  });
};

interface GlassShatterProps {
  onComplete?: () => void;
}

const GlassShatter: React.FC<GlassShatterProps> = ({ onComplete }) => {
  const shards = React.useMemo(() => generateShards(24), []);

  return (
    <div className="absolute inset-0 z-[100] pointer-events-none overflow-visible">
      {shards.map((shard) => (
        <motion.div
          key={shard.id}
          initial={{ 
            opacity: 1, 
            scale: 1, 
            x: 0, 
            y: 0, 
            rotate: 0,
            clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' 
          }}
          animate={{ 
            opacity: 0, 
            scale: shard.scale, 
            x: shard.x, 
            y: shard.y, 
            rotate: shard.rotate,
            clipPath: shard.clipPath 
          }}
          transition={{ 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1], // Custom cubic-bezier for "explosive" feel
            delay: shard.delay 
          }}
          onAnimationComplete={() => shard.id === 0 && onComplete?.()}
          className="absolute inset-0 bg-white/20 backdrop-blur-md border border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        />
      ))}
    </div>
  );
};

export default GlassShatter;
