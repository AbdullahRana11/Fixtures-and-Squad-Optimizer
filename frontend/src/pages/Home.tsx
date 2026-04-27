import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import fixtureBg from '../assets/pics/Fixture_Generation.png';
import squadBg from '../assets/pics/Squad_Optimization.png';

const Home: React.FC = () => {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);
  const navigate = useNavigate();

  const getFilter = (side: 'left' | 'right') => {
    if (hoveredSide === null) return 'grayscale(30%) brightness(80%)';
    if (hoveredSide === side) return 'grayscale(0%) brightness(120%)';
    return 'grayscale(100%) brightness(40%)';
  };

  return (
    <div className="relative w-full h-screen overflow-hidden flex bg-void text-left">
      {/* Left Half - Fixture Generator (Blue Theme) */}
      <div
        className="h-full relative cursor-pointer group flex flex-col justify-center items-center text-center px-12 border-r border-cyan-500/20 w-1/2 overflow-hidden"
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => navigate('/fixtures')}
      >
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
          style={{ 
            backgroundImage: `url(${fixtureBg})`,
            filter: hoveredSide === 'right' ? 'grayscale(80%) brightness(0.3)' : 'none'
          }}
        />
        {/* Dark overlay block */}
        <div className="absolute inset-0 bg-[#090A0F]/60 z-0 group-hover:bg-[#090A0F]/20 transition-colors duration-500" />
        
        {/* Blue Accent Overlay - Lightful & Best */}
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 via-cyan-500/10 to-transparent mix-blend-screen z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/50 mb-8 shadow-[0_0_20px_rgba(34,211,238,0.5)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] transition-shadow duration-500"
          >
             <span className="text-2xl text-cyan-300 font-bold">01</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 uppercase tracking-[0.1em] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            Fixture<br/><span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">Generator</span>
          </h2>
          <p className="font-sans font-medium text-cyan-50 max-w-md text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 bg-black/50 p-6 rounded-2xl backdrop-blur-md border border-cyan-500/30">
            Navigate temporal conflicts. Generate a perfect multi-competition season with the CSP Master Scheduler.
          </p>

          <button className="mt-8 px-10 py-4 rounded-full bg-cyan-500 text-black font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.7)] hover:scale-105 active:scale-95">
            Launch Engine
          </button>
        </div>
      </div>

      {/* Right Half - Squad Optimizer (Green Theme) */}
      <div
        className="h-full relative cursor-pointer group flex flex-col justify-center items-center text-center px-12 w-1/2 overflow-hidden"
        onMouseEnter={() => setHoveredSide('right')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => navigate('/fpl')}
      >
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
          style={{ 
            backgroundImage: `url(${squadBg})`,
            filter: hoveredSide === 'left' ? 'grayscale(80%) brightness(0.3)' : 'none'
          }}
        />
        {/* Dark overlay block */}
        <div className="absolute inset-0 bg-[#090A0F]/60 z-0 group-hover:bg-[#090A0F]/20 transition-colors duration-500" />
        
        {/* Green Accent Overlay - Lightful & Best */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-emerald-500/10 to-transparent mix-blend-screen z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative z-10 flex flex-col items-center">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/50 mb-8 shadow-[0_0_20px_rgba(52,211,153,0.5)] group-hover:shadow-[0_0_40px_rgba(52,211,153,0.8)] transition-shadow duration-500"
          >
             <span className="text-2xl text-emerald-400 font-bold">02</span>
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-6 uppercase tracking-[0.1em] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
            Squad<br/><span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]">Optimizer</span>
          </h2>
          <p className="font-sans font-medium text-emerald-50 max-w-md text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 bg-black/50 p-6 rounded-2xl backdrop-blur-md border border-emerald-500/30">
            Leverage dynamic knapsack metrics. Build the mathematically optimal 15-man squad constrained by logic.
          </p>
          
          <button className="mt-8 px-10 py-4 rounded-full bg-emerald-500 text-black font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 delay-150 hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.7)] hover:scale-105 active:scale-95">
            Launch Engine
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
