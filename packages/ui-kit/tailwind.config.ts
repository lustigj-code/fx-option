import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b0f0c',
        card: '#0f1511',
        accent: '#2df07d',
        'accent-muted': '#1e3f2c',
        text: '#e8f3ec',
        muted: '#9db8a6',
        danger: '#ff4d4d'
      },
      borderRadius: {
        '2xl': '1.5rem'
      },
      boxShadow: {
        soft: '0 20px 45px -25px rgba(45, 240, 125, 0.35)',
        glow: '0 0 25px 0 rgba(45, 240, 125, 0.55)'
      },
      backgroundImage: {
        'radial-emerald': 'radial-gradient(circle at 20% 20%, rgba(45, 240, 125, 0.35), transparent 65%)',
        'noise-overlay': "url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'%3E%3Cfilter id=\\'n\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'2.5\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23n)\\' opacity=\\'0.06\\'/%3E%3C/svg%3E')"
      }
    }
  },
  plugins: [
    plugin(function ({ addUtilities }) {
      addUtilities({
        '.glass-card': {
          backgroundColor: 'rgba(15, 21, 17, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(232, 243, 236, 0.08)'
        }
      });
    })
  ]
};

export default config;
