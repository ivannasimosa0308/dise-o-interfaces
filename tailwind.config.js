/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // Desactiva el modo oscuro automático por media query para evitar conflictos con las paletas de Ionic
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Syne"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: '#000000',
        cream: '#F4F4F0',
        gum: {
          pink: '#FF90E8',
          yellow: '#FFC900',
          mint: '#90F0D6',
          teal: '#23A094',
          coral: '#FF6B6B',
        },
      },
      boxShadow: {
        neo: '4px 4px 0px 0px #000000',
        'neo-sm': '2px 2px 0px 0px #000000',
        'neo-lg': '6px 6px 0px 0px #000000',
        'neo-pink': '4px 4px 0px 0px #FF90E8',
        'neo-yellow': '4px 4px 0px 0px #FFC900',
      },
    },
  },
  plugins: [],
};
