// ============================================================
// OnboardingOverlay.tsx  —  NEW FILE: frontend/src/components/OnboardingOverlay.tsx
// First-visit pulsing highlights with tooltips.
// Dismissed by clicking anywhere. Never shown again (localStorage).
// ============================================================
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/appStore';

interface Tip {
  id: string;
  x: string;   // CSS left %
  y: string;   // CSS top %
  title: string;
  body: string;
  anchor: 'left' | 'right' | 'center';
}

const TIPS_BY_MODE: Record<string, Tip[]> = {
  'mode-select': [
    {
      id: 'tip-fixtures',
      x: '30%', y: '50%',
      title: 'Fixture Generator',
      body: 'Pick a league, select teams, and generate a real constraint-solved schedule with AI predictions.',
      anchor: 'left',
    },
    {
      id: 'tip-squad',
      x: '70%', y: '50%',
      title: 'Squad Optimizer',
      body: 'Run the FPL Knapsack algorithm to find the highest-value 15-man squad within your budget.',
      anchor: 'right',
    },
  ],
  'fixture-generator-league-select': [
    {
      id: 'tip-league',
      x: '50%', y: '25%',
      title: 'Choose Your League',
      body: 'Scroll or drag the carousel. Each league loads real teams from the database.',
      anchor: 'center',
    },
  ],
  'squad-optimizer': [
    {
      id: 'tip-budget',
      x: '80%', y: '40%',
      title: 'Budget Slider',
      body: 'Drag to set your total FPL budget. Higher budget = more options for the optimizer.',
      anchor: 'right',
    },
    {
      id: 'tip-optimize',
      x: '65%', y: '88%',
      title: 'Optimize Squad',
      body: 'Click to run the Knapsack engine. Results appear on the pitch instantly.',
      anchor: 'center',
    },
  ],
};

const STORAGE_KEY = 'tcc-onboarding-seen';

export const OnboardingOverlay: React.FC = () => {
  const { appMode, fixtureView } = useAppStore();
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch { return false; }
  });
  const [activeTip, setActiveTip] = useState<string | null>(null);

  const modeKey = appMode === 'fixture-generator'
    ? `fixture-generator-${fixtureView}`
    : appMode;

  const tips = TIPS_BY_MODE[modeKey] || [];

  useEffect(() => {
    if (!dismissed && tips.length > 0) {
      setActiveTip(tips[0].id);
    } else {
      setActiveTip(null);
    }
  }, [modeKey, dismissed]);

  const dismiss = () => {
    setDismissed(true);
    setActiveTip(null);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  };

  if (dismissed || tips.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Dim overlay — clicking dismisses */}
        <motion.div
          className="absolute inset-0 bg-black/40 pointer-events-auto cursor-pointer"
          onClick={dismiss}
        />

        {/* Tips */}
        {tips.map((tip, idx) => (
          <React.Fragment key={tip.id}>
            {/* Pulsing ring */}
            <motion.div
              className="absolute pointer-events-none"
              style={{ left: tip.x, top: tip.y, transform: 'translate(-50%,-50%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.2 }}
            >
              <motion.div
                className="w-10 h-10 rounded-full border-2 border-primary"
                animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, delay: idx * 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-primary glow-primary" />
              </div>
            </motion.div>

            {/* Tooltip card */}
            <motion.div
              className="absolute pointer-events-auto"
              style={{
                left: tip.anchor === 'right' ? `calc(${tip.x} - 260px)` : tip.anchor === 'left' ? `calc(${tip.x} + 30px)` : `calc(${tip.x} - 120px)`,
                top: `calc(${tip.y} + 28px)`,
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.15 }}
            >
              <div className="w-56 tactical-glass rounded-xl p-4 border border-primary/30 shadow-[0_0_30px_rgba(0,242,96,0.15)]">
                <div className="font-display font-bold text-xs uppercase tracking-wider text-primary mb-1">{tip.title}</div>
                <p className="font-mono text-[10px] text-gray-300 leading-relaxed">{tip.body}</p>
              </div>
            </motion.div>
          </React.Fragment>
        ))}

        {/* Dismiss hint */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto cursor-pointer"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={dismiss}
        >
          <div className="px-5 py-2 rounded-full bg-white/5 border border-white/10 font-mono text-[10px] uppercase tracking-widest text-gray-400">
            Click anywhere to dismiss
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
