import React, { useRef, useState } from "react";
import { Wallet, Zap } from "lucide-react";
import { Player } from "../store/fplStore";
import { motion, AnimatePresence } from "framer-motion";
import { getPlayerPhoto } from "../utils/playerPhotoStore";

const rarityUI = {
  legendary: {
    color: "text-amber-500",
    border: "border-amber-500/50",
    bg: "bg-amber-500",
    glow: "shadow-[0_0_15px_rgba(245,158,11,0.5)]",
    gradientTop: "from-amber-500/10",
    label: "★ LEGEND",
    ringColor: "ring-amber-500/40",
  },
  epic: {
    color: "text-fuchsia-500",
    border: "border-fuchsia-500/50",
    bg: "bg-fuchsia-500",
    glow: "shadow-[0_0_15px_rgba(217,70,239,0.5)]",
    gradientTop: "from-fuchsia-500/10",
    label: "✦ EPIC",
    ringColor: "ring-fuchsia-500/40",
  },
  rare: {
    color: "text-green-500",
    border: "border-green-500/50",
    bg: "bg-green-500",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    gradientTop: "from-green-500/10",
    label: "♦ RARE",
    ringColor: "ring-green-500/40",
  },
  common: {
    color: "text-emerald-500",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500",
    glow: "shadow-[0_0_15px_rgba(16,185,129,0.5)]",
    gradientTop: "from-emerald-500/10",
    label: "● COMMON",
    ringColor: "ring-emerald-500/40",
  },
};

function initialsFromName(name: string) {
  if (!name || typeof name !== 'string') return "??";
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  return parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
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
  photoUrl?: string | null; // External override — if not provided, pulls from localStorage
}

export default function PlayerCard({ player, isActive = false, compact = false, className = "", trading = false, onClick, opponent, photoUrl }: PlayerCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1, glareX: 50, glareY: 50 });
  const maxTilt = 15;

  // -- EXTREME SAFETY CODES --
  const dynPoints = Number((player as any)?.dynamicValue || player?.points || 0);
  const cost = Number(player?.cost_millions || 0);
  const safeName = player?.name || "Unknown Player";
  const safeClub = player?.club || "Unattached";
  const safePos = player?.position || "ANY";
  const safeId = player?.id || "000";
  const isCustom = typeof safeId === 'string' && safeId.startsWith('custom_');

  // Resolve photo: prop override > localStorage lookup
  const resolvedPhoto = photoUrl !== undefined ? photoUrl : getPlayerPhoto(safeId);

  const rarityKey = getRarity(cost);
  const baseRarity = rarityUI[rarityKey as keyof typeof rarityUI] || rarityUI.common;

  // Custom (injected) players get a Cyber Purple override
  const rarity = isCustom ? {
    color: 'text-purple-400',
    border: 'border-purple-500/50',
    bg: 'bg-purple-500',
    glow: 'shadow-[0_0_15px_rgba(176,38,255,0.6)]',
    gradientTop: 'from-purple-500/15',
    label: '⚡ INJECTED',
    ringColor: 'ring-purple-500/50',
  } : baseRarity;

  function handleMouseMove(event: React.MouseEvent) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const percentX = x / (rect.width || 1);
    const percentY = y / (rect.height || 1);
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
      className={`group relative flex flex-col justify-between overflow-hidden cursor-pointer rounded-sm border bg-[#0a0a0c] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] z-20 ${
        isCustom ? "border-purple-500/40 shadow-[0_0_25px_rgba(176,38,255,0.35)]" : "border-white/5"
      } ${
        isActive ? "border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.3)]" : ""
      } ${className} ${compact ? "w-[150px] h-[240px] lg:w-[180px] lg:h-[290px]" : "w-[260px] h-[400px]"}`}
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
           {isCustom ? (
              <span className="text-[7px] lg:text-[9px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.5 rounded-full animate-pulse">
                INJECTED
              </span>
            ) : (
              <span className="text-[8px] lg:text-[10px] text-zinc-500 font-mono tracking-wider bg-[#0a0a0c]/80 px-1 rounded backdrop-blur">
                #{String(safeId).padStart(3, '0')}
              </span>
            )}
        </div>
        
        {/* ── Player Avatar: Photo or Initials ── */}
        <div 
          className={`flex items-center justify-center rounded-full border-2 overflow-hidden ${rarity.border} ${compact ? "h-12 w-12 mt-4 lg:h-16 lg:w-16 lg:mt-6" : "h-[80px] w-[80px] mt-8"} ${
            resolvedPhoto ? 'p-0' : `bg-[#0a0a0c]/50 backdrop-blur-sm ${rarity.color}`
          } ${resolvedPhoto ? `ring-2 ${rarity.ringColor}` : ''}`}
          style={{ transform: "translateZ(45px)", transformStyle: "preserve-3d" }}
        >
          {resolvedPhoto ? (
            <img 
              src={resolvedPhoto} 
              alt={safeName}
              className="w-full h-full object-cover object-top"
              draggable={false}
            />
          ) : (
            <span className={`font-bold ${compact ? "text-sm lg:text-lg" : "text-2xl"}`}>
              {initialsFromName(safeName)}
            </span>
          )}
        </div>
        
        <div className="text-center mt-3 lg:mt-5" style={{ transform: "translateZ(35px)" }}>
           <h2 className={`font-bold uppercase tracking-[0.1em] ${rarity.color} ${compact ? "text-[10px] lg:text-xs" : "text-sm"} line-clamp-1 px-1`}>{safeName}</h2>
           <p className={`mt-1 font-semibold uppercase tracking-[0.15em] opacity-80 ${rarity.color} ${compact ? "text-[6px] lg:text-[8px]" : "text-[9px]"}`}>
             {(player as any)?.expectation_status || 'Projected'}
           </p>
           
           <div className="flex flex-col items-center gap-[3px] mt-2 lg:mt-3 opacity-40">
               <div className={`h-[1px] w-8 lg:w-12 ${rarity.bg}`}></div>
               <div className={`h-[1px] w-4 lg:w-6 ${rarity.bg}`}></div>
           </div>
        </div>
      </div>

      <div className={`relative-1 bg-[#121316] flex flex-col justify-between border-t border-white/5 ${compact ? "p-2 lg:p-3" : "p-3 lg:p-4"}`}>
        <div className={`flex flex-col ${compact ? "space-y-1 lg:space-y-2" : "space-y-2 lg:space-y-3"}`} style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
           <div>
             <h3 className={`font-bold text-white leading-tight ${compact ? "text-xs lg:text-[15px]" : "text-[17px]"} line-clamp-1`}>{safeName}</h3>
             <p className="text-zinc-500 text-[9px] lg:text-[11px] font-medium tracking-wide line-clamp-1">{safeClub}</p>
             <p className={`text-[9px] lg:text-[11px] mt-0.5 tracking-wide ${rarity.color}`}>{safePos}</p>
           </div>
           
           <div className={`bg-[#18181a] border border-white/5 rounded font-light italic text-zinc-400 hidden lg:block ${compact ? "p-1 lg:p-1.5 text-[8px] lg:text-[9px]" : "p-1.5 lg:p-2.5 text-[9px] lg:text-[11px]"}`}>
             Ability Base: {(player as any)?.overall_ability || 'N/A'}
           </div>

           <AnimatePresence>
             {opponent && (
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className={`mt-1 flex items-center justify-between bg-black/80 border ${rarity.border} rounded-sm ${compact ? "px-1.5 py-1" : "px-2 py-2"} shadow-lg`}
               >
                 <span className={`${compact ? "text-[6px] lg:text-[7px]" : "text-[8px]"} text-zinc-500 font-bold uppercase tracking-tighter`}>Next Match</span>
                 <div className="flex items-center gap-1.5">
                   <span className={`${compact ? "text-[5px] lg:text-[6px]" : "text-[7px]"} font-black text-zinc-600 uppercase tracking-widest`}>vs</span>
                   <span className={`${compact ? "text-[8px] lg:text-[10px]" : "text-[11px]"} font-black ${rarity.color} uppercase tracking-tight`}>
                     {opponent}
                   </span>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <div className="pt-0.5">
             <div className="flex justify-between items-end mb-1">
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

        <div className={`${compact ? "mt-1 lg:mt-2 pt-1 lg:pt-2" : "mt-2 lg:mt-4 pt-2 lg:pt-3"} flex items-center justify-between border-t border-white/5`} style={{ transform: "translateZ(40px)" }}>
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
