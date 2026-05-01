import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Import futuristic ReactBits components
import Hyperspeed from '../components/reactbits/Hyperspeed';
import GridScan from '../components/reactbits/GridScan';
import TiltedCard from '../components/reactbits/TiltedCard';
import DecryptedText from '../components/reactbits/DecryptedText';

const Home: React.FC = () => {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null);
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-screen overflow-hidden flex bg-black text-left">
      {/* Dynamic 3D Background Layer */}
      <div className="absolute inset-0 z-0">
        <Hyperspeed />
      </div>
      
      {/* Tactical Grid Scan Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <GridScan color={hoveredSide === 'right' ? "#10b981" : "#0ea5e9"} scanSpeed={1.2} />
      </div>
      
      {/* Left Half - Fixture Generator (Blue/Cyan Theme) */}
      <div
        className="h-full relative cursor-pointer group flex flex-col justify-center items-center text-center px-12 border-r border-cyan-500/20 w-1/2 overflow-hidden z-10"
        onMouseEnter={() => setHoveredSide('left')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => navigate('/fixtures')}
      >
        <div className="absolute inset-0 bg-[#090A0F]/70 z-0 group-hover:bg-[#090A0F]/40 transition-colors duration-500 backdrop-blur-sm" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/40 via-cyan-500/10 to-transparent mix-blend-screen z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        
        <TiltedCard maxTilt={10} glareColor="rgba(34, 211, 238, 0.4)" className="w-full max-w-lg z-10">
          <div className="relative flex flex-col items-center bg-black/40 p-10 rounded-3xl border border-cyan-500/30 backdrop-blur-md shadow-2xl group-hover:border-cyan-400/60 transition-colors duration-500">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-400/50 mb-8 shadow-[0_0_20px_rgba(34,211,238,0.5)] group-hover:shadow-[0_0_40px_rgba(34,211,238,0.8)] transition-shadow duration-500"
            >
               <span className="text-2xl text-cyan-300 font-bold">01</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 uppercase tracking-[0.1em] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-tight">
              <DecryptedText text="Fixture" animateOn="hover" speed={60} maxIterations={15} className="text-white" encryptedClassName="text-cyan-500" />
              <br/>
              <span className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.6)]">
                <DecryptedText text="Generator" animateOn="hover" speed={60} maxIterations={15} className="text-cyan-400" encryptedClassName="text-white" />
              </span>
            </h2>
            
            <p className="font-sans font-medium text-cyan-50 text-lg bg-black/50 p-6 rounded-2xl border border-cyan-500/20">
              Navigate temporal conflicts. Generate a perfect multi-competition season with the CSP Master Scheduler.
            </p>

            <button className="mt-8 px-10 py-4 rounded-full bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.7)] transition-all duration-300">
              Launch Engine
            </button>
          </div>
        </TiltedCard>
      </div>

      {/* Right Half - Squad Optimizer (Green Theme) */}
      <div
        className="h-full relative cursor-pointer group flex flex-col justify-center items-center text-center px-12 w-1/2 overflow-hidden z-10"
        onMouseEnter={() => setHoveredSide('right')}
        onMouseLeave={() => setHoveredSide(null)}
        onClick={() => navigate('/fpl')}
      >
        <div className="absolute inset-0 bg-[#090A0F]/70 z-0 group-hover:bg-[#090A0F]/40 transition-colors duration-500 backdrop-blur-sm" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-emerald-500/10 to-transparent mix-blend-screen z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        <TiltedCard maxTilt={10} glareColor="rgba(52, 211, 153, 0.4)" className="w-full max-w-lg z-10">
          <div className="relative flex flex-col items-center bg-black/40 p-10 rounded-3xl border border-emerald-500/30 backdrop-blur-md shadow-2xl group-hover:border-emerald-400/60 transition-colors duration-500">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/50 mb-8 shadow-[0_0_20px_rgba(52,211,153,0.5)] group-hover:shadow-[0_0_40px_rgba(52,211,153,0.8)] transition-shadow duration-500"
            >
               <span className="text-2xl text-emerald-400 font-bold">02</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 uppercase tracking-[0.1em] drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)] leading-tight">
              <DecryptedText text="Squad" animateOn="hover" speed={60} maxIterations={15} className="text-white" encryptedClassName="text-emerald-500" />
              <br/>
              <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.6)]">
                <DecryptedText text="Optimizer" animateOn="hover" speed={60} maxIterations={15} className="text-emerald-400" encryptedClassName="text-white" />
              </span>
            </h2>
            
            <p className="font-sans font-medium text-emerald-50 text-lg bg-black/50 p-6 rounded-2xl border border-emerald-500/20">
              Leverage dynamic knapsack metrics. Build the mathematically optimal 15-man squad constrained by logic.
            </p>
            
            <button className="mt-8 px-10 py-4 rounded-full bg-emerald-500 text-black font-bold uppercase tracking-widest hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.7)] transition-all duration-300">
              Launch Engine
            </button>
          </div>
        </TiltedCard>
      </div>
    </div>
  );
};

export default Home;
