import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'UCL Draw', path: '/ucl-draw' },
    { name: 'FPL Optimizer', path: '/fpl-optimizer' },
  ];

  return (
    <nav className="relative z-50 flex items-center justify-between px-8 py-6 border-b border-white/5 bg-white/5 backdrop-blur-xl shadow-xl">
      <Link to="/" className="group">
        <motion.div 
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <span className="font-clash text-xl font-bold tracking-[0.2em] text-white group-hover:text-mint-sentinel transition-colors">
            DUAL-ENGINE
          </span>
          <span className="w-2 h-2 rounded-full bg-mint-sentinel animate-pulse" />
        </motion.div>
      </Link>

      <div className="flex gap-8">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link 
              key={link.path}
              to={link.path}
              className="relative group"
            >
              <span className={`font-space text-xs uppercase tracking-widest transition-colors ${
                isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'
              }`}>
                {link.name}
              </span>
              {isActive && (
                <motion.div 
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-[1px] bg-mint-sentinel"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;
