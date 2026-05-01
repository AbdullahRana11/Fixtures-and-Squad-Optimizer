import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const LoadingScreen: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Drafting your tournament...');

  useEffect(() => {
    const statuses = [
      'Drafting your tournament...',
      'Crunching the numbers...',
      'Analyzing team data...',
      'Optimizing schedules...',
      'Finalizing setup...'
    ];
    
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = Math.min(100, p + Math.floor(Math.random() * 8) + 2);
        setStatus(statuses[Math.floor((next / 100) * (statuses.length - 1))]);
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] bg-void flex flex-col items-center justify-center overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 opacity-5 bg-[url('/noise.svg')]" />
      
      <div className="relative z-10 flex flex-col items-center max-w-md w-full px-6">
        
        {/* Simple spinning indicator */}
        <div className="relative w-24 h-24 mb-12 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-zinc-800"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
          <div className="text-2xl font-bold font-clash text-white">{progress}%</div>
        </div>

        {/* Status Text */}
        <div className="text-center space-y-4 w-full">
          <h2 className="text-xl font-clash text-white/90">{status}</h2>
          
          {/* Clean Progress Bar */}
          <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-teal-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

