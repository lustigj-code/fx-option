/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: '#04050a',
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669'
        }
      },
      boxShadow: {
        glow: '0 0 25px rgba(16, 185, 129, 0.45)'
      },
      backgroundImage: {
        noise: "url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'120\' viewBox=\'0 0 120 120\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'120\' height=\'120\' filter=\'url(%23n)\' opacity=\'0.12\'/%3E%3C/svg%3E')"
      }
    }
  },
  plugins: []
};
