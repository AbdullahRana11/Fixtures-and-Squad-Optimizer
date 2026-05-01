import React, { useState, useMemo } from 'react';

import PlayerCard from "../components/PlayerCard";
import { useFplStore } from '../store/fplStore';
import logo from "../assets/pics/PSL-logo.png";
import { Search, ShoppingCart, Filter, Activity, Cpu } from 'lucide-react';

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

function FilterPanel({ title, icon: Icon, children }: { title: string, icon: any, children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Icon className="w-4 h-4 text-zinc-400" />
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 font-open">
          {title}
        </h3>
      </div>
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

    return list.slice(0, 35); 
  }, [allPlayers, filterTeam, filterPos, sortBy, searchQuery]);

  return (
    <div className="min-h-screen bg-void text-white relative font-open">
      <div className="absolute inset-0 z-0 opacity-5 bg-[url('/noise.svg')]" />
      
      <div className="relative z-10 grid gap-12 lg:grid-cols-[380px_1fr] max-w-[2400px] mx-auto p-8 md:p-12">
        <aside className="space-y-6 h-fit lg:sticky lg:top-12">
          <div className="p-8 rounded-xl bg-zinc-900 border border-zinc-800 mb-6 text-center">
             <div className="flex items-center justify-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-teal-900 text-teal-400">
                   <ShoppingCart className="w-5 h-5" />
                </div>
             </div>
             <p className="text-3xl font-merriweather font-bold text-white uppercase tracking-wide">
               EXCHANGE <span className="text-teal-500">ACTIVE</span>
             </p>
          </div>

          <FilterPanel title="OFFICIAL ENTITIES" icon={Cpu}>
             <div className="grid grid-cols-4 gap-3">
               {teamFilters.map(team => (
                 <button 
                   key={team.id}
                   onClick={() => setFilterTeam(filterTeam === team.id ? null : team.id)}
                   className={`flex h-14 items-center justify-center rounded-lg border transition-all ${filterTeam === team.id ? 'border-teal-500 bg-teal-900/50' : 'border-zinc-800 bg-zinc-800 hover:border-zinc-600'}`}
                 >
                   <img src={team.logo} alt={team.id} className={`h-8 w-8 object-contain transition-all ${filterTeam === team.id ? '' : 'filter grayscale opacity-70'}`} />
                 </button>
               ))}
             </div>
          </FilterPanel>

          <FilterPanel title="TACTICAL ROLE" icon={Filter}>
            <div className="grid grid-cols-2 gap-3">
              {['FWD', 'MID', 'DEF', 'GK'].map(pos => (
                <button
                  key={pos}
                  onClick={() => setFilterPos(filterPos === pos ? null : pos)}
                  className={`py-3 rounded-lg text-xs font-bold tracking-wider transition-all border ${filterPos === pos ? 'bg-teal-600 text-white border-teal-500' : 'bg-zinc-800 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-600'}`}
                >
                  {pos === 'GK' ? 'GOALKEEPER' : pos === 'DEF' ? 'DEFENDER' : pos === 'MID' ? 'MIDFIELDER' : 'FORWARD'}
                </button>
              ))}
            </div>
          </FilterPanel>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-4 focus-within:border-teal-500 transition-colors">
             <Search className="w-5 h-5 text-zinc-500" />
             <input 
               type="text" 
               placeholder="SEARCH PLAYER..." 
               className="bg-transparent border-none text-sm font-semibold text-white placeholder:text-zinc-500 focus:ring-0 w-full"
               value={searchQuery}
               onChange={e => setSearchQuery(e.target.value)}
             />
          </div>
          
          <div className="px-6 py-4 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-between">
             <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Market Index</span>
             <span className="text-sm font-bold text-teal-500">+2.4%</span>
          </div>
        </aside>

        <main className="space-y-12">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-5">
               <img src={logo} alt="PSL" className="h-12 w-12 shrink-0 filter grayscale opacity-70" />
               <span className="text-xs font-bold font-open text-zinc-400 uppercase tracking-widest">Quantum Exchange</span>
             </div>
             <div>
               <h1 className="text-5xl lg:text-7xl font-merriweather font-bold text-white uppercase tracking-tight">
                 Marketplace
               </h1>
             </div>
             <div className="flex items-center gap-4">
               <div className="h-px w-16 bg-zinc-700 shrink-0" />
               <p className="text-zinc-400 font-open uppercase tracking-widest text-xs flex items-center gap-3 min-w-0 truncate">
                 <Activity className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                 Live Asset Exchange
               </p>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 xxl:grid-cols-4 gap-8">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="flex justify-center">
                 <div className="w-full relative group">
                    <PlayerCard player={player} compact trading className="w-full bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-colors" />
                 </div>
              </div>
            ))}
          </div>
          
          {/* Loading more sentinel */}
          <div className="flex justify-center py-16">
             <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-ping" />
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Loading...</span>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
}


