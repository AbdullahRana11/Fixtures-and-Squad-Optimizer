import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

interface DebugLogPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DebugLogPanel: React.FC<DebugLogPanelProps> = ({ isOpen, onClose }) => {
  const { debugLogs, clearDebugLogs } = useAppStore();
  const [filterType, setFilterType] = React.useState<'all' | 'info' | 'warning' | 'error'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredLogs = debugLogs.filter(log => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-8 w-[400px] max-h-[500px] bg-[#050505]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] z-[200] flex flex-col overflow-hidden"
        >
          <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-white text-xs font-bold uppercase tracking-widest">System Telemetry</h3>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={clearDebugLogs}
                className="text-[10px] text-zinc-500 hover:text-white transition-colors uppercase font-bold tracking-tighter"
              >
                Clear
              </button>
              <button 
                onClick={onClose}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="p-3 border-b border-white/5 space-y-3 bg-black/40">
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {['all', 'info', 'warning', 'error'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`
                    px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all
                    ${filterType === type 
                      ? 'bg-white/20 text-white border-white/20' 
                      : 'bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10'
                    }
                    border
                  `}
                >
                  {type}
                </button>
              ))}
            </div>
            
            <div className="relative">
              <input 
                type="text"
                placeholder="Search telemetry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
              />
              <svg className="absolute right-3 top-2.5 w-3 h-3 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 italic text-center py-8">
                {debugLogs.length === 0 ? 'No telemetry data captured...' : 'No matches found for active filters...'}
              </div>
            ) : (
              filteredLogs.map((log, idx) => (
                <div key={idx} className="flex gap-3 border-l border-white/5 pl-3 py-1 group hover:bg-white/5 transition-colors rounded-r">
                  <span className="text-zinc-600 shrink-0 select-none">[{log.timestamp}]</span>
                  <span className={`
                    leading-relaxed
                    ${log.type === 'error' ? 'text-red-400 font-bold' : ''}
                    ${log.type === 'warning' ? 'text-amber-400 font-medium' : ''}
                    ${log.type === 'info' ? 'text-emerald-400/90' : ''}
                  `}>
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
