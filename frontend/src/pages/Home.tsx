import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-void text-zinc-200">
      
      {/* Left Area - 60% Width - Fixtures */}
      <motion.div 
        className="lg:w-[60%] relative flex flex-col justify-center p-12 lg:p-24 border-b lg:border-b-0 cursor-pointer group transition-colors duration-500 overflow-hidden"
        onClick={() => navigate('/fixtures')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-[url('/fixtures_bg.png')] bg-cover bg-center opacity-10 mix-blend-screen group-hover:opacity-25 group-hover:scale-105 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-void to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-700" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors duration-500">
              <Calendar className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-zinc-500">Scheduling Engine</span>
          </div>

          <h2 className="text-5xl lg:text-7xl font-merriweather font-bold text-white mb-6 leading-tight">
            Fixture &<br />
            Tournament Intelligence
          </h2>

          <p className="text-lg font-open text-zinc-400 mb-12 max-w-lg leading-relaxed">
            Plan, schedule, and optimize matchdays with precision. Our advanced engine handles complex constraints to deliver perfectly balanced tournament structures.
          </p>

          <div className="flex items-center gap-4 text-teal-500 font-semibold group-hover:gap-6 transition-all duration-300">
            <span>Explore Fixtures</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

      {/* Right Area - 40% Width - Squads */}
      <motion.div 
        className="lg:w-[40%] relative flex flex-col justify-center p-12 lg:p-20 cursor-pointer group transition-colors duration-500 bg-zinc-950/30 overflow-hidden"
        onClick={() => navigate('/fpl')}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="absolute inset-0 bg-[url('/squad_bg.png')] bg-cover bg-center opacity-10 mix-blend-screen group-hover:opacity-20 group-hover:scale-105 transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent opacity-90 group-hover:opacity-80 transition-opacity duration-700" />
        
        {/* Soft edge blend for desktop */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-void to-transparent z-10 pointer-events-none hidden lg:block" />

        <div className="relative z-20 max-w-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-zinc-500">Squad Builder</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-merriweather font-bold text-white mb-6 leading-tight">
            Fantasy Squad Optimizer
          </h2>

          <p className="text-base font-open text-zinc-400 mb-12 max-w-md leading-relaxed">
            Construct the ultimate 15-man roster. Utilize deep statistical analysis and budget constraints to maximize your squad's potential.
          </p>

          <div className="flex items-center gap-4 text-amber-500 font-semibold group-hover:gap-6 transition-all duration-300">
            <span>Build Your Squad</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </motion.div>

    </div>
  );
};

export default Home;
