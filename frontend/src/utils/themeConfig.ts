export const THEMES = {
  'mint-cyan': {
    primary: '#00F260',
    secondary: '#05D5FF',
    glow: 'rgba(0, 242, 96, 0.5)',
    glowSecondary: 'rgba(5, 213, 255, 0.5)',
    text: 'Mint Sentinel',
    subtext: 'Cyan Spark',
  },
  'purple-rose': {
    primary: '#B026FF',
    secondary: '#FF2A55',
    glow: 'rgba(176, 38, 255, 0.5)',
    glowSecondary: 'rgba(255, 42, 85, 0.5)',
    text: 'Purple Void',
    subtext: 'Rose Ember',
  },
  'gold-cyan': {
    primary: '#FFB800',
    secondary: '#05D5FF',
    glow: 'rgba(255, 184, 0, 0.5)',
    glowSecondary: 'rgba(5, 213, 255, 0.5)',
    text: 'Gold Catalyst',
    subtext: 'Cyan Spark',
  },
  'mint-purple': {
    primary: '#00F260',
    secondary: '#B026FF',
    glow: 'rgba(0, 242, 96, 0.5)',
    glowSecondary: 'rgba(176, 38, 255, 0.5)',
    text: 'Mint Sentinel',
    subtext: 'Purple Void',
  },
  'monochrome': {
    primary: '#FFFFFF',
    secondary: '#888888',
    glow: 'rgba(255, 255, 255, 0.3)',
    glowSecondary: 'rgba(136, 136, 136, 0.3)',
    text: 'Void White',
    subtext: 'Obsidian Grey',
  },
  'light-mono': {
    primary: '#FFFFFF',
    secondary: '#888888',
    glow: 'rgba(255, 255, 255, 0.3)',
    glowSecondary: 'rgba(136, 136, 136, 0.3)',
    text: 'Obsidian Black',
    subtext: 'Void White',
  },
};

export const applyTheme = (themeName: keyof typeof THEMES) => {
  const theme = THEMES[themeName];
  const root = document.documentElement;

  // Set CSS Variables
  root.style.setProperty('--primary', theme.primary);
  root.style.setProperty('--secondary', theme.secondary);
  root.style.setProperty('--glow-primary', theme.glow);
  root.style.setProperty('--glow-secondary', theme.glowSecondary);

  // Set standard tailwind colors if needed
  // Note: Tailwind v4 handles vars automatically, but we ensure consistency
  document.body.style.setProperty('--primary-color', theme.primary);
  document.body.style.setProperty('--secondary-color', theme.secondary);

  const rootEl = document.getElementById('root');
  document.documentElement.style.filter = 'none'; // reset
  document.body.style.backgroundColor = '#000000'; // default
  if (rootEl) {
    rootEl.style.backgroundColor = 'transparent';
    rootEl.style.filter = 'none';
  }
  
  // Enforce true monochrome: strip ALL colors
  if (themeName === 'monochrome') {
    document.documentElement.style.filter = 'grayscale(100%)';
  } else if (themeName === 'light-mono') {
    // Light monochrome: grayscale and invert everything globally on html
    // This fixes issues with portaled elements or the body background not inverting
    document.documentElement.style.filter = 'grayscale(100%) invert(100%)';
    // We must ensure the html itself has a white background after inversion,
    // which means its actual background should be black, but we already set body to black.
  }
};

export const getColorWithAlpha = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
