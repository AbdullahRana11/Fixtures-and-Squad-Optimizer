
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Calendar, 
  Check, ChevronRight,
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
  const [commandLog, setCommandLog] = useState<{text: string, type: 'info' | 'warn' | 'success'}[]>([]);
  const [persistedId, setPersistedId] = useState<string | null>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x, { stiffness: 200, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 200, damping: 20 });
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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

  const calculateMagnitude = (hIdx: number, aIdx: number) => {
    const s1 = settings.teamStrengths[hIdx] !== undefined ? settings.teamStrengths[hIdx] : 3;
    const s2 = settings.teamStrengths[aIdx] !== undefined ? settings.teamStrengths[aIdx] : 3;
    
    // Balanced mean + variance boost (closer matches between high-tier teams score higher)
    const mean = (s1 + s2) / 2;
    const variance = 1 / (Math.abs(s1 - s2) + 1);
    return parseFloat((mean * 0.7 + variance * 1.5).toFixed(2));
  };

  const saveTournamentToDB = async (fixturesToSave: any[]) => {
    try {
      const tournamentData = {
        type: settings.format === 'knockout' ? 'ucl' : 'league',
        name: settings.name,
        bracket: {
          rounds: settings.format === 'knockout' ? [{ name: 'Finals', matches: fixturesToSave, isComplete: false }] : [],
          fixtures: settings.format === 'round_robin' ? fixturesToSave : []
        },
        settings: {
          teams: settings.teams,
          strengths: settings.teamStrengths,
          format: settings.format
        }
      };

      const { data } = await axios.post('http://localhost:3000/api/tournaments/save', tournamentData);
      setCommandLog(prev => [...prev, { text: `PERSISTENCE ACHIEVED: ID ${data.id}`, type: 'success' }]);
      return data.id;
    } catch (err) {
      console.error('Persistence failed:', err);
      setCommandLog(prev => [...prev, { text: "STORAGE ERROR: OFFLINE MODE ENABLED", type: 'warn' }]);
      return null;
    }
  };

  const generateFixtures = () => {
    setIsGenerating(true);
    // Fill empty names
    const finalTeams = settings.teams.map((t, i) => t.trim() || `FC ${fictionalNames[i % fictionalNames.length]}`);
    const finalSettings = { ...settings, teams: finalTeams };

    const logSteps = [
      "SYNCHRONIZING TOURNAMENT IDENTITY...",
      "FETCHING PARTICIPANT MATRIX...",
      "CALIBRATING ROUND ROBIN ALGORITHM...",
      "CHECKING VENUE CONSTRAINTS...",
      "OPTIMIZING WEATHER DATA...",
      "FINALIZING SCHEDULE...",
    ];

    let currentLogIndex = 0;
    const logInterval = setInterval(() => {
      if (currentLogIndex < logSteps.length) {
         setCommandLog(prev => [...prev, { text: logSteps[currentLogIndex], type: 'info' }]);
         currentLogIndex++;
      }
    }, 450);

    setTimeout(async () => {
      try {
        clearInterval(logInterval);
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
          parseInt(finalSettings.matchFrequency) || 3, 
          finalSettings.neutralVenue, 
          finalSettings.seed
        );

        // rare feature: magnitude calculation (interest score)
        const enrichedFixtures = datedFixtures.map(f => {
          const hIdx = finalSettings.teams.indexOf(f.home);
          const aIdx = finalSettings.teams.indexOf(f.away);
          const magnitude = calculateMagnitude(hIdx, aIdx);
          return { ...f, magnitude };
        });

        setFixtures(enrichedFixtures);
        
        // Uplink to Database
        setCommandLog(prev => [...prev, { text: "UPLINKING TO TACTICAL CLOUD...", type: 'info' }]);
        const tournamentId = await saveTournamentToDB(enrichedFixtures);
        if (tournamentId) setPersistedId(tournamentId);
        
        setIsGenerating(false);
        setCommandLog([]);
        setStep(4);
        
        // Navigation context if needed
        if (tournamentId) {
          console.log("Tournament persisted with ID:", tournamentId);
        }
      } catch (err) {
        console.error('Generation Failed:', err);
        setCommandLog(prev => [...prev, { text: "CRITICAL SYSTEM ERROR: REBOOTING ALGORITHM...", type: 'warn' }]);
        setTimeout(() => setIsGenerating(false), 1000);
      }
    }, 3200); 
  };

  const handleExportCSV = () => exportToCSV(fixtures, settings.name);
  const handleExportJSON = () => exportToJSON({ settings, fixtures }, settings.name);
  const saveToHistoryAndExport = () => {
    saveToHistory({ name: settings.name, format: settings.format, seed: settings.seed, teams: settings.teams, fixtures, source: 'Custom' });
    alert('Tournament archived in history.');
  };

  const renderStep1 = (
    <motion.div 
      key="step1"
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="space-y-6 p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 tactical-glass relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
      </div>
      <div className="neon-scanline opacity-5" />
      <div className="space-y-2">
        <label className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
          <Landmark className="w-3 h-3" /> Tournament Identity
        </label>
        <input 
          type="text" value={settings.name} 
          onChange={e => setSettings({...settings, name: e.target.value})} 
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white font-black italic tracking-tight focus:border-teal-500/50 outline-none transition-all shadow-[inset_0_0_20px_rgba(45,212,191,0.05)]"
          placeholder="ENTER TITLE..."
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Competition Format</label>
          <div className="relative group">
            <Trophy className="absolute left-4 top-1/2 -tranzinc-y-1/2 w-4 h-4 text-teal-400" />
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
            <Users className="absolute left-4 top-1/2 -tranzinc-y-1/2 w-4 h-4 text-teal-400" />
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
                className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-1 ${settings.legs === l ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-[0_0_20px_rgba(45,212,191,0.2)]' : 'bg-white/5 border-white/10 text-white/30 hover:border-white/30'}`}
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
    <motion.div 
      key="step2"
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="space-y-6 p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 tactical-glass relative overflow-hidden flex flex-col h-full"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
      </div>
      <div className="neon-scanline opacity-5" />
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black uppercase text-teal-400">Team Alignment</h3>
          <p className="text-[10px] text-white/30 uppercase font-black">Configure names & seeding power</p>
        </div>
        <button onClick={handleRandomizeTeams} className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-[10px] font-black uppercase flex items-center gap-2 hover:bg-teal-500 hover:text-black transition-all shadow-[0_0_15px_rgba(45,212,191,0.2)]">
          <RefreshCw className="w-3 h-3" /> Randomize All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1" style={{ maxHeight: 'max(40vh, 300px)' }}>
        {settings.teams.map((name, i) => (
          <div key={i} className="group relative flex items-center gap-2 md:gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-2xl hover:bg-white/[0.05] transition-all">
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
    <motion.div 
      key="step3"
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }} 
      className="space-y-6 p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 tactical-glass relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
      </div>
      <div className="neon-scanline opacity-5" />
       <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Start Date
          </label>
          <input type="date" value={settings.startDate} onChange={e => setSettings({...settings, startDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-teal-500/50" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-black text-white/30 tracking-widest flex items-center gap-2">
             <Layout className="w-3 h-3" /> Days per Round
          </label>
          <input type="number" value={settings.matchFrequency} onChange={e => setSettings({...settings, matchFrequency: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-teal-500/50" />
        </div>
      </div>

      <div className="space-y-4">
        <label className="text-[10px] uppercase font-black text-white/30 tracking-widest">Venue Protocol</label>
        <div 
          onClick={() => setSettings({...settings, neutralVenue: !settings.neutralVenue})}
          className={`p-6 rounded-3xl border cursor-pointer transition-all flex items-center justify-between ${settings.neutralVenue ? 'bg-teal-500/10 border-teal-500 shadow-[0_0_30px_rgba(45,212,191,0.15)]' : 'bg-white/2 border-white/5 hover:border-white/20'}`}
        >
          <div className="flex gap-4 items-center">
            <Landmark className={`w-8 h-8 ${settings.neutralVenue ? 'text-teal-400' : 'text-white/10'}`} />
            <div>
              <p className={`text-sm font-black uppercase ${settings.neutralVenue ? 'text-teal-400' : 'text-white'}`}>World Neutral Arena Protocol</p>
              <p className="text-[10px] text-white/30 font-bold">Ignore home grounds; play in Wembley, Camp Nou, and Maracanã.</p>
            </div>
          </div>
          <div className={`w-12 h-6 rounded-full p-1 transition-all ${settings.neutralVenue ? 'bg-teal-500' : 'bg-white/10'}`}>
            <div className={`w-4 h-4 rounded-full bg-white transition-all ${settings.neutralVenue ? 'tranzinc-x-6' : 'tranzinc-x-0'}`} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 p-6 rounded-3xl bg-black/40 border border-white/5">
          <div>
            <p className="text-[10px] uppercase font-black text-white/40 mb-1">Algorithmic Seed</p>
            <p className="text-xs font-mono text-teal-500/60 font-bold">#{settings.seed}</p>
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
    <motion.div 
      key="step4"
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="space-y-4 p-6 md:p-8 rounded-[2rem] bg-white/[0.01] border border-white/5 tactical-glass relative overflow-hidden flex flex-col h-full"
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-br" />
      </div>
      <div className="neon-scanline opacity-10" />
      <div className="flex justify-between items-end border-b border-white/5 pb-6">
        <div>
          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{settings.name}</h3>
          <div className="flex gap-2 mt-2">
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 font-black uppercase tracking-widest">{settings.format.replace('_', ' ')}</span>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest">{settings.legs} Leg(s)</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-white">{fixtures.length}</p>
          <p className="text-[9px] text-white/20 uppercase font-black tracking-widest">Total Fixtures</p>
        </div>
      </div>

      <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar flex-1" style={{ maxHeight: 'max(40vh, 300px)' }}>
        {fixtures.map((f, i) => (
          <motion.div 
            key={i} initial={{ opacity: 0, y: 20, z: -20 }} animate={{ opacity: 1, y: 0, z: 0 }} transition={{ delay: i * 0.02 }}
            className="group relative p-6 rounded-3xl tactical-glass border-white/5 hover:border-teal-500/30 hover:bg-white/[0.03] transition-all overflow-hidden"
            style={{ transformStyle: 'preserve-3d', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            {/* HUD Corners for Match Card */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity">
               <div className="hud-corner hud-corner-tl" style={{ borderColor: '#2dd4bf' }} />
               <div className="hud-corner hud-corner-br" style={{ borderColor: '#2dd4bf' }} />
            </div>
            {/* Rare Feature: Interest Bar */}
            <div className="absolute top-0 right-0 h-[2px] bg-teal-500/20 transition-all group-hover:bg-teal-500" style={{ width: `${(Math.min(5, f.magnitude || 0)/5) * 100}%` }} />
            
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-black text-white/10 uppercase bg-white/5 px-2 py-1 rounded-md">MW {f.matchweek}</span>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/40 border border-white/5">
                   {f.isNightMatch ? <Moon className="w-3 h-3 text-teal-400" /> : <Sun className="w-3 h-3 text-amber-500" />}
                   <span className="text-[9px] font-black text-white/40">{f.time}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-teal-500/10 border border-teal-500/10">
                    <Thermometer className="w-3 h-3 text-teal-400" />
                    <span className="text-[8px] font-black text-teal-400 uppercase">{f.conditions.type} • {f.conditions.temp}°C</span>
                 </div>
              </div>
            </div>

            {/* Probability Telemetry Bar */}
            <div className="mb-4 space-y-1">
               <div className="flex justify-between items-center text-[7px] font-black uppercase tracking-[0.2em] text-white/20">
                  <span>Probability Matrix</span>
                  <span className="text-teal-400">{((f.magnitude || 0) * 20).toFixed(1)}% COEFFICIENT</span>
               </div>
               <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden flex">
                  <motion.div 
                    initial={{ width: 0 }} animate={{ width: `${(Math.min(5, f.magnitude || 0)/5) * 100}%` }}
                    className="h-full bg-gradient-to-r from-teal-500 to-violet-500 shadow-[0_0_10px_rgba(45,212,191,0.5)]" 
                  />
               </div>
            </div>

            <div className="flex items-center gap-2 md:gap-6 px-2 md:px-4">
              <div className="flex-1 flex flex-col gap-1 w-[40%]">
                <span className="text-[9px] text-white/20 font-black uppercase">Home</span>
                <span className="text-sm md:text-base font-black text-white tracking-tight truncate">{f.home}</span>
              </div>
              <div className="flex flex-col items-center justify-center p-2 md:p-3 rounded-full bg-white/5 border border-white/5 group-hover:scale-110 transition-all shadow-[0_0_15px_rgba(45,212,191,0.1)] shrink-0">
                <Swords className="w-3 h-3 md:w-4 md:h-4 text-white/20 group-hover:text-teal-400 transition-colors" />
              </div>
              <div className="flex-1 flex flex-col gap-1 text-right w-[40%]">
                <span className="text-[9px] text-white/20 font-black uppercase">Away</span>
                <span className="text-sm md:text-base font-black text-white tracking-tight truncate">{f.away}</span>
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
        <button onClick={saveToHistoryAndExport} className="col-span-2 py-5 rounded-3xl bg-teal-500 text-black font-black uppercase text-xs tracking-widest hover:bg-teal-400 shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-3">
          <Check className="w-5 h-5" /> Save Tournament
        </button>
        <button onClick={handleExportCSV} className="py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex flex-col items-center gap-1 justify-center">
          <FileType className="w-4 h-4 text-white/40" /> CSV
        </button>
        <button onClick={handleExportJSON} className="py-5 rounded-3xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all flex flex-col items-center gap-1 justify-center">
          <FileJson className="w-4 h-4 text-white/40" /> JSON
        </button>
      </div>

      {persistedId && settings.format === 'knockout' && (
        <motion.button 
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/fixtures/ucl-bracket?id=${persistedId}`)}
          className="w-full py-6 rounded-3xl bg-violet-600/20 border border-violet-500/30 text-violet-400 font-black uppercase text-xs tracking-[0.4em] hover:bg-violet-600 hover:text-white transition-all flex items-center justify-center gap-4 group"
        >
          <Trophy className="w-5 h-5 group-hover:rotate-12 transition-transform" /> 
          OPEN TACTICAL BRACKET 
          <ChevronRight className="w-5 h-5 group-hover:tranzinc-x-1 transition-transform" />
        </motion.button>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#02040A] relative overflow-hidden flex items-center justify-center p-6 perspective-[1500px]">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 z-0 opacity-40">
           <Hyperspeed 
             effectOptions={{
               distortion: 'turbulentDistortion',
               speedUp: 8,
               length: 400,
               roadWidth: 10,
               islandWidth: 2,
               lanesPerRoad: 3,
               colors: {
                 roadColor: 0x02040a,
                 islandColor: 0x02040a,
                 background: 0x000000,
                 shoulderLines: 0x2dd4bf,
                 brokenLines: 0x2dd4bf,
                 leftCars: [0x2dd4bf, 0x14b8a6],
                 rightCars: [0xa855f7, 0x7c3aed],
                 sticks: 0x2dd4bf
               }
             }} 
           />
        </div>
        <div className="absolute inset-0 bg-[#02040A]/60 backdrop-blur-[2px] pointer-events-none" />
        
        {/* Advanced Tactical Grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ 
               backgroundImage: `radial-gradient(circle at 2px 2px, rgba(45,212,191,0.4) 1px, transparent 0)`,
               backgroundSize: '40px 40px',
               transform: 'perspective(1000px) rotateX(60deg) translateY(-200px) scale(2)',
               transformOrigin: 'top'
             }} 
        />
        
        {/* Tactical Grid Scan Overlay - Increased intensity */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60 mix-blend-screen">
          <GridScan color="#2dd4bf" scanSpeed={4.0} />
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 100, scale: 0.9, rotateX: 20 }} 
        animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }} 
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ 
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY,
          perspective: '2000px'
        }}
        className="relative z-10 w-full max-w-6xl tactical-glass border-teal-500/20 rounded-[2rem] md:rounded-[3rem] shadow-[0_0_150px_rgba(0,0,0,0.8)] flex flex-col md:flex-row min-h-[80vh] max-h-[95vh] overflow-hidden"
      >
        {/* Global HUD Accents */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
           <div className="hud-corner hud-corner-tl" />
           <div className="hud-corner hud-corner-tr" />
           <div className="hud-corner hud-corner-bl" />
           <div className="hud-corner hud-corner-br" />
        </div>
        {/* Progress Sidebar */}
        <motion.div 
          style={{ transform: 'translateZ(60px)', transformStyle: 'preserve-3d' }}
          className="w-full md:w-80 bg-black/60 border-b md:border-b-0 md:border-r border-white/5 p-6 md:p-12 flex flex-col relative z-20 rounded-t-[2rem] md:rounded-l-[3rem] md:rounded-tr-none shrink-0"
        >
          <div className="flex items-center gap-4 mb-8 md:mb-20">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-black shadow-lg shadow-teal-500/30">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter text-white leading-none drop-shadow-md">CUSTOM</h1>
              <p className="text-[10px] text-teal-400/80 font-black uppercase tracking-widest mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                v4.0 Advanced
              </p>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6 flex-1 hidden md:block">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex items-center gap-6 group cursor-pointer" onClick={() => s < step && setStep(s)}>
                <div className={`w-1.5 h-12 rounded-full transition-all duration-500 ${step === s ? 'bg-teal-500 shadow-[0_0_15px_rgba(45,212,191,0.5)]' : s < step ? 'bg-teal-400/30' : 'bg-white/5'}`} />
                <div>
                  <p className={`text-[9px] uppercase font-black tracking-[0.2em] transition-colors ${step === s ? 'text-teal-400' : 'text-zinc-700'}`}>Phase 0{s}</p>
                  <p className={`text-sm font-black uppercase tracking-tight transition-colors ${step === s ? 'text-white drop-shadow-sm' : 'text-zinc-600'}`}>
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
        </motion.div>

        {/* Dynamic Canvas */}
        <motion.div 
          style={{ transform: 'translateZ(90px)', transformStyle: 'preserve-3d' }}
          className="flex-1 p-6 md:p-10 lg:p-14 flex flex-col relative rounded-b-[2rem] md:rounded-r-[3rem] md:rounded-bl-none overflow-y-auto custom-scrollbar"
        >
          <div className="flex-1 flex flex-col justify-center" style={{ transform: 'translateZ(30px)' }}>
             <AnimatePresence mode="wait">
                {step === 1 && renderStep1}
                {step === 2 && renderStep2}
                {step === 3 && renderStep3}
                {step === 4 && renderStep4}
             </AnimatePresence>
          </div>

          {step < 4 && (
            <div className="mt-8 md:mt-12 flex justify-between items-center border-t border-white/5 pt-6 md:pt-12 relative z-[60] shrink-0">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setStep(s => Math.max(1, s-1));
                }} 
                disabled={step === 1}
                className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-widest hover:bg-white/10 disabled:opacity-10 transition-all cursor-pointer relative z-[70]"
              >
                Previous
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (step === 3) generateFixtures();
                  else setStep(s => s+1);
                }}
                className="px-6 md:px-10 py-3 md:py-4 rounded-2xl bg-teal-500 text-black font-black uppercase text-xs tracking-widest hover:bg-teal-400 shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all flex items-center gap-2 md:gap-3 cursor-pointer relative z-[70]"
              >
                {step === 3 ? 'Execute Algorithm' : 'Proceed'} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {isGenerating && (
            <div className="absolute inset-0 tactical-glass flex flex-col items-center justify-center z-[100] rounded-[3rem] p-12 overflow-hidden">
               <div className="absolute inset-0 pointer-events-none opacity-20">
                  <GridScan color="#2dd4bf" scanSpeed={10} />
               </div>
               <div className="neon-scanline opacity-40" />

               <div className="relative mb-12">
                  <motion.div 
                    animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-40 h-40 rounded-full border-4 border-teal-500/10 border-t-teal-500 shadow-[0_0_80px_rgba(45,212,191,0.4)]"
                  />
                  <Zap className="absolute inset-0 m-auto w-12 h-12 text-teal-400 animate-pulse drop-shadow-[0_0_20px_rgba(45,212,191,1)]" />
                  
                  {/* Floating Data Bits */}
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0], 
                        scale: [0, 1, 0.5],
                        x: Math.cos(i * 45 * Math.PI / 180) * 100,
                        y: Math.sin(i * 45 * Math.PI / 180) * 100
                      }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                      className="absolute top-1/2 left-1/2 w-1 h-1 bg-teal-400 rounded-full"
                    />
                  ))}
               </div>

               <div className="w-full max-w-md space-y-4">
                  <div className="text-center space-y-2">
                    <p className="text-xl font-black uppercase tracking-[0.6em] text-white drop-shadow-md">NEURAL SYNTHESIS</p>
                    <p className="text-[10px] text-teal-400 font-mono italic opacity-60 tracking-widest">EXECUTING TOURNAMENT LOGIC v4.0.2</p>
                  </div>

                  <div className="bg-black/60 border border-white/10 rounded-2xl p-6 h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none z-10" />
                    <div className="space-y-2">
                       {commandLog.map((log, i) => (
                         <motion.div 
                           key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                           className="flex items-center gap-3"
                         >
                           <span className="text-[10px] text-teal-500/40 font-mono">[{new Date().toLocaleTimeString()}]</span>
                           <span className="text-[10px] text-teal-400 font-black tracking-widest uppercase">{log.text}</span>
                         </motion.div>
                       ))}
                    </div>
                  </div>
               </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CustomGenerator;
