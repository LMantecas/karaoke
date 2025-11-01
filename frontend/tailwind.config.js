/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(12 26% 6%)',
        bg2: 'hsl(12 35% 10%)',
        red1: 'hsl(12 62% 44%)',
        red2: 'hsl(12 52% 34%)',
        orange1: 'hsl(18 60% 44%)',
        ink: 'hsl(20 15% 85%)',
        inkDim: 'hsl(20 12% 70%)',
        inkMuted: 'hsl(18 10% 58%)',
        // Mantener compatibilidad con colores anteriores
        primary: 'hsl(12 62% 44%)',
        secondary: 'hsl(18 60% 44%)',
      },
      fontFamily: {
        display: ['Cinzel', 'ui-serif', 'Georgia', 'serif'],
        body: ['Lora', 'ui-serif', 'Georgia', 'serif'],
        mono: ['ui-monospace','SFMono-Regular','Menlo','Consolas','monospace'],
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wide2: '.02em',
        tight1: '-.01em',
      },
      boxShadow: {
        soft: '0 8px 30px hsl(12 90% 2% / .45)',
        hard: '0 6px 14px hsl(12 90% 2% / .65)',
      },
      borderRadius: {
        lgx: '16px',
        mdx: '10px',
        smx: '6px',
      },
      backgroundImage: {
        'poster': `
          radial-gradient(1200px 600px at 50% -10%, hsl(12 38% 14% / .55), transparent 60%),
          radial-gradient(800px 400px at 100% 0%, hsl(12 38% 14% / .35), transparent 60%),
          radial-gradient(1000px 600px at 0% 10%, hsl(12 38% 14% / .35), transparent 60%),
          linear-gradient(180deg, hsl(12 26% 6%) 0%, hsl(12 35% 10%) 100%)`,
      },
      keyframes: {
        float: { 
          '0%,100%': { transform: 'translateY(0)' }, 
          '50%': { transform: 'translateY(-6px)' } 
        },
      },
      animation: { 
        'float-slow': 'float 8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
