/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // --- Core Layout ---
        void: "#000000", 
        obsidian: "#050505", 
        "glass-base": "rgba(255, 255, 255, 0.03)",
        "glass-border": "rgba(255, 255, 255, 0.07)",

        // --- HUD / Original Style (Neon) ---
        "neon-mint": "#00F260",
        "neon-aqua": "#05D5FF",
        "neon-purple": "#B026FF",
        "neon-rose": "#FF2A55",
        
        // --- Editorial Style (Muted) ---
        "ed-emerald": "#059669",
        "ed-green": "#16a34a",
        "ed-gold": "#b45309",
        "ed-rose": "#e11d48",
        "ed-zinc": "#52525b",
      },
      fontFamily: {
        // HUD / Original
        clash: ["'Clash Display'", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
        // Editorial
        serif: ["'Merriweather'", "serif"],
        sans: ["'Open Sans'", "sans-serif"],
        // Utility
        space: ["'Space Mono'", "monospace"],
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'slow-drift': 'drift 20s ease-in-out infinite',
        'slow-drift-reverse': 'drift-reverse 25s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(5%, 2%) scale(1.05)' },
        },
        'drift-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-5%, -2%) scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
