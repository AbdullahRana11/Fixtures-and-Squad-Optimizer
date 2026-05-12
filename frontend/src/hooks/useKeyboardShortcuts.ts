// ============================================================
// useKeyboardShortcuts.ts  —  NEW FILE: frontend/src/hooks/useKeyboardShortcuts.ts
// Global keyboard shortcuts:
//   Escape    → go back
//   T         → cycle theme
//   M         → toggle sound
//   1 / 2     → switch between Fixtures / Squad mode
// ============================================================
import { useEffect } from 'react';
import { useAppStore, ThemeVariant } from '../store/appStore';
import { soundManager } from '../utils/soundEffects';

const THEME_ORDER: ThemeVariant[] = ['mint-cyan', 'purple-rose', 'gold-cyan', 'mint-purple'];

export function useKeyboardShortcuts(backAction: (() => void) | null) {
  const { theme, setTheme, toggleSound, setAppMode, fixtureView, setFixtureView } = useAppStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire inside inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key) {
        case 'Escape':
          if (backAction) {
            soundManager.playTransition();
            backAction();
          }
          break;

        case 't':
        case 'T': {
          const i = THEME_ORDER.indexOf(theme);
          setTheme(THEME_ORDER[(i + 1) % THEME_ORDER.length]);
          soundManager.playClick();
          break;
        }

        case 'm':
        case 'M':
          toggleSound();
          soundManager.playClick();
          break;

        case '1':
          soundManager.playTransition();
          setAppMode('fixture-generator');
          break;

        case '2':
          soundManager.playTransition();
          setAppMode('squad-optimizer');
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [theme, backAction, fixtureView]);
}
