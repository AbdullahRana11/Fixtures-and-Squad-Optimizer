import React from "react";
import { topBatsmen, topBowlers } from "../data/mockData";
import batsBg from "../assets/pics/Top_Batsmen.png";
import bowlBg from "../assets/pics/Top_Bowlers.png";
import ptsBg from "../assets/pics/Points_Leader.png";
import impactBg from "../assets/pics/Bowling_impact.png";
import pslBackground from "../assets/pics/PSL-Background.png";

function StatList({ title, rows, leftKey, rightKey, bgImage }: { title: string, rows: any[], leftKey: string, rightKey: string, bgImage?: string }) {
  return (
    <section 
      className={`rounded-xl border border-white/5 p-4 shadow-lg ${!bgImage ? "bg-black/20 backdrop-blur-md" : ""}`}
      style={bgImage ? {
        backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 6, 0.8), rgba(7, 11, 8, 0.9)), url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      } : {}}
    >
      <h3 className="mb-4 inline-block bg-gradient-to-r from-emerald-300 via-emerald-200 to-lime-200 bg-clip-text text-xs font-extrabold uppercase tracking-[0.2em] text-transparent drop-shadow-md md:text-sm">
        {title}
      </h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div
            key={row.name}
            className="ui-hover-chip flex cursor-pointer items-center justify-between rounded-md border border-lime-100/10 bg-black/88 px-4 py-3 text-xs text-zinc-100 transition-all hover:border-lime-400/50 hover:bg-lime-900/40 hover:shadow-[0_0_15px_rgba(163,230,53,0.2)]"
          >
            <p className="font-extrabold tracking-wide text-emerald-100">{row.name}</p>
            <div className="text-right font-medium text-emerald-200/80">
              <p>{leftKey}: {row[leftKey]}</p>
              <p>{rightKey}: {row[rightKey]}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Stats() {
  return (
    <>
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(5, 10, 6, 0.3), rgba(7, 11, 8, 0.62), rgba(10, 14, 8, 0.85)), url(${pslBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="relative z-10 columns-1 gap-4 space-y-4 md:columns-2">
        <StatList title="Top Goalscorers" rows={topBatsmen} leftKey="goals" rightKey="xG" bgImage={batsBg} />
        <StatList title="Top Assisters" rows={topBowlers} leftKey="assists" rightKey="xA" bgImage={bowlBg} />
        <StatList title="Fantasy Points Leaders" rows={topBatsmen} leftKey="points" rightKey="xG" bgImage={ptsBg} />
        <StatList title="Defensive Impact" rows={topBowlers} leftKey="clean_sheets" rightKey="tackles" bgImage={impactBg} />
      </div>
    </>
  );
}
