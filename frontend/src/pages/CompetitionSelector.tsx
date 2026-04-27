import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, ArrowLeft } from 'lucide-react';
import HistoryDrawer from '../components/HistoryDrawer';
import { HistoryEntry } from '../utils/fixtureUtils';
 
// Tactical UI Components
import GridScan from '../components/reactbits/GridScan';
import DecryptedText from '../components/reactbits/DecryptedText';

// Asset Imports
import plBg from '../assets/pics/Premier-League.png';
import laLigaBg from '../assets/pics/La Liga.png';
import serieABg from '../assets/pics/Serie A.png';
import bundesligaBg from '../assets/pics/Bundesliga.png';
import uclBg from '../assets/pics/Champions-League.png';
import faCupBg from '../assets/pics/FA Cup.png';
import customBg from '../assets/pics/Custom.png';

interface Competition {
  id: string;
  name: string;
  bg: string;
  color: string;
  lighting: string;
}

const competitions: Competition[] = [
  { id: 'pl', name: 'Premier League', bg: plBg, color: 'text-[#3D195B]', lighting: 'rgba(160, 32, 240, 0.6)' },
  { id: 'ucl', name: 'Champions League', bg: uclBg, color: 'text-[#003399]', lighting: 'rgba(0, 82, 255, 0.6)' },
  { id: 'bundesliga', name: 'Bundesliga', bg: bundesligaBg, color: 'text-[#D3010C]', lighting: 'rgba(211, 1, 12, 0.6)' },
  { id: 'facup', name: 'FA Cup', bg: faCupBg, color: 'text-[#7B0000]', lighting: 'rgba(123, 0, 0, 0.6)' },
  { id: 'seriea', name: 'Serie A', bg: serieABg, color: 'text-[#008FD7]', lighting: 'rgba(0, 143, 215, 0.6)' },
  { id: 'laliga', name: 'La Liga', bg: laLigaBg, color: 'text-[#FF4B00]', lighting: 'rgba(255, 75, 0, 0.6)' },
  { id: 'custom', name: 'Custom', bg: customBg, color: 'text-emerald-500', lighting: 'rgba(0, 50, 20, 0.7)' },
];

const CompetitionSelector: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewHistory = (entry: HistoryEntry) => {
    // Navigate to local display or custom generator with the history data
    // For simplicity, we can reuse FixtureDisplay for league data 
    // and CustomGenerator for custom data
    if (entry.source === 'Custom') {
       // We'd need to update CustomGenerator to take initial data
       // For now, let's just log or implement a quick preview
       alert(`Viewing: ${entry.name}. Matches: ${entry.fixtures.length}`);
    } else {
       navigate('/fixtures/display', { state: { schedule: { fixtures: entry.fixtures, league: entry.name, teams: entry.teams }, leagueId: entry.source.toLowerCase().includes('premier') ? 'pl' : 'ucl' } });
    }
  };

  return (
    <div className="relative w-full h-screen overflow-y-auto flex flex-wrap justify-center bg-void">
      {/* Competitions Map ... */}
      {competitions.map((comp) => {
        const isHovered = hoveredId === comp.id;
        const isDimmed = hoveredId !== null && !isHovered;

        return (
          <motion.div
            key={comp.id}
            className="relative w-full md:w-1/3 h-1/2 cursor-pointer group overflow-hidden border border-white/5"
            onMouseEnter={() => setHoveredId(comp.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => {
              if (comp.id === 'custom') {
                navigate('/fixtures/custom');
              } else {
                navigate(`/fixtures/select?league=${comp.id}`);
              }
            }}
          >
            {/* ... Background and Glow code ... */}
            {/* Background Image */}
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-700"
              style={{ 
                backgroundImage: `url(${comp.bg})`,
                filter: isDimmed ? 'grayscale(100%) brightness(0.2)' : 'grayscale(0%) brightness(0.7)'
              }}
            />

            {/* Default Dark Overlay */}
            <div className="absolute inset-0 bg-black/40 z-0 transition-colors duration-500 group-hover:bg-transparent" />

            {/* Dynamic Lighting Overlay */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10 mix-blend-screen"
                  style={{ 
                    background: `radial-gradient(circle at center, ${comp.lighting}, transparent 80%)`,
                    boxShadow: `inset 0 0 100px ${comp.lighting}`
                  }}
                />
              )}
            </AnimatePresence>

            {/* Tactical League Title Overlay */}
            <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none p-12">
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="text-center"
                  >
                    <DecryptedText
                      text={comp.name.toUpperCase()}
                      className="text-5xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                      animateOn="view"
                      revealDirection="center"
                    />
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <div className="h-[1px] w-12 bg-white/20" />
                      <span className="text-[10px] font-mono tracking-[0.5em] text-white/40">SELECT COMPETITION</span>
                      <div className="h-[1px] w-12 bg-white/20" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom Glow Bar */}
            {isHovered && (
              <motion.div 
                layoutId="glowBar"
                className="absolute bottom-0 left-0 right-0 h-1 z-30"
                style={{ backgroundColor: comp.lighting.replace('0.6', '1') }}
              />
            )}
          </motion.div>
        );
      })}
      
      {/* Tactical Background Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <GridScan color="#10b981" />
      </div>

      {/* History Button Shortcut */}
      <button 
        onClick={() => setHistoryOpen(true)}
        className="absolute top-8 right-8 z-50 flex items-center gap-3 px-8 py-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl text-white/40 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all uppercase text-[9px] tracking-[0.3em] font-black font-mono shadow-2xl group"
      >
        <HistoryIcon className="w-4 h-4 text-emerald-500 transition-transform group-hover:rotate-12" />
        Archive Data
      </button>
      
      {/* Home Button Shortcut */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 z-50 flex items-center gap-3 px-8 py-3 rounded-full border border-white/10 bg-black/60 backdrop-blur-2xl text-white/40 hover:text-white hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all uppercase text-[9px] tracking-[0.3em] font-black font-mono shadow-2xl group"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-500 transition-transform group-hover:-translate-x-1" />
        Return Home
      </button>

      {/* History Drawer */}
      <HistoryDrawer 
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onView={handleViewHistory}
      />
    </div>
  );
};

export default CompetitionSelector;
