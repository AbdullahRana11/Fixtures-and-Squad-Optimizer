import React from 'react';
import { motion } from 'framer-motion';
import type { FixtureMatch } from '../api/api';

interface TVScheduleViewProps {
  fixtures: FixtureMatch[];
  leagueName?: string;
}

export const TVScheduleView: React.FC<TVScheduleViewProps> = ({ fixtures, leagueName }) => {
  // Group by matchweek, then by date/time
  const matchweeks = [...new Set(fixtures.map(f => Number(f.matchweek || 1)))].sort((a, b) => a - b);
  
  return (
    <div className="space-y-12 pb-20">
      {leagueName && (
        <div className="mb-8 px-4">
          <h2 className="text-3xl font-black text-white/20 uppercase tracking-[0.5em]">{leagueName}</h2>
          <div className="h-[2px] w-12 bg-emerald-500/30 mt-2" />
        </div>
      )}
      {matchweeks.map(mw => {
        const mwFixtures = fixtures.filter(f => f.matchweek === mw);
        // Group by broadcaster/time slot
        const slots = mwFixtures.reduce((acc, f) => {
          const key = `${f.date} ${f.time} | ${f.broadcaster}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push(f);
          return acc;
        }, {} as Record<string, FixtureMatch[]>);

        return (
          <div key={mw} className="space-y-6">
            <div className="flex items-center gap-4 px-4">
              <h3 className="text-emerald-400 font-bold tracking-[0.2em] text-sm uppercase">Matchweek {mw}</h3>
              <div className="flex-1 h-[1px] bg-emerald-500/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(slots).map(([slotKey, matches], idx) => {
                const [dateTime, broadcaster] = slotKey.split(' | ');
                const [date, time] = dateTime.split(' ');
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    key={slotKey} 
                    className="bg-[#0a0a0a] border border-white/5 rounded-3xl overflow-hidden shadow-xl"
                  >
                    {/* Slot Header */}
                    <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                        <span className="text-white text-lg font-bold">{time}</span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-tighter border border-emerald-500/20">
                          {broadcaster}
                        </span>
                      </div>
                    </div>

                    {/* Matches in Slot */}
                    <div className="p-4 space-y-4">
                      {matches.map(m => (
                        <div key={m.id} className="flex items-center justify-between gap-3 group">
                          <div className="flex-1 text-right">
                            <span className="text-zinc-300 text-xs font-medium group-hover:text-emerald-400 transition-colors">{m.home}</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-[10px] text-zinc-500 font-bold">VS</div>
                            {m.is_derby && <span className="text-[8px] text-orange-500 font-black uppercase">Derby</span>}
                          </div>
                          <div className="flex-1 text-left">
                            <span className="text-zinc-300 text-xs font-medium group-hover:text-emerald-400 transition-colors">{m.away}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Slot Footer Metrics */}
                    <div className="px-4 py-2 bg-black/40 border-t border-white/5 flex justify-between">
                      <span className="text-[9px] text-zinc-600 uppercase font-bold">Intensity: {matches[0].matchIntensity}</span>
                      <span className="text-[9px] text-zinc-600 uppercase font-bold">{matches[0].stadium}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
