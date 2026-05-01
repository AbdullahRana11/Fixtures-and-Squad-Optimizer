import React, { useRef, useState } from "react";
import { Wallet, Zap } from "lucide-react";

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
    color: "text-green-500",
    border: "border-green-500/50",
    bg: "bg-green-500",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    gradientTop: "from-green-500/10",
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

export default function DummyPlayerCard({ player, isActive = false, compact = false, className = "", trading = false }: any) {
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1, glareX: 50, glareY: 50 });
  const maxTilt = 15;

  const rarity = rarityUI[player.rarity as keyof typeof rarityUI] || rarityUI.common;

  const momentText = player.momentText || "";
  const momentQuote = player.momentQuote || "";
  const performanceFill = Math.min((player.rating / 100) * 100, 100);

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

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale}, ${tilt.scale}, ${tilt.scale})`,
        transition: "transform 200ms ease-out, box-shadow 200ms ease-out, border-color 200ms ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={`group relative flex flex-col justify-between overflow-hidden cursor-pointer rounded-sm border border-white/5 bg-[#0a0a0c] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] ${
        isActive ? "animate-pulseGlow border-emerald-400/50 shadow-[0_0_30px_rgba(52,211,153,0.3)]" : ""
      } ${className} ${compact ? "w-[180px] h-[280px]" : "w-[260px] h-[400px]"}`}
    >
      <div
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 20%, rgba(0,0,0,0) 60%)`,
          opacity: 0.8,
          transition: "background-position 120ms ease-out",
        }}
      />

      <div className={`relative flex flex-col items-center justify-center pt-5 pb-6 px-4 bg-gradient-to-b ${rarity.gradientTop} to-transparent h-[55%] border-b border-white/5`}>
        <div className="absolute top-4 w-full px-4 flex justify-between items-center" style={{ transform: "translateZ(25px)" }}>
           <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${rarity.border} ${rarity.color} ${rarity.glow} tracking-widest`}>
             {rarity.label}
           </span>
           <span className="text-[10px] text-zinc-500 font-mono tracking-wider">#{String(player.id).replace('p-','').padStart(3, '0')}</span>
        </div>
        
        <div 
          className={`flex items-center justify-center rounded-full border ${rarity.border} ${rarity.color} ${compact ? "h-14 w-14 text-lg mt-6" : "h-[75px] w-[75px] text-2xl mt-8"}`}
          style={{ transform: "translateZ(45px)", transformStyle: "preserve-3d" }}
        >
          {initialsFromName(player.name)}
        </div>
        
        <div className="text-center mt-5" style={{ transform: "translateZ(35px)" }}>
           <h2 className={`font-bold uppercase tracking-[0.1em] ${rarity.color} ${compact ? "text-xs" : "text-sm"}`}>{player.name}</h2>
           <p className={`mt-1 font-semibold uppercase tracking-[0.15em] opacity-80 ${rarity.color} ${compact ? "text-[8px]" : "text-[9px]"}`}>{momentText}</p>
           
           <div className="flex flex-col items-center gap-[3px] mt-3 opacity-40">
               <div className={`h-[1px] w-12 ${rarity.bg}`}></div>
               <div className={`h-[1px] w-6 ${rarity.bg}`}></div>
           </div>
        </div>
      </div>

      <div className="relative flex-1 bg-[#121316] p-4 flex flex-col justify-end">
        <div className="flex flex-col space-y-3" style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }}>
           <div>
             <h3 className={`font-bold text-white ${compact ? "text-[15px]" : "text-[17px]"}`}>{player.name}</h3>
             <p className="text-zinc-500 text-[11px] font-medium tracking-wide">{player.team}</p>
             <p className={`text-[11px] mt-0.5 tracking-wide ${rarity.color}`}>{momentText}</p>
           </div>
           
           <div className="bg-[#18181a] border border-white/5 rounded p-2.5 font-light italic text-zinc-400 text-[11px]">
             {momentQuote}
           </div>

           <div className="pt-1">
             <div className="flex justify-between items-end mb-1.5">
                <span className="text-[10px] text-zinc-500 font-medium">Performance</span>
                <span className={`font-bold ${rarity.color} text-[15px] leading-none`}>
                  {player.rating * 8} <span className="text-[9px] text-zinc-500 font-normal">/1000</span>
                </span>
             </div>
             <div className="h-1.5 w-full bg-[#2a2a2b] rounded-full overflow-hidden">
                <div className={`h-full ${rarity.bg} shadow-[0_0_5px_currentColor]`} style={{ width: `${performanceFill}%` }} />
             </div>
           </div>
        </div>

        <div className="mt-4 pt-3 flex items-center justify-between border-t border-white/5" style={{ transform: "translateZ(40px)" }}>
           <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold tracking-wide">
               <Wallet className="w-3.5 h-3.5 text-zinc-500" />
               {player.currentBid}
           </div>
           {trading ? (
             <button className="bg-emerald-500 text-black px-2.5 py-1 rounded text-xs font-bold transition-all hover:bg-emerald-400 hover:shadow-[0_0_10px_rgba(16,185,129,0.5)]">
               Buy - {player.buyNow}
             </button>
           ) : (
             <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-medium tracking-wide">
               <Zap className="w-3 h-3 text-emerald-500" /> Gasless
             </span>
           )}
        </div>
      </div>
    </article>
  );
}
