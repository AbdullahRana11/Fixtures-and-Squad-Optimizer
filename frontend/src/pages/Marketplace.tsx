import React, { useState, useMemo } from 'react';
import PlayerCard from "../components/PlayerCard";
import { useFplStore } from '../store/fplStore';
import logo from "../assets/pics/PSL-logo.png";
import { Search, ShoppingCart, Zap } from 'lucide-react';

// Tactical UI Components
import Hyperspeed from '../components/reactbits/Hyperspeed';
import GridScan from '../components/reactbits/GridScan';
import DecryptedText from '../components/reactbits/DecryptedText';
import TiltedCard from '../components/reactbits/TiltedCard';

import arsLogo from "../assets/pics/EPL Logos/arsenal.football-logos.cc.png";
import avlLogo from "../assets/pics/EPL Logos/aston-villa.football-logos.cc.png";
import bhaLogo from "../assets/pics/EPL Logos/brighton.football-logos.cc.png";
import cheLogo from "../assets/pics/EPL Logos/chelsea.football-logos.cc.png";
import eveLogo from "../assets/pics/EPL Logos/everton.football-logos.cc.png";
import livLogo from "../assets/pics/EPL Logos/liverpool.football-logos.cc.png";
import mciLogo from "../assets/pics/EPL Logos/manchester-city.football-logos.cc.png";
import munLogo from "../assets/pics/EPL Logos/manchester-united.football-logos.cc.png";
import newLogo from "../assets/pics/EPL Logos/newcastle.football-logos.cc.png";
import totLogo from "../assets/pics/EPL Logos/tottenham.football-logos.cc.png";
import whuLogo from "../assets/pics/EPL Logos/west-ham.football-logos.cc.png";
import wolLogo from "../assets/pics/EPL Logos/wolves.football-logos.cc.png";

const teamFilters = [
  { id: "ARS", logo: arsLogo, name: "Arsenal" },
  { id: "AVL", logo: avlLogo, name: "Aston Villa" },
  { id: "BHA", logo: bhaLogo, name: "Brighton" },
  { id: "CHE", logo: cheLogo, name: "Chelsea" },
  { id: "EVE", logo: eveLogo, name: "Everton" },
  { id: "LIV", logo: livLogo, name: "Liverpool" },
  { id: "MCI", logo: mciLogo, name: "Man City" },
  { id: "MUN", logo: munLogo, name: "Man Utd" },
  { id: "NEW", logo: newLogo, name: "Newcastle" },
  { id: "TOT", logo: totLogo, name: "Tottenham" },
  { id: "WHU", logo: whuLogo, name: "West Ham" },
  { id: "WOL", logo: wolLogo, name: "Wolves" },
];

function FilterPanel({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <section className="rounded-[32px] border border-white/5 bg-black/60 p-8 backdrop-blur-3xl shadow-2xl mb-6">
      <h3 className="mb-6 inline-block text-[9px] font-black uppercase tracking-[0.4em] text-white/30 font-mono">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function Marketplace() {
  const { allPlayers } = useFplStore();
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [filterPos, setFilterPos] = useState<string | null>(null);
  const [sortBy] = useState<'value' | 'cost' | 'points' | null>('value');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!allPlayers) return [];
    let list = [...allPlayers];
    if (filterTeam) list = list.filter(p => p.club === filterTeam || (p.club && p.club.includes(filterTeam)));
    if (filterPos) list = list.filter(p => p.position === filterPos);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (sortBy === 'value') list.sort((a,b) => (Number((b as any).dynamicValue || b.points || 0)) - (Number((a as any).dynamicValue || a.points || 0)));
    if (sortBy === 'cost') list.sort((a,b) => Number(b.cost_millions || 0) - Number(a.cost_millions || 0));
    if (sortBy === 'points') list.sort((a,b) => (b.points || 0) - (a.points || 0));

    return list.slice(0, 32); 
  }, [allPlayers, filterTeam, filterPos, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-[#030408] text-white relative overflow-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <Hyperspeed 
          effectOptions={{
            distortion: 'turbulentDistortion',
            speedUp: 2,
            colors: {
              roadColor: 0x080808,
              islandColor: 0x0a0a0a,
              background: 0x000000,
              shoulderLines: 0xffffff,
              brokenLines: 0xffffff,
              leftCars: [0xf59e0b, 0xd97706, 0xb45309],
              rightCars: [0xf59e0b, 0xd97706, 0xb45309],
              sticks: 0xf59e0b
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030408]/80 via-[#030408]/40 to-[#030408]/90 pointer-events-none" />
        <GridScan 
          color="#f59e0b" 
        />
      </div>
      
      <div className="relative z-10 grid gap-12 lg:grid-cols-[340px_1fr] max-w-[2400px] mx-auto p-8 md:p-16 lg:p-20">
        <aside className="space-y-6">
          <div className="p-10 rounded-[50px] bg-gradient-to-br from-amber-900/20 to-black/80 border border-amber-500/10 mb-10 shadow-3xl text-center">
             <div className="flex items-center justify-center gap-4 mb-4">
                <ShoppingCart className="w-8 h-8 text-amber-500" />
                <span className="text-[12px] font-black text-amber-500 uppercase tracking-[0.4em]">Exchange</span>
             </div>
             <p className="text-3xl font-black text-white italic tracking-tighter leading-none">TRANSFER HUB <span className="text-amber-400">OPEN</span></p>
          </div>

          <FilterPanel title="OFFICIAL CLUBS">
             <div className="grid grid-cols-3 gap-5">
               {teamFilters.map(team => (
                 <button 
                   key={team.id}
                   onClick={() => setFilterTeam(filterTeam === team.id ? null : team.id)}
                   className={`flex h-16 items-center justify-center rounded-2xl border transition-all hover:rotate-6 active:scale-90 ${filterTeam === team.id ? 'border-amber-400 bg-amber-400/20 shadow-glow' : 'border-white/5 bg-black/60 p-3'}`}
                 >
                   <img src={team.logo} alt={team.id} className="h-full w-full object-contain" />
                 </button>
               ))}
             </div>
          </FilterPanel>

          <FilterPanel title="MARKET POSITIONS">
            <div className="grid grid-cols-2 gap-4">
              {['FWD', 'MID', 'DEF', 'GK'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(filterPos === pos ? null : pos)}
                  className={`py-5 rounded-2xl text-[10px] font-black tracking-[0.3em] transition-all border ${filterPos === pos ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 text-zinc-500 border-white/5 hover:text-white'}`}
                >
                  {pos}
                </button>
              ))}
            </div>
          </FilterPanel>

          <div className="p-8 rounded-[40px] bg-black/60 border border-white/5 flex items-center gap-6 shadow-4xl backdrop-blur-xl">
             <Search className="w-6 h-6 text-zinc-700" />
             <input 
               type="text" 
               placeholder="SEARCH LISTINGS..." 
               className="bg-transparent border-none text-[10px] font-black text-white placeholder:text-zinc-900 focus:ring-0 w-full tracking-widest"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
        </aside>

        <main className="space-y-20">
          <div className="flex flex-col md:flex-row items-end justify-between px-10 gap-8">
             <div className="flex-1">
                <div className="flex items-center gap-6 mb-4">
                   <img src={logo} alt="PSL" className="h-20 w-20 drop-shadow-glow filter grayscale invert brightness-200" />
                   <div>
                      <DecryptedText
                        text="TRANSFER MARKET"
                        className="text-6xl md:text-8xl font-black text-white italic uppercase tracking-tighter leading-none"
                        animateOn="view"
                        revealDirection="center"
                      />
                   </div>
                </div>
                <p className="text-white/20 font-mono uppercase tracking-[0.6em] text-[9px] ml-2 flex items-center gap-4">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Authorized Player Exchange Network // LIVE_STATUS: ACTIVE
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-12 p-6">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="flex justify-center">
                 <TiltedCard
                    glareColor="rgba(245, 158, 11, 0.3)"
                    maxTilt={8}
                 >
                    <PlayerCard player={player} compact trading className="!border-none !shadow-none !bg-transparent" />
                 </TiltedCard>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
