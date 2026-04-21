/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "#090A0F",
        obsidian: "#12151E",
        "glass-base": "rgba(255, 255, 255, 0.05)",
        "glass-border": "rgba(255, 255, 255, 0.1)",
        "mint-sentinel": "#00F260",
        "neon-aqua": "#05D5FF",
        "cyber-purple": "#B026FF",
        "mint-valid": "#00F260",
        "crimson-danger": "#FF2A55",
      },
      fontFamily: {
        clash: ["'Clash Display'", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
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
          '50%': { transform: 'translate(10%, 5%) scale(1.1)' },
        },
        'drift-reverse': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-10%, -5%) scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
}
