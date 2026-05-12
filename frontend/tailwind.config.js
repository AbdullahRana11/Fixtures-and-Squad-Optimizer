/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Dark Theme
        'void': '#000000',
        'deep-void': '#0a0a0a',
        'obsidian': '#050505',
        
        // Neon Accents (Base mapping)
        'mint-sentinel': '#00F260',
        'cyan-spark': '#05D5FF',
        'purple-nexus': '#B026FF',
        'rose-danger': '#FF2A55',
        'gold-accent': '#FFB800',
        
        // Functional Dynamic Colors
        'primary': 'var(--primary)',
        'secondary': 'var(--secondary)',
        
        // Glass UI
        'glass-light': 'rgba(255, 255, 255, 0.08)',
        'glass-border': 'rgba(255, 255, 255, 0.12)',
        'glass-dark': 'rgba(0, 0, 0, 0.4)',
        'glass': 'rgba(255, 255, 255, 0.03)',
        'scan-line': 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.05) 50%, transparent)',
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'mono': ['Space Mono', 'monospace'],
        'outfit': ['Outfit', 'sans-serif'],
        'serif': ['Playfair Display', 'serif'],
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'drift-left': 'drift-left 8s linear infinite',
        'drift-right': 'drift-right 8s linear infinite',
        'shimmer': 'shimmer 2s infinite',
        'scan-line': 'scan-line 3s linear infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 20px rgba(0, 242, 96, 0.4)' },
          '50%': { opacity: '0.7', boxShadow: '0 0 40px rgba(0, 242, 96, 0.2)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(2deg)' },
        },
        'drift-left': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'drift-right': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
