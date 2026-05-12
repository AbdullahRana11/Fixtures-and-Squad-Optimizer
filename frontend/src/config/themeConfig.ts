import { ThemeVariant } from '../store/appStore';

export interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
  danger: string;
  primaryGlow: string;
  secondaryGlow: string;
}

export const THEME_VARIANTS: Record<ThemeVariant, ThemeConfig> = {
  'mint-cyan': {
    primary: '#00F260',
    secondary: '#05D5FF',
    accent: '#000000',
    danger: '#FF2A55',
    primaryGlow: 'rgba(0, 242, 96, 0.4)',
    secondaryGlow: 'rgba(5, 213, 255, 0.4)',
  },
  'purple-rose': {
    primary: '#B026FF',
    secondary: '#FF2A55',
    accent: '#000000',
    danger: '#FFB800',
    primaryGlow: 'rgba(176, 38, 255, 0.4)',
    secondaryGlow: 'rgba(255, 42, 85, 0.4)',
  },
  'gold-cyan': {
    primary: '#FFB800',
    secondary: '#05D5FF',
    accent: '#000000',
    danger: '#FF2A55',
    primaryGlow: 'rgba(255, 184, 0, 0.4)',
    secondaryGlow: 'rgba(5, 213, 255, 0.4)',
  },
  'mint-purple': {
    primary: '#00F260',
    secondary: '#B026FF',
    accent: '#000000',
    danger: '#FF2A55',
    primaryGlow: 'rgba(0, 242, 96, 0.4)',
    secondaryGlow: 'rgba(176, 38, 255, 0.4)',
  },
  'monochrome': {
    primary: '#FFFFFF',
    secondary: '#888888',
    accent: '#000000',
    danger: '#FF2A55',
    primaryGlow: 'rgba(255, 255, 255, 0.4)',
    secondaryGlow: 'rgba(136, 136, 136, 0.4)',
  },
  'light-mono': {
    primary: '#FFFFFF',
    secondary: '#888888',
    accent: '#000000',
    danger: '#FF2A55',
    primaryGlow: 'rgba(255, 255, 255, 0.4)',
    secondaryGlow: 'rgba(136, 136, 136, 0.4)',
  },
};

export const getThemeConfig = (theme: ThemeVariant): ThemeConfig => {
  return THEME_VARIANTS[theme];
};

export const getThemeCSS = (theme: ThemeVariant) => {
  const config = getThemeConfig(theme);
  return `
    :root {
      --color-primary: ${config.primary};
      --color-secondary: ${config.secondary};
      --color-accent: ${config.accent};
      --color-danger: ${config.danger};
      --glow-primary: ${config.primaryGlow};
      --glow-secondary: ${config.secondaryGlow};
    }
  `;
};
