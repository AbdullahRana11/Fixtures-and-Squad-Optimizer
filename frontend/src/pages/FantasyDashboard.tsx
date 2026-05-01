import React, { useState, useMemo } from 'react';
import PlayerCard from "../components/PlayerCard";
import { useFplStore } from '../store/fplStore';
import logo from "../assets/pics/PSL-logo.png";
import { Search, Database, Zap } from 'lucide-react';
 
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

export default function FantasyDashboard() {
  const { allPlayers } = useFplStore();
  const [filterTeam, setFilterTeam] = useState<string | null>(null);
  const [filterPos, setFilterPos] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = useMemo(() => {
    if (!allPlayers) return [];
    let list = [...allPlayers];
    if (filterTeam) list = list.filter(p => p.club === filterTeam || (p.club && p.club.includes(filterTeam)));
    if (filterPos) list = list.filter(p => p.position === filterPos);
    if (searchQuery) list = list.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return list.slice(0, 40); 
  }, [allPlayers, filterTeam, filterPos, searchQuery]);

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
              leftCars: [0x10b981, 0x059669, 0x047857],
              rightCars: [0x10b981, 0x059669, 0x047857],
              sticks: 0x10b981
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030408]/80 via-[#030408]/40 to-[#030408]/90 pointer-events-none" />
        <GridScan 
          color="#10b981" 
        />
      </div>
      
      <div className="relative z-10 grid gap-12 lg:grid-cols-[340px_1fr] max-w-[2400px] mx-auto p-8 md:p-16 lg:p-20">
        <aside className="space-y-4">
          <FilterPanel title="SCOUT BY CLUB">
             <div className="grid grid-cols-3 gap-4">
               {teamFilters.map(team => (
                 <button 
                   key={team.id}
                   onClick={() => setFilterTeam(filterTeam === team.id ? null : team.id)}
                   className={`flex h-16 items-center justify-center rounded-2xl border transition-all hover:scale-110 active:scale-95 ${filterTeam === team.id ? 'border-emerald-400 bg-emerald-400/20 shadow-glow' : 'border-white/10 bg-black/60 p-3'}`}
                 >
                   <img src={team.logo} alt={team.id} className="h-full w-full object-contain" />
                 </button>
               ))}
             </div>
          </FilterPanel>

          <FilterPanel title="ROLE FILTER">
            <div className="grid grid-cols-2 gap-3">
              {['FWD', 'MID', 'DEF', 'GK'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(filterPos === pos ? null : pos)}
                  className={`py-4 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all border ${filterPos === pos ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 text-zinc-500 border-white/5 hover:text-white hover:bg-white/10'}`}
                >
                  {pos === 'FWD' ? 'FORWARD' : pos === 'MID' ? 'MIDFIELDER' : pos === 'DEF' ? 'DEFENDER' : 'GOALIE'}
                </button>
              ))}
            </div>
          </FilterPanel>

          <div className="p-6 rounded-[32px] bg-black/60 border border-white/5 backdrop-blur-xl flex items-center gap-4 shadow-2xl">
              <Search className="w-5 h-5 text-zinc-600" />
              <input 
                type="text" 
                placeholder="PROBE DATABASE..." 
                className="bg-transparent border-none text-[10px] font-black text-white placeholder:text-zinc-800 focus:ring-0 w-full tracking-widest"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
          </div>
        </aside>

        <main className="space-y-16">
          <div className="flex items-end justify-between px-6">
             <div className="flex items-center gap-10">
                <img src={logo} alt="PSL" className="h-24 w-24 drop-shadow-2xl filter grayscale invert brightness-200" />
                <div className="flex flex-col">
                   <DecryptedText
                     text="FANTASY COMMAND"
                     className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none"
                     animateOn="view"
                     revealDirection="center"
                   />
                   <p className="text-white/20 text-[9px] font-mono uppercase tracking-[0.5em] mt-4 flex items-center gap-2">
                     <Zap className="w-3 h-3 text-emerald-500" /> BIOMETRIC SCANNER: ENGAGED // NETWORK: SECURE
                   </p>
                </div>
             </div>
             <div className="bg-black/60 border border-white/10 px-10 py-6 rounded-[32px] backdrop-blur-xl text-center shadow-2xl">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 font-mono">Total Assets</p>
                <div className="flex items-center gap-3">
                   <Database className="w-5 h-5 text-emerald-500" />
                   <p className="text-4xl font-black text-white italic tracking-tighter">{filteredPlayers.length}</p>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-12 p-4">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="flex justify-center">
                 <TiltedCard
                    glareColor="rgba(16, 185, 129, 0.3)"
                    maxTilt={8}
                 >
                    <PlayerCard player={player} compact className="!border-none !shadow-none !bg-transparent" />
                 </TiltedCard>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
