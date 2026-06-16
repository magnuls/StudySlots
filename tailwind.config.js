/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        lavender: '#e6dbff',
        blush: '#ffd6ec',
        hotpink: '#ff5fa2',
        coral: '#ff8a72',
        gold: '#ffc83d',
        mint: '#7de8b6',
        babyblue: '#9ad8ff',
        lilac: '#c9b6f5',
        cream: '#fff7e6',
        plum: '#5a3b5d',
        plumdark: '#43294a',
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
      },
    },
  },
  plugins: [],
}
