import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, LayoutGrid, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div 
      className="flex-1 flex flex-col p-8 lg:p-16"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Hero Section */}
      <motion.div className="mb-20 space-y-6" variants={itemVariants}>
        <div className="flex items-center gap-3">
          <div className="h-[2px] w-12 bg-mint-sentinel" />
          <span className="font-space text-xs uppercase tracking-widest text-mint-sentinel">
            Dual-Engine Orchestrator
          </span>
        </div>
        <h1 className="text-5xl lg:text-7xl font-clash leading-tight max-w-[900px]">
          The Dual-Engine <br /> 
          <span className="text-mint-sentinel">Football Orchestrator</span>
        </h1>
        <p className="font-outfit text-xl text-white/50 max-w-[700px] leading-relaxed">
          Constraint Satisfaction meets Knapsack Optimization. Two algorithmic engines, one mathematical stage. Built for high-stakes football decision architecture.
        </p>
      </motion.div>

      {/* Engine Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
        {/* UCL Engine Card */}
        <motion.div 
          className="glass-card group p-8 flex flex-col justify-between min-h-[400px] hover:border-neon-aqua/30 transition-all duration-500"
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-neon-aqua/50 transition-colors">
              <Trophy className="w-8 h-8 text-neon-aqua" />
            </div>
            <h2 className="text-3xl font-clash">UCL Draw Engine</h2>
            <p className="font-outfit text-white/40 leading-relaxed">
              A Constraint Satisfaction Problem engine that guarantees a valid Round of 16 draw without dead-ends. 
              Forward-checking and bipartite matching prevent illegal matchups in real-time.
            </p>
          </div>
          <Link to="/ucl-draw" className="action-button self-start flex items-center gap-2 group/btn">
            Launch Engine
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </motion.div>

        {/* FPL Engine Card */}
        <motion.div 
          className="glass-card group p-8 flex flex-col justify-between min-h-[400px] hover:border-mint-sentinel/30 transition-all duration-500"
          variants={itemVariants}
          whileHover={{ y: -5 }}
        >
          <div className="space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-mint-sentinel/50 transition-colors">
              <LayoutGrid className="w-8 h-8 text-mint-sentinel" />
            </div>
            <h2 className="text-3xl font-clash">FPL Squad Optimizer</h2>
            <p className="font-outfit text-white/40 leading-relaxed">
              A multi-dimensional 0/1 Knapsack solver using Branch and Bound. 
              Finds the mathematically optimal 15-man squad under complex budget, position, and club constraints.
            </p>
          </div>
          <Link to="/fpl-optimizer" className="action-button self-start flex items-center gap-2 group/btn">
            Launch Engine
            <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
          </Link>
        </motion.div>
      </div>

      {/* Tech Stack Bar */}
      <motion.div 
        className="mt-auto pt-16 flex flex-wrap gap-8 items-center border-t border-white/5"
        variants={itemVariants}
      >
        <span className="telemetry-label">Architecture:</span>
        <div className="flex gap-4">
          {['React 18', 'Vite 5', 'Tailwind CSS', 'Framer Motion', 'TypeScript 5', 'Prisma', 'MySQL'].map(tech => (
            <div key={tech} className="px-3 py-1 rounded border border-white/5 bg-white/5 font-space text-[10px] text-white/40 uppercase tracking-widest">
              {tech}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Home;
