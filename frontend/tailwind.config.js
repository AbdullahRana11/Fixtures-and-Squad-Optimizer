/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#09090b", // Deep slate background
        obsidian: "#18181b", // Lighter slate for panels
        "glass-base": "rgba(255, 255, 255, 0.05)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
        "mint-sentinel": "#0f766e", // Deep teal
        "neon-aqua": "#0ea5e9", // Muted blue
        "cyber-purple": "#52525b", // Slate gray instead of purple
        "mint-valid": "#2563eb", // Royal blue
        "crimson-danger": "#e11d48", // Rose red
        "editorial-gold": "#b45309", // Muted gold/amber
      },
      fontFamily: {
        clash: ["'Merriweather'", "serif"], // Replacing clash with Merriweather
        outfit: ["'Open Sans'", "sans-serif"], // Replacing outfit with Open Sans
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
