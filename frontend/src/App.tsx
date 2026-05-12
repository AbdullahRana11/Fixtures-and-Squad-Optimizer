// ============================================================
// App.tsx  —  REPLACE frontend/src/App.tsx
// New additions vs previous version:
//   • GlobalHUD (theme swatches, back button, breadcrumb, health)
//   • OnboardingOverlay (first-visit hints)
//   • useKeyboardShortcuts (Esc, T, M, 1, 2)
//   • Persisted theme via localStorage
//   • Loading spinner while fixture generation runs
// ============================================================
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/appStore';
import { applyTheme } from './utils/themeConfig';
import { soundManager } from './utils/soundEffects';
import { generateFixtures } from './api/api';
import { LEAGUES } from './data/mockData';
import { Loader } from 'lucide-react';

// Screens
import { EntryScreen } from './screens/EntryScreen';
import { ModeSelectScreen } from './screens/ModeSelectScreen';
import { LeagueCarousel } from './screens/LeagueCarousel';
import { TeamSelector } from './screens/TeamSelector';
import { FixtureDisplay } from './screens/FixtureDisplay';
import { SquadOptimizerScreen } from './screens/SquadOptimizerScreen';

// Global overlays
import { AnimatedBackground } from './components/AnimatedBackground';
import { GlobalHUD } from './components/GlobalHUD';
import { OnboardingOverlay } from './components/OnboardingOverlay';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { GenerationLoadingOverlay } from './components/GenerationLoadingOverlay';

// ── Persist theme to localStorage ─────────────────────────────
const THEME_KEY = 'tcc-theme';

function usePersistedTheme() {
  const { theme, setTheme } = useAppStore();

  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as any;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
  }, [theme]);
}

// ── Back action (mirrors GlobalHUD logic) ─────────────────────
function useBackAction() {
  const { appMode, fixtureView, setAppMode, setFixtureView } = useAppStore();
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

export const App: React.FC = () => {
  const {
    appMode, fixtureView, soundEnabled, selectedLeague,
    isGeneratingFixtures,
    setAppMode, setFixtureView, setSelectedLeague,
    setGeneratedFixtures, setIsGeneratingFixtures, setFixtureError,
    setSelectedTeams,
  } = useAppStore();

  usePersistedTheme();

  useEffect(() => { soundManager.setEnabled(soundEnabled); }, [soundEnabled]);

  const backAction = useBackAction();
  useKeyboardShortcuts(backAction);

  // ── Fixture generation via real API ─────────────────────────
  const handleConfirmTeams = async (teamNames: string[]) => {
    if (!selectedLeague) return;
    // ✅ Save team selection to store so Regenerate can reuse it
    setSelectedTeams(teamNames);
    setIsGeneratingFixtures(true);
    setFixtureError(null);
    const { constraintProfile } = useAppStore.getState();
    try {
      const result = await generateFixtures({ 
        league: selectedLeague, 
        teamNames,
        constraintProfile
      });
      setGeneratedFixtures(result);
      setFixtureView('fixture-display');
    } catch (err: any) {
      setFixtureError(err.message || 'Failed to generate fixtures');
    } finally {
      setIsGeneratingFixtures(false);
    }
  };

  const renderFixtureFlow = () => {
    switch (fixtureView) {
      case 'league-select':
        return (
          <LeagueCarousel
            onSelectLeague={(league) => {
              setSelectedLeague(league.id);
              setFixtureView('team-select');
            }}
          />
        );
      case 'team-select':
        return <TeamSelector leagueId={selectedLeague!} onConfirm={handleConfirmTeams} />;
      case 'fixture-display':
        return (
          <FixtureDisplay
            league={LEAGUES.find((l) => l.id === selectedLeague)}
            onBack={() => setFixtureView('team-select')}
          />
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch (appMode) {
      case 'entry':
        return <EntryScreen key="entry" />;
      case 'mode-select':
        return <ModeSelectScreen key="mode-select" />;
      case 'fixture-generator':
        return (
          <motion.div
            key="fixture-generator"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full"
          >
            {renderFixtureFlow()}
          </motion.div>
        );
      case 'squad-optimizer':
        return (
          <motion.div
            key="squad-optimizer"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="w-full h-full"
          >
            <SquadOptimizerScreen />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative w-screen h-screen bg-void overflow-hidden selection:bg-primary selection:text-void">
      <AnimatedBackground />

      {/* Main content */}
      <main className="relative z-10 w-full h-full">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Global fixture-generation loading overlay */}
      <GenerationLoadingOverlay
        isVisible={isGeneratingFixtures}
        league={LEAGUES.find((l) => l.id === selectedLeague)?.name}
        sport={LEAGUES.find((l) => l.id === selectedLeague)?.sport}
      />

      {/* Persistent HUD (theme switcher, back, breadcrumb, health) */}
      <GlobalHUD />

      {/* First-visit onboarding tooltips */}
      <OnboardingOverlay />

      {/* Corner decorations */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="hud-corner hud-corner-tl m-4" />
        <div className="hud-corner hud-corner-tr m-4" />
        <div className="hud-corner hud-corner-bl m-4" />
        <div className="hud-corner hud-corner-br m-4" />
      </div>

      {/* Keyboard shortcut legend (bottom-left, subtle) */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="flex gap-4 font-mono text-[8px] text-gray-700 uppercase tracking-widest">
          <span><kbd className="opacity-60">Esc</kbd> Back</span>
          <span><kbd className="opacity-60">T</kbd> Theme</span>
          <span><kbd className="opacity-60">M</kbd> Sound</span>
          <span><kbd className="opacity-60">1</kbd> Fixtures</span>
          <span><kbd className="opacity-60">2</kbd> Squad</span>
        </div>
      </div>
    </div>
  );
};

export default App;
