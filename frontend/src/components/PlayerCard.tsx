import { useRef, useState } from "react";
import { Wallet, Zap } from "lucide-react";
import { Player } from "../store/fplStore";
import { motion, AnimatePresence } from "framer-motion";

const rarityUI = {
  legendary: {
    color:       "text-editorial-gold",
    border:      "border-editorial-gold/30",
    bg:          "bg-editorial-gold",
    glow:        "shadow-none",
    gradientTop: "from-editorial-gold/10",
    label:       "★ ELITE",
  },
  epic: {
    color:       "text-zinc-300",
    border:      "border-zinc-300/30",
    bg:          "bg-zinc-300",
    glow:        "shadow-none",
    gradientTop: "from-zinc-300/10",
    label:       "✦ TACTICAL",
  },
  rare: {
    color:       "text-teal-600",
    border:      "border-teal-600/30",
    bg:          "bg-teal-600",
    glow:        "shadow-none",
    gradientTop: "from-teal-600/10",
    label:       "♦ SECURE",
  },
  common: {
    color:       "text-zinc-500",
    border:      "border-zinc-700/40",
    bg:          "bg-zinc-600",
    glow:        "shadow-none",
    gradientTop: "from-zinc-600/5",
    label:       "● STANDARD",
  },
};

function initials(name: string) {
  if (!name) return "??";
  return name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();
}

function getRarity(cost: number) {
  if (cost > 10.0)  return "legendary";
  if (cost >= 8.0)  return "epic";
  if (cost >= 6.0)  return "rare";
  return "common";
}

interface PlayerCardProps {
  player:    Player;
  isActive?: boolean;
  compact?:  boolean;
  className?: string;
  trading?:  boolean;
  onClick?:  () => void;
  opponent?: string;
}

export default function PlayerCard({
  player, isActive = false, compact = false,
  className = "", trading = false, onClick, opponent,
}: PlayerCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, scale: 1, glareX: 50, glareY: 50 });

  const dynPoints = Number((player as any)?.dynamicValue ?? player?.points ?? 0);
  const cost      = Number(player?.cost_millions ?? 0);
  const safeName  = player?.name  ?? "Unknown";
  const safeClub  = player?.club  ?? "—";
  const safePos   = player?.position ?? "ANY";
  const safeId    = player?.id ?? "000";

  const rarityKey = getRarity(cost);
  const rarity    = rarityUI[rarityKey as keyof typeof rarityUI];
  const fill      = Math.min((dynPoints / 25) * 100, 100);

  function onMove(e: React.MouseEvent) {
    if (!cardRef.current) return;
    const r  = cardRef.current.getBoundingClientRect();
    const ox = (e.clientX - r.left) / r.width  - 0.5;
    const oy = (e.clientY - r.top)  / r.height - 0.5;
    setTilt({ rotateX: -(oy * 30), rotateY: ox * 30, scale: 1.05,
              glareX: (ox + 0.5) * 100, glareY: (oy + 0.5) * 100 });
  }
  function onLeave() {
    setTilt({ rotateX: 0, rotateY: 0, scale: 1, glareX: 50, glareY: 50 });
  }

  /* ─────────────────────────────────────────────
     COMPACT  →  pitch token (no double section)
  ───────────────────────────────────────────── */
  if (compact) {
    return (
      <article
        ref={cardRef}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          transform: `perspective(800px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale},${tilt.scale},${tilt.scale})`,
          transition: "transform 200ms ease-out",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
        className={`group relative flex flex-col items-center cursor-pointer select-none
          w-[120px] rounded-xl border bg-zinc-950/80 backdrop-blur-md shadow-lg
          ${rarity.border} ${rarity.glow}
          ${isActive ? "ring-1 ring-teal-500" : ""}
          hover:-translate-y-1 transition-transform duration-200
          overflow-hidden ${className}`}
      >
        {/* Top colour strip */}
        <div className={`w-full h-1 ${rarity.bg} opacity-60`} />

        {/* Rarity badge + ID */}
        <div className="w-full flex items-center justify-between px-2 pt-2">
          <span className={`text-[7px] font-black tracking-widest ${rarity.color} opacity-80`}>
            {rarity.label}
          </span>
          <span className="text-[7px] text-zinc-600 font-mono">
            #{String(safeId).padStart(3, "0")}
          </span>
        </div>

        {/* Initials avatar */}
        <div
          className={`flex items-center justify-center rounded-full border text-sm font-black
            ${rarity.border} ${rarity.color} bg-black/50 w-12 h-12 mt-2 mb-1`}
          style={{ transform: "translateZ(20px)" }}
        >
          {initials(safeName)}
        </div>

        {/* Name */}
        <p className={`text-[10px] font-black uppercase tracking-tight text-center px-1 leading-tight ${rarity.color} line-clamp-1 w-full`}>
          {safeName.split(" ").slice(-1)[0]}
        </p>

        {/* Club / position chips */}
        <div className="flex items-center gap-1 mt-1 mb-2">
          <span className="text-[8px] font-mono text-zinc-500 uppercase">{safeClub}</span>
          <span className="text-zinc-700">·</span>
          <span className={`text-[8px] font-black uppercase ${rarity.color}`}>{safePos}</span>
        </div>

        {/* Points bar */}
        <div className="w-[80%] mb-3">
          <div className="flex justify-between mb-0.5">
            <span className="text-[7px] text-zinc-600">pts</span>
            <span className={`text-[8px] font-black ${rarity.color}`}>{dynPoints.toFixed(0)}</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className={`h-full ${rarity.bg}`} style={{ width: `${fill}%` }} />
          </div>
        </div>

        {/* Glare */}
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-screen z-20"
          style={{ background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.08) 0%, transparent 60%)` }}
        />
      </article>
    );
  }

  /* ─────────────────────────────────────────────
     FULL  →  two-panel trading card
  ───────────────────────────────────────────── */
  return (
    <article
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(${tilt.scale},${tilt.scale},${tilt.scale})`,
        transition: "transform 200ms ease-out, box-shadow 200ms ease-out",
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
      className={`group relative flex flex-col overflow-hidden cursor-pointer rounded-sm
        tactical-glass border border-white/10
        hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)]
        w-[260px] h-[400px]
        ${isActive ? "border-teal-400/50 shadow-[0_0_30px_rgba(45,212,191,0.2)]" : ""}
        ${className}`}
    >
      {/* HUD corners */}
      <div className="hud-corner hud-corner-tl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="hud-corner hud-corner-tr opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="hud-corner hud-corner-bl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="hud-corner hud-corner-br opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Glare */}
      <div
        className="pointer-events-none absolute inset-0 z-10 mix-blend-screen"
        style={{ background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.10) 0%, transparent 60%)` }}
      />

      {/* Top panel */}
      <div className={`relative flex flex-col items-center justify-center pt-5 pb-4 px-4
        bg-gradient-to-b ${rarity.gradientTop} to-transparent border-b border-white/5`}
        style={{ height: "45%" }}>

        <div className="absolute top-3 w-full px-4 flex justify-between items-center" style={{ transform: "translateZ(25px)" }}>
          <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${rarity.border} ${rarity.color} ${rarity.glow} tracking-widest bg-[#0a0a0c]`}>
            {rarity.label}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono bg-[#0a0a0c]/80 px-1 rounded">
            #{String(safeId).padStart(3, "0")}
          </span>
        </div>

        <div
          className={`flex items-center justify-center rounded-full border bg-[#0a0a0c]/50 backdrop-blur-sm
            h-[70px] w-[70px] text-2xl mt-6 font-black ${rarity.border} ${rarity.color}`}
          style={{ transform: "translateZ(45px)" }}
        >
          {initials(safeName)}
        </div>

        <div className="text-center mt-4" style={{ transform: "translateZ(35px)" }}>
          <h2 className={`font-bold uppercase tracking-[0.1em] text-sm ${rarity.color} line-clamp-1 px-1`}>{safeName}</h2>
          <p className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.15em] opacity-80 ${rarity.color}`}>
            {(player as any)?.expectation_status ?? "Projected"}
          </p>
          <div className="flex flex-col items-center gap-[3px] mt-2 opacity-40">
            <div className={`h-[1px] w-12 ${rarity.bg}`} />
            <div className={`h-[1px] w-6  ${rarity.bg}`} />
          </div>
        </div>
      </div>

      {/* Bottom panel */}
      <div className="relative flex-1 bg-[#121316] px-4 py-3 flex flex-col justify-between border-t border-white/5">
        <div className="space-y-2" style={{ transform: "translateZ(30px)" }}>
          <div>
            <h3 className="font-bold text-white text-[15px] leading-tight line-clamp-1">{safeName}</h3>
            <p className="text-zinc-500 text-[11px] font-medium tracking-wide">{safeClub}</p>
            <p className={`text-[11px] mt-0.5 tracking-wide ${rarity.color}`}>{safePos}</p>
          </div>

          <div className="bg-[#18181a] border border-white/5 rounded p-2 font-light italic text-zinc-400 text-[11px]">
            Ability Base: {(player as any)?.overall_ability ?? "N/A"}
          </div>

          <AnimatePresence>
            {opponent && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`flex items-center justify-between bg-black/80 border ${rarity.border} rounded px-2 py-2`}
              >
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-tighter">Next Match</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[7px] font-black text-zinc-600 uppercase">vs</span>
                  <span className={`text-[11px] font-black uppercase ${rarity.color}`}>{opponent}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] text-zinc-500">Dyn. Value</span>
              <span className={`font-bold text-[15px] leading-none ${rarity.color}`}>
                {dynPoints.toFixed(1)} <span className="text-[9px] text-zinc-500 font-normal">pts</span>
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#2a2a2b] rounded-full overflow-hidden">
              <div className={`h-full ${rarity.bg}`} style={{ width: `${fill}%` }} />
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-white/5" style={{ transform: "translateZ(40px)" }}>
          <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold tracking-wide">
            <Wallet className="w-3.5 h-3.5 text-zinc-500" />
            £{cost.toFixed(1)}m
          </div>
          {trading ? (
            <button className="bg-indigo-500 text-black px-2.5 py-1 rounded text-xs font-bold hover:bg-indigo-400 transition-all">
              Swap
            </button>
          ) : (
            <span className="flex items-center gap-1 text-zinc-500 text-[10px] font-medium tracking-wide">
              <Zap className="w-3 h-3 text-indigo-500" /> Synced
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
