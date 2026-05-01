import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Activity, Cpu, BarChart3, TrendingUp, ShieldCheck, Target } from 'lucide-react';

// Tactical UI Components
import Hyperspeed from '../components/reactbits/Hyperspeed';
import GridScan from '../components/reactbits/GridScan';
import DecryptedText from '../components/reactbits/DecryptedText';
import TiltedCard from '../components/reactbits/TiltedCard';

function StatRow({ label, value, color }: { label: string, value: any, color: string }) {
  return (
    <div className="flex items-center justify-between py-2 group/row">
      <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest group-hover/row:text-white/60 transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-3">
        <div className="h-[1px] w-8 bg-white/5 group-hover/row:w-12 transition-all group-hover/row:bg-white/20" />
        <span className="text-sm font-black italic tracking-tighter" style={{ color }}>
          {value}
        </span>
      </div>
    </div>
  );
}

function StatCard({ title, rows, icon: Icon, accentColor, telemetry }: { 
  title: string, 
  rows: any[], 
  icon: any, 
  accentColor: string,
  telemetry: string
}) {
  return (
    <TiltedCard
      maxTilt={10}
      glareColor={accentColor}
      className="w-full"
    >
      <div className="relative p-8 rounded-3xl border border-white/5 bg-black/60 backdrop-blur-3xl overflow-hidden group tactical-glass">
        <div className="neon-scanline opacity-10" />
        {/* HUD Decoration */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="hud-corner hud-corner-tl opacity-20 group-hover:opacity-100 transition-opacity" style={{ borderColor: accentColor }} />
          <div className="hud-corner hud-corner-br opacity-20 group-hover:opacity-100 transition-opacity" style={{ borderColor: accentColor }} />
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 group-hover:border-white/10 transition-colors">
              <Icon className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-teal-400/30 group-hover:text-teal-400/50 transition-colors font-mono">
                {telemetry}
              </h3>
              <p className="text-xl font-black text-white italic uppercase tracking-tighter">
                {title}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {rows.map((row, i) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-white italic tracking-tight">{row.name}</span>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(row).filter(([key]) => key !== 'name').map(([key, val]) => (
                  <StatRow key={key} label={key} value={val} color={accentColor} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </TiltedCard>
  );
}

export default function Stats() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('http://localhost:3000/api/stats/players');
        setPlayers(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const topScorers = players
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5)
    .map(p => ({ name: p.name, goals: p.goals, club: p.club }));

  const topAssisters = players
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5)
    .map(p => ({ name: p.name, assists: p.assists, club: p.club }));

  const topCleanSheets = players
    .sort((a, b) => b.clean_sheets - a.clean_sheets)
    .slice(0, 5)
    .map(p => ({ name: p.name, 'clean sheets': p.clean_sheets, club: p.club }));

  const efficiencyIndex = players
    .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
    .slice(0, 5)
    .map(p => ({ name: p.name, 'G+A': p.goals + p.assists, club: p.club }));

  return (
    <div className="min-h-screen bg-[#02040A] text-white relative overflow-hidden">
      {/* Immersive HUD Background */}
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
              brokenLines: 0x8b5cf6,
              leftCars: [0x2dd4bf, 0x14b8a6, 0x0f766e],
              rightCars: [0x8b5cf6, 0x7c3aed, 0x6d28d9],
              sticks: 0xf59e0b
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#02040A]/95 via-[#02040A]/40 to-[#02040A]/95 pointer-events-none" />
        <GridScan color="#2dd4bf" scanSpeed={3.5} />
      </div>

      <div className="relative z-10 max-w-[1800px] mx-auto p-12 md:p-24">
        {/* Header Section */}
        <header className="mb-20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-[1px] bg-teal-500/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.5em] text-teal-400/60 font-mono">
              Biometric Data Analytics // Sector 07
            </span>
          </div>
          
          <h1 className="text-7xl md:text-9xl font-black text-white italic uppercase tracking-tighter leading-none mb-8">
            <DecryptedText text="PERFORMANCE" animateOn="view" />
            <br/>
            <span className="text-teal-400">
              <DecryptedText text="TELEMETRY" animateOn="view" />
            </span>
          </h1>

          <div className="flex flex-wrap gap-8">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 border border-white/5 backdrop-blur-xl">
              <Activity className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Real-time Feed: {loading ? 'Syncing...' : 'Active'}</span>
            </div>
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-black/40 border border-white/5 backdrop-blur-xl">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Engine: Nightshade-Ember</span>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
          <StatCard 
            title="Elite Scorers" 
            rows={topScorers} 
            icon={Target} 
            accentColor="#2dd4bf" 
            telemetry="Offensive Impact"
          />
          <StatCard 
            title="Surgical Assisters" 
            rows={topAssisters} 
            icon={TrendingUp} 
            accentColor="#a855f7" 
            telemetry="Playmaking Metrics"
          />
          <StatCard 
            title="Points Dominance" 
            rows={efficiencyIndex} 
            icon={BarChart3} 
            accentColor="#f59e0b" 
            telemetry="Efficiency Index"
          />
          <StatCard 
            title="Defensive Shields" 
            rows={topCleanSheets} 
            icon={ShieldCheck} 
            accentColor="#f43f5e" 
            telemetry="Protection Rating"
          />
        </div>

        {/* System Footer */}
        <footer className="mt-24 pt-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 opacity-20">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Auth Protocol</span>
              <span className="text-[10px] font-black text-white">L01-OPTIMIZER</span>
            </div>
            <div className="h-8 w-[1px] bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[8px] font-mono uppercase tracking-[0.4em]">Status</span>
              <span className="text-[10px] font-black text-teal-400">ENCRYPTED</span>
            </div>
          </div>
          <p className="text-[8px] font-mono uppercase tracking-[0.5em]">
            © 2026 TACTICAL COMMAND // ALL RIGHTS RESERVED
          </p>
        </footer>
      </div>
    </div>
  );
}

