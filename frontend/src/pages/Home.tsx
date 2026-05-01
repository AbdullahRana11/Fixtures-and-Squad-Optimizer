import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [hoveredPanel, setHoveredPanel] = React.useState<'fixtures' | 'squad' | null>(null);

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-black text-zinc-200 overflow-hidden">
      
      {/* Left Area - Fixtures */}
      <motion.div 
        className="relative flex flex-col justify-center p-12 lg:p-24 border-b lg:border-b-0 cursor-pointer group transition-colors duration-500 overflow-hidden"
        onClick={() => navigate('/fixtures')}
        onMouseEnter={() => setHoveredPanel('fixtures')}
        onMouseLeave={() => setHoveredPanel(null)}
        initial={{ opacity: 0, width: "60%" }}
        animate={{ 
          opacity: 1, 
          width: hoveredPanel === 'fixtures' ? "80%" : hoveredPanel === 'squad' ? "20%" : "60%" 
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 bg-[url('/fixtures_bg.png')] bg-cover bg-center opacity-5 grayscale invert brightness-50 group-hover:opacity-15 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-95 group-hover:opacity-90 transition-opacity duration-700" />
        
        <div className="relative z-10 max-w-2xl min-w-[300px]">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors duration-500">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-zinc-600">Scheduling Engine</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
            className="text-5xl lg:text-7xl font-merriweather font-bold text-white mb-6 leading-tight whitespace-nowrap"
          >
            Fixture &<br />
            Tournament Intelligence
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, x: -100 }}
            animate={{ 
              opacity: hoveredPanel === 'squad' ? 0 : 1, 
              x: hoveredPanel === 'squad' ? -50 : 0 
            }}
            transition={{ duration: 0.4 }}
            className="text-lg font-open text-zinc-500 mb-12 max-w-lg leading-relaxed"
          >
            Plan, schedule, and optimize matchdays with precision. Our advanced engine handles complex constraints to deliver perfectly balanced tournament structures.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex items-center gap-4 text-emerald-500 font-semibold group-hover:gap-6 transition-all duration-300"
          >
            <span>Explore Fixtures</span>
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.div>

      {/* Right Area - Squads */}
      <motion.div 
        className="relative flex flex-col justify-center p-12 lg:p-20 cursor-pointer group transition-colors duration-500 bg-black/50 overflow-hidden"
        onClick={() => navigate('/fpl')}
        onMouseEnter={() => setHoveredPanel('squad')}
        onMouseLeave={() => setHoveredPanel(null)}
        initial={{ opacity: 0, width: "40%" }}
        animate={{ 
          opacity: 1, 
          width: hoveredPanel === 'squad' ? "80%" : hoveredPanel === 'fixtures' ? "20%" : "40%" 
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="absolute inset-0 bg-[url('/squad_bg.png')] bg-cover bg-center opacity-5 grayscale invert brightness-50 group-hover:opacity-10 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-95 group-hover:opacity-90 transition-opacity duration-700" />
        
        {/* Soft edge blend for desktop */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none hidden lg:block" />

        <div className="relative z-20 max-w-xl min-w-[300px]">
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex items-center gap-3 mb-8"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-zinc-500">Squad Builder</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.7 }}
            className="text-4xl lg:text-5xl font-merriweather font-bold text-white mb-6 leading-tight whitespace-nowrap"
          >
            Fantasy Squad Optimizer
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 100 }}
            animate={{ 
              opacity: hoveredPanel === 'fixtures' ? 0 : 1, 
              y: hoveredPanel === 'fixtures' ? 50 : 0 
            }}
            transition={{ duration: 0.4 }}
            className="text-base font-open text-zinc-400 mb-12 max-w-md leading-relaxed"
          >
            Construct the ultimate 15-man roster. Utilize deep statistical analysis and budget constraints to maximize your squad's potential.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, x: 50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex items-center gap-4 text-amber-500 font-semibold group-hover:gap-6 transition-all duration-300"
          >
            <span>Build Your Squad</span>
            <ArrowRight className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.div>

    </div>
  );
};

export default Home;
