import React from 'react';
import { motion } from 'framer-motion';

export const AnimatedBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-void">
      {/* Animated CSS fallback in case video fails to load or is blocked */}
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, var(--primary) 0%, transparent 60%)',
          filter: 'blur(100px)'
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ 
          duration: 10, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
      />

      {/* Lightweight background video loop */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-5"
      >
        {/* Abstract dark tech loop */}
        <source src="https://assets.codepen.io/3364143/7btrrd.mp4" type="video/mp4" />
      </video>


      {/* Vignette and scan lines */}
      <div className="absolute inset-0 bg-void-vignette opacity-70" />
      <div className="absolute inset-0 bg-scan-line opacity-20" style={{ backgroundSize: '100% 4px' }} />
    </div>
  );
};



