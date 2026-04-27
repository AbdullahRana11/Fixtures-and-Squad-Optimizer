
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Calendar, 
  Check, 
  RefreshCw, Zap, Trophy, Users, Layout,
  FileType, FileJson, Sun, Moon, Thermometer,
  Star, Swords, Landmark
} from 'lucide-react';
import { 
  fictionalNames, prng, shuffle, 
  generateRoundRobin, generateKnockout,
  saveToHistory, exportToCSV, exportToJSON,
  assignAdvancedSchedule
} from '../utils/fixtureUtils';

// Tactical UI Components
import Hyperspeed from '../components/reactbits/Hyperspeed';
import GridScan from '../components/reactbits/GridScan';


type Format = 'round_robin' | 'knockout' | 'double_elim' | 'groups';

interface CustomSettings {
  name: string;
  format: Format;
  teamCount: number;
  legs: number;
  teams: string[];
  teamStrengths: number[]; // 1-5 scale
  startDate: string;
  matchFrequency: string;
  matchTime: string;
  venueMode: 'auto' | 'manual';
  stadiums: string[];
  seeding: boolean;
  neutralVenue: boolean;
  seed: number;
}

const CustomGenerator: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<CustomSettings>({
    name: 'Neo-League Genesis',
    format: 'round_robin',
    teamCount: 8,
    legs: 1,
    teams: Array(8).fill(''),
    teamStrengths: Array(8).fill(3),
    startDate: new Date().toISOString().split('T')[0],
    matchFrequency: '3',
    matchTime: '20:00',
    venueMode: 'auto',
    stadiums: Array(8).fill(''),
    seeding: true,
    neutralVenue: false,
    seed: Math.floor(Math.random() * 999999) + 1,
  });

  const [fixtures, setFixtures] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setSettings(prev => {
      const diff = prev.teamCount - prev.teams.length;
      if (diff === 0) return prev;

      const newTeams = [...prev.teams];
      const newStrengths = [...prev.teamStrengths];
      const newStadiums = [...prev.stadiums];

      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          newTeams.push('');
          newStrengths.push(3);
          newStadiums.push('');
        }
      } else {
        newTeams.splice(diff);
        newStrengths.splice(diff);
        newStadiums.splice(diff);
      }

      return { ...prev, teams: newTeams, teamStrengths: newStrengths, stadiums: newStadiums };
    });
  }, [settings.teamCount]);

  const handleRandomizeTeams = () => {
    const rng = prng(settings.seed);
    const pool = shuffle(fictionalNames, rng);
    setSettings(prev => ({
      ...prev,
      teams: prev.teams.map((_, i) => pool[i % pool.length]),
      teamStrengths: prev.teamStrengths.map(() => Math.floor(rng() * 5) + 1)
    }));
  };

  const generateFixtures = () => {
    setIsGenerating(true);
    // Fill empty names
    const finalTeams = settings.teams.map((t, i) => t.trim() || `FC ${fictionalNames[i % fictionalNames.length]}`);
    const finalSettings = { ...settings, teams: finalTeams };

    setTimeout(() => {
      let baseFixtures: any[] = [];
      if (finalSettings.format === 'round_robin') {
        baseFixtures = generateRoundRobin(finalSettings.teams, finalSettings.legs, finalSettings.seed);
      } else {
        const { matches } = generateKnockout(finalSettings.teams, finalSettings.seed);
        baseFixtures = matches;
      }

      // Advanced scheduler handles 2-match daily limit, Day/Night slots, and Weather
      const datedFixtures = assignAdvancedSchedule(
        baseFixtures, 
        finalSettings.startDate, 
        parseInt(finalSettings.matchFrequency), 
        finalSettings.neutralVenue, 
        finalSettings.seed
      );

      // rare feature: magnitude calculation (interest score)
      const enrichedFixtures = datedFixtures.map(f => {
        const hIdx = finalSettings.teams.indexOf(f.home);
        const aIdx = finalSettings.teams.indexOf(f.away);
        const magnitude = (finalSettings.teamStrengths[hIdx] + finalSettings.teamStrengths[aIdx]) / 2;
        return { ...f, magnitude };
      });

      setFixtures(enrichedFixtures);
      setIsGenerating(false);
      setStep(4);
    }, 1200);
  };

  const handleExportCSV = () => exportToCSV(fixtures, settings.name);
  const handleExportJSON = () => exportToJSON({ settings, fixtures }, settings.name);
  const saveToHistoryAndExport = () => {
    saveToHistory({ name: settings.name, format: settings.format, seed: settings.seed, teams: settings.teams, fixtures, source: 'Custom' });
    alert('Tournament archived in history.');
  };

  const renderStep1 = (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
          <Landmark className="w-3 h-3" /> Tournament Identity
        </label>
        <input 
          type="text" value={settings.name} 
          onChange={e => setSettings({...settings, name: e.target.value})} 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white font-black italic tracking-tight focus:border-emerald-500/50 outline-none transition-all"
          placeholder="ENTER TITLE..."
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Competition Format</label>
          <div className="relative group">
            <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <select 
              value={settings.format} onChange={e => setSettings({...settings, format: e.target.value as Format})}
              className="w-full bg-black border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white appearance-none outline-none group-hover:border-white/30 transition-all cursor-pointer"
            >
              <option value="round_robin">Round Robin (League)</option>
              <option value="knockout">Knockout (Bracket)</option>
              <option value="double_elim">Double Elimination</option>
              <option value="groups">Group Stage + Knockout</option>
            </select>
          </div>
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Participants</label>
          <div className="relative">
            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input 
              type="number" min={2} max={128} value={settings.teamCount} 
              onChange={e => setSettings({...settings, teamCount: parseInt(e.target.value) || 2})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-white outline-none"
            />
          </div>
        </div>
      </div>

      {settings.format === 'round_robin' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Leg Configuration</label>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(l => (
              <button 
                key={l} onClick={() => setSettings({...settings, legs: l})}
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${settings.legs === l ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/10 text-white/30 hover:border-white/30'}`}
              >
                <span className="text-xs font-black uppercase tracking-widest">{l === 1 ? 'Single Leg' : 'Double Leg'}</span>
                <span className="text-[9px] font-bold opacity-60">{l === 1 ? 'Play each team once' : 'Home & Away fixtures'}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep2 = (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black uppercase text-emerald-400">Team Alignment</h3>
          <p className="text-[10px] text-white/30 uppercase font-black">Configure names & seeding power</p>
        </div>
        <button onClick={handleRandomizeTeams} className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-emerald-500 hover:text-black transition-all">
          <RefreshCw className="w-3 h-3" /> Randomize All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {settings.teams.map((name, i) => (
          <div key={i} className="group relative flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/[0.05] transition-all">
            <span className="text-[10px] font-black text-white/10 w-4">{i+1}</span>
            <input 
              type="text" value={name} 
              onChange={e => {
                const next = [...settings.teams];
                next[i] = e.target.value;
                setSettings({...settings, teams: next});
              }}
              className="flex-1 bg-transparent border-none text-sm font-bold text-white outline-none"
              placeholder={`Club Name ${i+1}`}
            />
            <div className="flex items-center gap-1 bg-black/40 p-2 rounded-xl border border-white/5">
              {[1, 2, 3, 4, 5].map(s => (
                <Star 
                  key={s} 
                  className={`w-3 h-3 cursor-pointer transition-all ${s <= settings.teamStrengths[i] ? 'text-yellow-500 fill-yellow-500' : 'text-white/10'}`}
                  onClick={() => {
                    const next = [...settings.teamStrengths];
                    next[i] = s;
                    setSettings({...settings, teamStrengths: next});
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderStep3 = (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
       <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Start Date
          </label>
          <input type="date" value={settings.startDate} onChange={e => setSettings({...settings, startDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
             <Layout className="w-3 h-3" /> Days per Round
          </label>
          <input type="number" value={settings.matchFrequency} onChange={e => setSettings({...settings, matchFrequency: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-emerald-500/50" />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Venue Protocol</label>
        <div 
          onClick={() => setSettings({...settings, neutralVenue: !settings.neutralVenue})}
          className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-center justify-between ${settings.neutralVenue ? 'bg-emerald-500/10 border-emerald-500' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
        >
          <div className="flex gap-4 items-center">
            <Landmark className={`w-8 h-8 ${settings.neutralVenue ? 'text-emerald-400' : 'text-white/10'}`} />
            <div>
              <p className={`text-sm font-black uppercase ${settings.neutralVenue ? 'text-emerald-400' : 'text-white'}`}>World Neutral Arena Protocol</p>
              <p className="text-[10px] text-white/30 font-bold">Ignore home grounds; play in Wembley, Camp Nou, and Maracanã.</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-all ${settings.neutralVenue ? 'bg-emerald-500' : 'bg-white/10'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-all ${settings.neutralVenue ? 'translate-x-6' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-black/40 border border-white/5">
         <div>
            <p className="text-[10px] uppercase font-black text-white/40 mb-1">Algorithmic Seed</p>
            <p className="text-xs font-mono text-emerald-500/60 font-bold">#{settings.seed}</p>
         </div>
         <div className="text-right">
            <button onClick={() => setSettings({...settings, seed: Math.floor(Math.random() * 999999) + 1})} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
         </div>
      </div>
    </motion.div>
  );

  const renderStep4 = (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{settings.name}</h3>
          <div className="flex gap-2 mt-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-black uppercase tracking-widest">{settings.format.replace('_', ' ')}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest">{settings.legs} Leg(s)</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white">{fixtures.length}</p>
          <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Total Fixtures</p>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {fixtures.map((f, i) => (
          <motion.div 
            key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
            className="group relative p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all overflow-hidden"
          >
            {/* Rare Feature: Interest Bar */}
            <div className="absolute top-0 right-0 h-[2px] bg-emerald-500/20 transition-all group-hover:bg-emerald-500" style={{ width: `${(f.magnitude/5) * 100}%` }} />
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-white/10 uppercase bg-white/5 px-2 py-1 rounded-md">MW {f.matchweek}</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 border border-white/5">
                   {f.isNightMatch ? <Moon className="w-3 h-3 text-blue-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                   <span className="text-[9px] font-black text-white/40">{f.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/10">
                   <Thermometer className="w-3 h-3 text-emerald-400" />
                   <span className="text-[8px] font-black text-emerald-400 uppercase">{f.conditions.type} • {f.conditions.temp}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 px-4">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[9px] text-white/20 font-black uppercase">Home</span>
                <span className="text-base font-black text-white tracking-tight">{f.home}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-full bg-white/5 border border-white/5 group-hover:scale-110 transition-all">
                <Swords className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex-1 flex flex-col gap-1 text-right">
                <span className="text-[9px] text-white/20 font-black uppercase">Away</span>
                <span className="text-base font-black text-white tracking-tight">{f.away}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-[9px] text-white/20 font-black uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {new Date(f.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                <span className="flex items-center gap-1.5"><Landmark className="w-3 h-3" /> {f.stadium}</span>
              </div>
              {f.magnitude > 4 && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-black uppercase animate-pulse">
                  <Zap className="w-2 h-2" /> Top Clash
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-3">
        <button onClick={saveToHistoryAndExport} className="col-span-2 py-5 rounded-3xl bg-emerald-500 text-black font-black uppercase text-xs tracking-widest hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-3">
          <Check className="w-5 h-5" /> Save Tournament
        </button>
        <button onClick={handleExportCSV} className="py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex flex-col items-center gap-1 justify-center">
          <FileType className="w-4 h-4 text-white/40" /> CSV
        </button>
        <button onClick={handleExportJSON} className="py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex flex-col items-center gap-1 justify-center">
          <FileJson className="w-4 h-4 text-white/40" /> JSON
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#030408] relative overflow-hidden flex items-center justify-center p-6">
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
              leftCars: [0x10b981, 0x059669],
              rightCars: [0x10b981, 0x065f46],
              sticks: 0x10b981
            }
          }} 
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#030408]/80 via-[#030408]/40 to-[#030408]/90 pointer-events-none" />
        {/* Tactical Grid Scan Overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
          <GridScan color="#10b981" scanSpeed={1.2} />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-5xl bg-[#0a0b10]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_60px_150px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col md:flex-row min-h-[750px]">
        {/* Progress Sidebar */}
        <div className="w-full md:w-80 bg-black/50 border-r border-white/5 p-12 flex flex-col">
          <div className="flex items-center gap-4 mb-20">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-black shadow-lg shadow-emerald-500/20">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none">CUSTOM</h1>
              <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-1">v3.0 Advanced</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-6 group cursor-pointer" onClick={() => s < step && setStep(s)}>
                <div className={`w-1.5 h-12 rounded-full transition-all duration-500 ${step === s ? 'bg-emerald-500' : s < step ? 'bg-emerald-400/30' : 'bg-white/5'}`} />
                <div>
                  <p className={`text-[9px] uppercase font-black tracking-[0.2em] transition-colors ${step === s ? 'text-emerald-400' : 'text-zinc-700'}`}>Phase 0{s}</p>
                  <p className={`text-sm font-black uppercase tracking-tight transition-colors ${step === s ? 'text-white' : 'text-zinc-600'}`}>
                    {s === 1 ? 'Architecture' : s === 2 ? 'Alignment' : s === 3 ? 'Calibration' : 'Finalization'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => navigate('/fixtures')} className="mt-auto group flex items-center gap-3 text-zinc-600 hover:text-white transition-all text-xs font-black uppercase tracking-widest">
            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-all"><ArrowLeft className="w-4 h-4" /></div>
            Back Home
          </button>
        </div>

        {/* Dynamic Canvas */}
        <div className="flex-1 p-14 flex flex-col relative">
          <div className="flex-1">
             <AnimatePresence mode="wait">
                {step === 1 && renderStep1}
                {step === 2 && renderStep2}
                {step === 3 && renderStep3}
                {step === 4 && renderStep4}
             </AnimatePresence>
          </div>

          {step < 4 && (
            <div className="mt-12 flex justify-between items-center border-t border-white/5 pt-12">
              <button 
                onClick={() => setStep(s => Math.max(1, s-1))} disabled={step === 1}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 disabled:opacity-10 transition-all"
              >
                Previous
              </button>
              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => step === 3 ? generateFixtures() : setStep(s => s+1)}
                className="px-10 py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase text-xs tracking-widest hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all flex items-center gap-3"
              >
                {step === 3 ? 'Execute Algorithm' : 'Proceed'} <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 bg-[#0a0b10]/90 backdrop-blur-2xl flex flex-col items-center justify-center z-[100]">
               <div className="relative">
                  <motion.div 
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-24 h-24 rounded-full border-2 border-emerald-500/20 border-t-emerald-500"
                  />
                  <Zap className="absolute inset-0 m-auto w-8 h-8 text-emerald-400 animate-pulse" />
               </div>
               <div className="mt-8 text-center space-y-2">
                  <p className="text-sm font-black uppercase tracking-[0.4em] text-white">Synthesizing Schedule</p>
                  <p className="text-[10px] text-emerald-500/40 font-mono italic">Applying Tournament CSP & Day/Night Constraints</p>
               </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CustomGenerator;
