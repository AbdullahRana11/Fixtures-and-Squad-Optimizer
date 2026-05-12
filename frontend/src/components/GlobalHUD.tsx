// ============================================================
// GlobalHUD.tsx  —  NEW FILE: frontend/src/components/GlobalHUD.tsx
// Persistent overlay on every screen:
//   • Theme color swatches (always visible)
//   • Universal Back button
//   • Breadcrumb trail
//   • Backend health banner
//   • Sound toggle
// ============================================================
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, ThemeVariant, AppMode, FixtureView } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';
import { Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';

const THEME_SWATCHES: { id: ThemeVariant; color: string; name: string }[] = [
  { id: 'mint-cyan',    color: '#00F260', name: 'Mint' },
  { id: 'purple-rose',  color: '#B026FF', name: 'Purple' },
  { id: 'gold-cyan',    color: '#FFB800', name: 'Gold' },
  { id: 'mint-purple',  color: '#05D5FF', name: 'Cyan' },
  { id: 'monochrome',   color: '#FFFFFF', name: 'Mono' },
  { id: 'light-mono',   color: '#000000', name: 'Light' },
];

// Build breadcrumb from app state
function useBreadcrumb(): string[] {
  const { appMode, fixtureView, selectedLeague } = useAppStore();
  const crumbs: string[] = ['HOME'];

  if (appMode === 'fixture-generator' || appMode === 'squad-optimizer') {
    crumbs.push(appMode === 'fixture-generator' ? 'FIXTURES' : 'SQUAD');
  }
  if (appMode === 'fixture-generator') {
    if (fixtureView === 'team-select') crumbs.push(selectedLeague?.toUpperCase() || 'LEAGUE');
    if (fixtureView === 'fixture-display') {
      crumbs.push(selectedLeague?.toUpperCase() || 'LEAGUE');
      crumbs.push('RESULTS');
    }
  }
  return crumbs;
}

// Resolve what "back" means from current state
function useBackAction(): (() => void) | null {
  const { appMode, fixtureView, setAppMode, setFixtureView, resetFixtureState } = useAppStore();

  if (appMode === 'entry') return null;
  if (appMode === 'mode-select') return () => setAppMode('entry');
  if (appMode === 'squad-optimizer') return () => setAppMode('mode-select');
  if (appMode === 'fixture-generator') {
    if (fixtureView === 'league-select') return () => setAppMode('mode-select');
    if (fixtureView === 'team-select') return () => setFixtureView('league-select');
    if (fixtureView === 'fixture-display') return () => setFixtureView('team-select');
  }
  return null;
}

export const GlobalHUD: React.FC = () => {
  const { theme, setTheme, soundEnabled, toggleSound, appMode } = useAppStore();
  const breadcrumb = useBreadcrumb();
  const backAction = useBackAction();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [showBanner, setShowBanner] = useState(false);

  // Poll backend health every 15s
  useEffect(() => {
    const check = () => {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/fpl/players`, {
        signal: AbortSignal.timeout(3000),
      })
        .then(() => { setBackendOnline(true); setShowBanner(false); })
        .catch(() => { setBackendOnline(false); setShowBanner(true); });
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, []);

  const handleBack = () => {
    if (backAction) {
      soundManager.playTransition();
      backAction();
    }
  };

  const handleTheme = (t: ThemeVariant) => {
    soundManager.playClick();
    setTheme(t);
  };

  const hideOnEntry = appMode === 'entry';

  return (
    <>
      {/* ── Top-left: Back + Breadcrumb ─────────────────────── */}
      <AnimatePresence>
        {!hideOnEntry && backAction && (
          <motion.div
            className="fixed top-5 left-5 z-[60] flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            key="back-block"
          >
            <motion.button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 tactical-glass border border-white/10 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider hover:border-primary/50 hover:text-primary transition-all"
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-base leading-none">←</span>
              Back
            </motion.button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-1 font-mono text-[9px] text-gray-600 uppercase tracking-widest">
              {breadcrumb.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-gray-700 mx-0.5">›</span>}
                  <span className={i === breadcrumb.length - 1 ? 'text-primary' : ''}>{crumb}</span>
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top-right: Theme swatches + Sound ────────────────── */}
      <AnimatePresence>
        {!hideOnEntry && (
          <motion.div
            className="fixed top-5 right-5 z-[60] flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            key="controls-block"
          >
            {/* Sound toggle */}
            <motion.button
              onClick={() => { soundManager.playClick(); toggleSound(); }}
              className="p-2 tactical-glass border border-white/10 rounded-lg hover:border-white/30 transition-all"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={soundEnabled ? 'Mute sound' : 'Enable sound'}
            >
              {soundEnabled
                ? <Volume2 size={14} className="text-primary" />
                : <VolumeX size={14} className="text-gray-500" />}
            </motion.button>

            {/* Theme divider */}
            <div className="h-6 w-px bg-white/10" />

            {/* Theme swatches */}
            <div className="flex items-center gap-2">
              {THEME_SWATCHES.map((swatch) => (
                <motion.button
                  key={swatch.id}
                  onClick={() => handleTheme(swatch.id)}
                  title={swatch.name}
                  className="relative rounded-full border-2 transition-all"
                  style={{
                    width: theme === swatch.id ? 18 : 14,
                    height: theme === swatch.id ? 18 : 14,
                    backgroundColor: swatch.color,
                    borderColor: theme === swatch.id ? '#fff' : 'transparent',
                    boxShadow: theme === swatch.id ? `0 0 10px ${swatch.color}` : 'none',
                  }}
                  whileHover={{ scale: 1.3 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>

            {/* Backend status */}
            <div className="h-6 w-px bg-white/10" />
            <div
              className="flex items-center gap-1.5 px-2 py-1 rounded tactical-glass border border-white/5"
              title={backendOnline === null ? 'Checking…' : backendOnline ? 'Backend online' : 'Backend offline'}
            >
              {backendOnline === null
                ? <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse" />
                : backendOnline
                  ? <Wifi size={10} className="text-green-400" />
                  : <WifiOff size={10} className="text-red-400" />}
              <span className="font-mono text-[8px] uppercase text-gray-500">
                {backendOnline === null ? 'CHK' : backendOnline ? 'LIVE' : 'OFF'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Backend offline banner ────────────────────────────── */}
      <AnimatePresence>
        {showBanner && backendOnline === false && (
          <motion.div
            className="fixed top-14 left-1/2 -translate-x-1/2 z-[60]"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 backdrop-blur-xl">
              <span className="text-yellow-400 text-sm">⚠</span>
              <span className="font-mono text-[10px] text-yellow-300 uppercase tracking-wider">
                Backend offline — run <code className="bg-yellow-500/10 px-1 rounded">node dist/index.js</code>
              </span>
              <button
                onClick={() => setShowBanner(false)}
                className="text-yellow-500/60 hover:text-yellow-300 font-mono text-xs ml-1"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
