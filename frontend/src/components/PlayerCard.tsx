import React, { useRef, useState } from "react";
import { Wallet, Zap } from "lucide-react";
import { Player } from "../store/fplStore";
import { motion, AnimatePresence } from "framer-motion";

const rarityUI = {
  legendary: {
    color: "text-amber-500",
    border: "border-amber-500/50",
    bg: "bg-amber-500",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
    gradientTop: "from-amber-500/10",
    label: "★ LEGEND",
  },
  epic: {
    color: "text-fuchsia-500",
    border: "border-fuchsia-500/50",
    bg: "bg-fuchsia-500",
    glow: "shadow-[0_0_15px_rgba(217,70,239,0.5)]",
    gradientTop: "from-fuchsia-500/10",
    label: "✦ EPIC",
  },
  rare: {
    color: "text-blue-500",
    border: "border-blue-500/50",
    bg: "bg-blue-500",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    gradientTop: "from-blue-500/10",
    label: "♦ RARE",
  },
  common: {
    color: "text-emerald-500",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    gradientTop: "from-emerald-500/10",
    label: "● COMMON",
  },
};

function initialsFromName(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

function getRarity(cost: number) {
  if (cost > 10.0) return "legendary";
  if (cost >= 8.0) return "epic";
  if (cost >= 6.0) return "rare";
  return "common";
}

interface PlayerCardProps {
  player: Player;
  isActive?: boolean;
  compact?: boolean;
  className?: string;
  trading?: boolean;
  onClick?: () => void;
  opponent?: string;
}

export default function PlayerCard({ player, isActive = false, compact = false, className = "", trading = false, onClick, opponent }: PlayerCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1, glareX: 50, glareY: 50 });
  const maxTilt = 15;
  const dynPoints = (player as any).dynamicValue || player.points;

  const cost = Number(player.cost_millions || 0);
  const rarity = rarityUI[getRarity(cost) as keyof typeof rarityUI];

  function handleMouseMove(event: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const percentX = x / rect.width;
    const percentY = y / rect.height;
    const offsetX = percentX - 0.5;
    const offsetY = percentY - 0.5;

    setTilt({
      rotateX: -(offsetY * maxTilt * 2.5),
      rotateY: offsetX * maxTilt * 2.5,
      scale: 1.05,
      glareX: percentX * 100,
      glareY: percentY * 100,
    });
  }

  function handleMouseLeave() {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1, glareX: 50, glareY: 50 });
  }

  const performanceFill = Math.min((dynPoints / 25) * 100, 100);

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale}, ${tilt.scale}, ${tilt.scale})`,
        transition: "transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={`group relative flex flex-col justify-between overflow-hidden cursor-pointer rounded-sm border border-white/5 bg-[#0a0a0c] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-20 ${
        isActive ? "border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.3)]" : ""
      } ${className} ${compact ? "w-[150px] h-[230px] lg:w-[180px] lg:h-[280px]" : "w-[260px] h-[400px]"}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 20%, rgba(0,0,0,0) 60%)`,
          opacity: 0.8,
          transition: "background-position 120ms ease-out",
        }}
      />

      <div className={`relative flex flex-col items-center justify-center pt-3 pb-4 lg:pt-5 lg:pb-6 px-4 bg-gradient-to-b ${rarity.gradientTop} to-transparent h-[55%] border-b border-white/5`}>
        <div className="absolute top-2 lg:top-4 w-full px-4 flex justify-between items-center" style={{ transform: "translateZ(25px)" }}>
           <span className={`px-2 py-0.5 text-[7px] lg:text-[9px] font-bold border rounded-full ${rarity.border} ${rarity.color} ${rarity.glow} tracking-widest bg-[#0a0a0c]`}>
             {rarity.label}
           </span>
           <span className="text-[8px] lg:text-[10px] text-zinc-500 font-mono tracking-wider bg-[#0a0a0c]/80 px-1 rounded backdrop-blur">
             #{String(player.id).padStart(3, '0')}
           </span>
        </div>
        
        <div 
          className={`flex items-center justify-center rounded-full border bg-[#0a0a0c]/50 backdrop-blur-sm ${rarity.border} ${rarity.color} ${compact ? "h-10 w-10 text-sm mt-4 lg:h-14 lg:w-14 lg:text-lg lg:mt-6" : "h-[75px] w-[75px] text-2xl mt-8"}`}
          style={{ transform: "translateZ(45px)", transformStyle: "preserve-3d" }}
        >
          {initialsFromName(player.name)}
        </div>
        
        <div className="text-center mt-3 lg:mt-5" style={{ transform: "translateZ(35px)" }}>
           <h2 className={`font-bold uppercase tracking-[0.1em] ${rarity.color} ${compact ? "text-[10px] lg:text-xs" : "text-sm"} line-clamp-1 px-1`}>{player.name}</h2>
           <p className={`mt-1 font-semibold uppercase tracking-[0.15em] opacity-80 ${rarity.color} ${compact ? "text-[6px] lg:text-[8px]" : "text-[9px]"}`}>
             {(player as any).expectation_status || 'Projected'}
           </p>
           
           <div className="flex flex-col items-center gap-[3px] mt-2 lg:mt-3 opacity-40">
               <div className={`h-[1px] w-8 lg:w-12 ${rarity.bg}`}></div>
               <div className={`h-[1px] w-4 lg:w-6 ${rarity.bg}`}></div>
           </div>
        </div>
      </div>

      <div className="relative flex-1 bg-[#121316] p-3 lg:p-4 flex flex-col justify-between border-t border-white/5">
        <div className="flex flex-col space-y-2 lg:space-y-3" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
           <div>
             <h3 className={`font-bold text-white leading-tight ${compact ? "text-xs lg:text-[15px]" : "text-[17px]"} line-clamp-1`}>{player.name}</h3>
             <p className="text-zinc-500 text-[9px] lg:text-[11px] font-medium tracking-wide line-clamp-1">{player.club}</p>
             <p className={`text-[9px] lg:text-[11px] mt-0.5 tracking-wide ${rarity.color}`}>{player.position}</p>
           </div>
           
           <div className="bg-[#18181a] border border-white/5 rounded p-1.5 lg:p-2.5 font-light italic text-zinc-400 text-[9px] lg:text-[11px] hidden lg:block">
             Ability Base: {(player as any).overall_ability || 'N/A'}
           </div>

           {/* Opponent Badge - Enhanced visibility */}
           <AnimatePresence>
             {opponent && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className={`mt-2 flex items-center justify-between bg-black/80 border ${rarity.border} rounded-sm px-2 py-2 shadow-lg`}
               >
                 <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Next Match</span>
                 <div className="flex items-center gap-1.5">
                   <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">vs</span>
                   <span className={`text-[11px] font-black ${rarity.color} uppercase tracking-tight`}>
                     {opponent}
                   </span>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="pt-1">
             <div className="flex justify-between items-end mb-1 lg:mb-1.5">
                <span className="text-[8px] lg:text-[10px] text-zinc-500 font-medium">Dyn. Value</span>
                <span className={`font-bold ${rarity.color} text-[12px] lg:text-[15px] leading-none`}>
                  {dynPoints.toFixed(1)} <span className="text-[7px] lg:text-[9px] text-zinc-500 font-normal">pts</span>
                </span>
             </div>
             <div className="h-1 lg:h-1.5 w-full bg-[#2a2a2b] rounded-full overflow-hidden">
                <div className={`h-full ${rarity.bg} shadow-[0_0_5px_currentColor]`} style={{ width: `${performanceFill}%` }} />
             </div>
           </div>
        </div>

        <div className="mt-2 lg:mt-4 pt-2 lg:pt-3 flex items-center justify-between border-t border-white/5" style={{ transform: "translateZ(40px)" }}>
           <div className="flex items-center gap-1.5 text-emerald-400 text-[9px] lg:text-xs font-bold tracking-wide">
               <Wallet className="w-2.5 h-2.5 lg:w-3.5 lg:h-3.5 text-zinc-500" />
               £{cost.toFixed(1)}m
           </div>
           {trading ? (
             <button className="bg-emerald-500 text-black px-2 lg:px-2.5 py-0.5 lg:py-1 rounded text-[9px] lg:text-xs font-bold transition-all hover:bg-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]">
               Swap
             </button>
           ) : (
             <span className="flex items-center gap-1 text-zinc-500 text-[8px] lg:text-[10px] font-medium tracking-wide">
               <Zap className="w-2.5 h-2.5 lg:w-3 text-emerald-500" /> Synced
             </span>
           )}
        </div>
      </div>
    </article>
  );
}
