
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Search, Filter, History, Download, Eye } from 'lucide-react';
import { getHistory, deleteHistoryEntry, clearAllHistory, HistoryEntry } from '../utils/fixtureUtils';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onView: (entry: HistoryEntry) => void;
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ isOpen, onClose, onView }) => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'teams'>('date');

  useEffect(() => {
    if (isOpen) {
      setHistory(getHistory());
    }
  }, [isOpen]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this fixture?')) {
      deleteHistoryEntry(id);
      setHistory(getHistory());
    }
  };

  const handleClearAll = () => {
    if (confirm('CRITICAL: This will wipe all saved history. Proceed?')) {
      clearAllHistory();
      setHistory([]);
    }
  };

  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.teams.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesSource = sourceFilter === 'all' || item.source === sourceFilter;
      return matchesSearch && matchesSource;
    })
    .sort((a, b) => {
      if (sortBy === 'date') return b.dateGenerated - a.dateGenerated;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.teams.length - a.teams.length;
    });

  const downloadFile = (data: any, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = (item: HistoryEntry) => {
    downloadFile(JSON.stringify(item, null, 2), `${item.name}-fixtures.json`, 'application/json');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-black border-l border-white/5 z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight">Fixture History</h2>
                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
                    {history.length} / 50 entries stored
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-4 space-y-4 border-b border-white/5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -tranzinc-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="text"
                  placeholder="Filter by name or team..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-indigo-500/50 outline-none transition-all"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Filter className="absolute left-2.5 top-1/2 -tranzinc-y-1/2 w-3 h-3 text-white/20" />
                  <select
                    value={sourceFilter}
                    onChange={e => setSourceFilter(e.target.value)}
                    className="w-full bg-white/5 border border-white/5 rounded-lg pl-8 pr-2 py-1.5 text-[10px] uppercase font-bold outline-none appearance-none"
                  >
                    <option value="all">All Sources</option>
                    <option value="UCL">UCL</option>
                    <option value="Premier League">Premier League</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div className="flex-1 relative">
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="w-full bg-white/5 border border-white/5 rounded-lg px-2 py-1.5 text-[10px] uppercase font-bold outline-none appearance-none"
                  >
                    <option value="date">Newest First</option>
                    <option value="name">Name A-Z</option>
                    <option value="teams">Team Count</option>
                  </select>
                </div>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {filteredHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <History className="w-12 h-12 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest">No Records Found</p>
                </div>
              ) : (
                filteredHistory.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest py-1 px-2 rounded-md bg-white/5 text-white/40">
                        {item.source}
                      </span>
                      <span className="text-[9px] text-white/20 font-mono">
                        {new Date(item.dateGenerated).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-white mb-1 group-hover:text-indigo-400 transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-4">
                      {item.format} • {item.teams.length} Teams
                    </p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => onView(item)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-black transition-all"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button
                        onClick={() => exportJSON(item)}
                        className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/5 rounded-lg hover:border-white/30 transition-all text-white/50"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-10 h-10 flex items-center justify-center bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500 hover:border-red-500 text-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            {history.length > 0 && (
              <div className="p-4 border-t border-white/5">
                <button
                  onClick={handleClearAll}
                  className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest hover:bg-red-500/10 transition-all"
                >
                  Clear All History
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default HistoryDrawer;
