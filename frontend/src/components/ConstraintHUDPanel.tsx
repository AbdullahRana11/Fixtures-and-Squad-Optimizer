import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

interface ConstraintHUDPanelProps {
  isOpen: boolean;
  onClose: () => void;
  teams: string[];
  totalMatchweeks: number;
}

export const ConstraintHUDPanel: React.FC<ConstraintHUDPanelProps> = ({ isOpen, onClose, teams, totalMatchweeks }) => {
  const { constraintProfile, setConstraintProfile, addDebugLog } = useAppStore();
  const [newLock, setNewLock] = useState({ home: '', away: '', matchweek: 1 });

  const addLock = () => {
    if (!newLock.home || !newLock.away || newLock.home === newLock.away) return;
    const current = constraintProfile.lockedFixtures || [];
    setConstraintProfile({
      lockedFixtures: [...current, { ...newLock }]
    });
    addDebugLog(`Pinned fixture: ${newLock.home} vs ${newLock.away} (MW ${newLock.matchweek})`);
    setNewLock({ home: '', away: '', matchweek: 1 });
  };
  const removeLock = (index: number) => {
    const current = [...(constraintProfile.lockedFixtures || [])];
    const lock = current[index];
    current.splice(index, 1);
    setConstraintProfile({ lockedFixtures: current });
    addDebugLog(`Unpinned fixture: ${lock.home} vs ${lock.away}`);
  };

  const toggleEuropean = (teamName: string) => {
    const current = constraintProfile.europeanTeams || [];
    if (current.includes(teamName)) {
      setConstraintProfile({ europeanTeams: current.filter(t => t !== teamName) });
      addDebugLog(`Removed ${teamName} from priority rest window.`);
    } else {
      setConstraintProfile({ europeanTeams: [...current, teamName] });
      addDebugLog(`Added ${teamName} to priority rest window.`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-md z-[120] bg-[#050505] border-l border-emerald-500/20 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-br from-emerald-900/10 to-transparent flex justify-between items-center">
            <div>
              <h2 className="text-emerald-400 font-bold tracking-tight text-lg">TACTICAL CONSTRAINTS</h2>
              <p className="text-zinc-500 text-xs uppercase tracking-widest">Configuration HUD</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Global Rules */}
            <section className="space-y-4">
              <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Core Engine Rules</h3>
              <div 
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:border-emerald-500/20 transition-colors"
                onClick={() => {
                  const newVal = !constraintProfile.geoCluster;
                  setConstraintProfile({ geoCluster: newVal });
                  addDebugLog(`Geographic Clustering: ${newVal ? 'ENABLED' : 'DISABLED'}`, newVal ? 'info' : 'warning');
                }}
              >
                <div>
                  <p className="text-white text-sm font-medium">Geographic Clustering</p>
                  <p className="text-zinc-500 text-[10px]">Prevent same-city teams being home simultaneously</p>
                </div>
                <div className={`w-10 h-6 rounded-full p-1 transition-colors ${constraintProfile.geoCluster ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full transition-transform ${constraintProfile.geoCluster ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </div>
            </section>

            {/* Fixture Locking */}
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Pinned Fixtures</h3>
                <span className="text-emerald-500 text-[10px] font-mono">{(constraintProfile.lockedFixtures || []).length} PINNED</span>
              </div>

              <div className="space-y-2 mb-4">
                {(constraintProfile.lockedFixtures || []).map((lock, idx) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl"
                  >
                    <div className="flex flex-col">
                      <span className="text-white text-xs font-bold">{lock.home} vs {lock.away}</span>
                      <span className="text-emerald-500/60 text-[10px] uppercase">Round {lock.matchweek}</span>
                    </div>
                    <button onClick={() => removeLock(idx)} className="text-zinc-600 hover:text-red-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-white/5 rounded-2xl space-y-3 border border-white/5">
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={newLock.home}
                    onChange={(e) => setNewLock({...newLock, home: e.target.value})}
                    className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Home Team</option>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select 
                    value={newLock.away}
                    onChange={(e) => setNewLock({...newLock, away: e.target.value})}
                    className="bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Away Team</option>
                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="MW"
                    min="1"
                    max={totalMatchweeks}
                    value={newLock.matchweek}
                    onChange={(e) => setNewLock({...newLock, matchweek: parseInt(e.target.value) || 1})}
                    className="w-20 bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs text-white"
                  />
                  <button 
                    onClick={addLock}
                    className="flex-1 bg-emerald-500 text-black text-xs font-bold rounded-lg hover:bg-emerald-400 transition-colors uppercase tracking-wider"
                  >
                    Pin Fixture
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-zinc-400 text-[10px] font-bold uppercase tracking-[0.2em]">Rest Window Management</h3>
              <p className="text-zinc-600 text-[10px] -mt-2">Selected teams will be granted a priority rest period in the schedule.</p>
              
              <div className="grid grid-cols-2 gap-2">
                {teams.map(team => (
                  <button
                    key={team}
                    onClick={() => toggleEuropean(team)}
                    className={`p-2 rounded-lg text-[10px] text-left transition-all border ${
                      (constraintProfile.europeanTeams || []).includes(team)
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-white/5 border-transparent text-zinc-500 hover:bg-white/10'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 bg-white/5 border-t border-white/5">
            <button 
              onClick={onClose}
              className="w-full py-4 bg-zinc-800 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-zinc-700 transition-colors"
            >
              Apply Config
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
