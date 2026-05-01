import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  History as HistoryIcon, ArrowLeft, ChevronRight,
  Trophy, Globe, Shield, Cpu
} from 'lucide-react';
import HistoryDrawer from '../components/HistoryDrawer';
import { HistoryEntry } from '../utils/fixtureUtils';

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
  shortName: string;
  bg: string;
  accent: string;           
  tag: string;              
  tier: 'S' | 'A' | 'B';   
  icon: React.ReactNode;
}

const competitions: Competition[] = [
  {
    id: 'pl',
    name: 'Premier League',
    shortName: 'PL',
    bg: plBg,
    accent: '#A020F0',
    tag: '20 CLUBS · 38 GAMEWEEKS',
    tier: 'S',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: 'ucl',
    name: 'Champions League',
    shortName: 'UCL',
    bg: uclBg,
    accent: '#0052FF',
    tag: '36 CLUBS · GROUP + KO',
    tier: 'S',
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    id: 'bundesliga',
    name: 'Bundesliga',
    shortName: 'BL',
    bg: bundesligaBg,
    accent: '#D3010C',
    tag: '18 CLUBS · 34 GAMEWEEKS',
    tier: 'A',
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: 'facup',
    name: 'FA Cup',
    shortName: 'FAC',
    bg: faCupBg,
    accent: '#7B0000',
    tag: 'KNOCKOUT · WEMBLEY FINAL',
    tier: 'A',
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    id: 'seriea',
    name: 'Serie A',
    shortName: 'SA',
    bg: serieABg,
    accent: '#008FD7',
    tag: '20 CLUBS · 38 GAMEWEEKS',
    tier: 'A',
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: 'laliga',
    name: 'La Liga',
    shortName: 'LL',
    bg: laLigaBg,
    accent: '#FF4B00',
    tag: '20 CLUBS · 38 GAMEWEEKS',
    tier: 'A',
    icon: <Globe className="w-4 h-4" />,
  },
  {
    id: 'custom',
    name: 'Custom Engine',
    shortName: 'CX',
    bg: customBg,
    accent: '#10b981',
    tag: 'UNLIMITED · ALL FORMATS',
    tier: 'S',
    icon: <Cpu className="w-4 h-4" />,
  },
];

// ─── Single Competition Card ────────────────────────────────────────────────
const CompetitionCard: React.FC<{
  comp: Competition;
  index: number;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  navigate: ReturnType<typeof useNavigate>;
}> = ({ comp, index, hoveredId, setHoveredId, navigate }) => {
  const isHovered = hoveredId === comp.id;
  const isDimmed = hoveredId !== null && !isHovered;

  const handleClick = () => {
    if (comp.id === 'custom') navigate('/fixtures/custom');
    else navigate(`/fixtures/select?league=${comp.id}`);
  };

  const tierColor = comp.tier === 'S'
    ? 'text-amber-500 bg-amber-500/10'
    : comp.tier === 'A'
    ? 'text-teal-500 bg-teal-500/10'
    : 'text-zinc-400 bg-zinc-800';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="relative w-full md:w-1/2 lg:w-1/3 h-[400px] p-4"
    >
      <div
        className={`w-full h-full relative rounded-2xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
          isHovered ? 'border-teal-500 shadow-lg shadow-teal-500/10' : 'border-zinc-800'
        }`}
        onMouseEnter={() => setHoveredId(comp.id)}
        onMouseLeave={() => setHoveredId(null)}
        onClick={handleClick}
        style={{
          filter: isDimmed ? 'grayscale(80%) opacity(0.5)' : 'grayscale(0%) opacity(1)'
        }}
      >
        {/* BG image */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-700"
          style={{
            backgroundImage: `url(${comp.bg})`,
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-900/80 to-zinc-900/40 transition-opacity duration-300" />

        <div className="absolute inset-0 z-20 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className={`text-xs font-bold px-2 py-1 rounded tracking-wider ${tierColor}`}>
              {comp.tier} TIER
            </span>
            <div className={`p-2 rounded-lg bg-zinc-900/80 border border-zinc-700 text-zinc-300`}>
                {comp.icon}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2 font-open">
              {comp.shortName}
            </p>
            <h3 className="text-3xl font-merriweather font-bold text-white leading-tight mb-2">
              {comp.name}
            </h3>
            
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-700" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-open">
                {comp.tag}
              </span>
            </div>

            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="overflow-hidden"
                >
                  <button className="w-full py-3 rounded-lg bg-teal-600 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors">
                    Select Competition <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────
const CompetitionSelector: React.FC = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewHistory = (entry: HistoryEntry) => {
    if (entry.source === 'Custom') {
      alert(`Viewing: ${entry.name}. Matches: ${entry.fixtures.length}`);
    } else {
      navigate('/fixtures/display', {
        state: {
          schedule: { fixtures: entry.fixtures, league: entry.name, teams: entry.teams },
          leagueId: entry.source.toLowerCase().includes('premier') ? 'pl' : 'ucl',
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-void font-open relative overflow-hidden flex flex-col">
      <div className="absolute inset-0 z-0 opacity-5 bg-[url('/noise.svg')]" />

      {/* ── Top Nav Bar ── */}
      <header className="relative z-50 h-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md px-8 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </button>

        <h1 className="text-xl font-merriweather font-bold text-white tracking-wide absolute left-1/2 -tranzinc-x-1/2">
          Competition Matrix
        </h1>

        <button
          onClick={() => setHistoryOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-700 transition-colors text-sm font-semibold"
        >
          <HistoryIcon className="w-4 h-4" />
          History
        </button>
      </header>

      {/* ── Competition Grid ── */}
      <main className="flex-1 relative z-10 overflow-y-auto px-8 py-12">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-wrap -m-4">
            {competitions.map((comp, index) => (
              <CompetitionCard
                key={comp.id}
                comp={comp}
                index={index}
                hoveredId={hoveredId}
                setHoveredId={setHoveredId}
                navigate={navigate}
              />
            ))}
          </div>
        </div>
      </main>

      {/* ── History Drawer ── */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onView={handleViewHistory}
      />
    </div>
  );
};

export default CompetitionSelector;

