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
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
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
    <section className="rounded-3xl border border-white/5 bg-black/60 p-8 backdrop-blur-3xl shadow-2xl mb-6 relative overflow-hidden tactical-glass">
      <div className="neon-scanline opacity-20" />
      <h3 className="mb-6 inline-block text-[9px] font-black uppercase tracking-[0.4em] text-teal-400/50 font-mono">
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
    return list;
  }, [allPlayers, filterTeam, filterPos, searchQuery]);

  useGSAP(() => {
    gsap.fromTo(".player-card-anim", 
      { y: 50, opacity: 0, scale: 0.9, rotationX: 10 },
      { y: 0, opacity: 1, scale: 1, rotationX: 0, duration: 0.8, stagger: 0.05, ease: "back.out(1.7)", clearProps: "all" }
    );
  }, [filteredPlayers.length]); // Re-run when filtered length changes

  return (
    <div className="min-h-screen bg-[#030408] text-white relative overflow-hidden">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <Hyperspeed 
          effectOptions={{
            distortion: 'turbulentDistortion',
            speedUp: 2,
            colors: {
              roadColor: 0x02040A,
              islandColor: 0x050810,
              background: 0x02040A,
              shoulderLines: 0x2dd4bf,
              brokenLines: 0x2dd4bf,
              leftCars: [0x2dd4bf, 0x0d9488],
              rightCars: [0x8b5cf6, 0x6d28d9],
              sticks: 0x2dd4bf
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040A]/90 via-[#02040A]/40 to-[#02040A]/95 pointer-events-none" />
        <GridScan color="#2dd4bf" scanSpeed={3} />
      </div>
      
      <div className="relative z-10 grid gap-12 lg:grid-cols-[340px_1fr] max-w-[2400px] mx-auto p-8 md:p-16 lg:p-20">
        <aside className="space-y-4">
          <FilterPanel title="SCOUT BY CLUB">
             <div className="grid grid-cols-3 gap-4">
               {teamFilters.map(team => (
                 <button 
                   key={team.id}
                    onClick={() => setFilterTeam(filterTeam === team.id ? null : team.id)}
                    className={`flex h-16 items-center justify-center rounded-2xl border transition-all hover:scale-110 active:scale-95 relative group ${filterTeam === team.id ? 'border-teal-500 bg-teal-500/20 shadow-[0_0_20px_rgba(45,212,191,0.2)]' : 'border-white/10 bg-black/60 p-3'}`}
                  >
                    <div className="hud-corner hud-corner-tl opacity-0 group-hover:opacity-100 transition-opacity" />
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
                  className={`py-4 rounded-xl text-[10px] font-black tracking-[0.2em] transition-all border ${filterPos === pos ? 'bg-teal-500 text-black border-teal-500' : 'bg-white/5 text-zinc-500 border-white/5 hover:text-white hover:bg-white/10'}`}
                >
                  {pos === 'FWD' ? 'FORWARD' : pos === 'MID' ? 'MIDFIELDER' : pos === 'DEF' ? 'DEFENDER' : 'GOALIE'}
                </button>
              ))}
            </div>
          </FilterPanel>

          <div className="p-6 rounded-3xl bg-black/60 border border-white/5 backdrop-blur-xl flex items-center gap-4 shadow-2xl tactical-glass group">
              <Search className="w-5 h-5 text-teal-500/50 group-focus-within:text-teal-400 transition-colors" />
              <input 
                type="text" 
                placeholder="PROBE DATABASE..." 
                className="bg-transparent border-none text-[10px] font-black text-white placeholder:text-zinc-700 focus:ring-0 w-full tracking-widest"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
          </div>
        </aside>

        <main className="space-y-10">
          {/* ── Header: logo + title stack, then stat chips below ── */}
          <div className="flex flex-col gap-5 px-4">
            {/* Row 1: logo + title */}
            <div className="flex items-center gap-6 min-w-0">
              <img src={logo} alt="PSL" className="h-16 w-16 shrink-0 drop-shadow-2xl filter grayscale invert brightness-200" />
              <div className="min-w-0 flex flex-col">
                <DecryptedText
                  text="FANTASY COMMAND"
                  className="text-4xl sm:text-5xl lg:text-6xl font-black text-white italic uppercase tracking-tighter leading-none"
                  animateOn="view"
                  revealDirection="center"
                />
                <p className="text-white/20 text-[9px] font-mono uppercase tracking-[0.4em] mt-2 flex items-center gap-2 truncate">
                  <Zap className="w-3 h-3 text-teal-400 shrink-0" /> BIOMETRIC SCANNER: ENGAGED // NETWORK: SECURE
                </p>
              </div>
            </div>
            {/* Row 2: stat chips */}
            <div className="flex gap-3 flex-wrap">
              <div className="bg-black/60 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl text-center shadow-2xl tactical-glass">
                <p className="text-[8px] font-black text-teal-400/40 uppercase tracking-[0.3em] mb-1 font-mono">DB Uptime</p>
                <p className="text-lg font-black text-teal-400 italic">99.9%</p>
              </div>
              <div className="bg-black/60 border border-white/10 px-6 py-3 rounded-2xl backdrop-blur-xl text-center shadow-2xl tactical-glass relative overflow-hidden">
                <div className="neon-scanline opacity-10" />
                <p className="text-[8px] font-black text-violet-400/40 uppercase tracking-[0.3em] mb-1 font-mono">Total Assets</p>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-violet-500" />
                  <p className="text-lg font-black text-white italic tracking-tighter">{filteredPlayers.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xxl:grid-cols-5 gap-12 p-4">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="flex justify-center player-card-anim">
                 <TiltedCard
                    glareColor="rgba(45, 212, 191, 0.3)"
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
