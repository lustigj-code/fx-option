import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui-kit/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b0f0c",
        card: "#0f1511",
        accent: "#2df07d",
        "accent-muted": "#1e3f2c",
        text: "#e8f3ec",
        muted: "#9db8a6",
        danger: "#ff4d4d"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 45px -25px rgba(45, 240, 125, 0.35)",
        glow: "0 0 25px 0 rgba(45, 240, 125, 0.55)"
      },
      backgroundImage: {
        "grid-light": "radial-gradient(circle at 1px 1px, rgba(45,240,125,0.18) 1px, transparent 0)",
        "noise-overlay": "url('data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\' viewBox=\\'0 0 200 200\\'%3E%3Cfilter id=\\'n\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'2.5\\' numOctaves=\\'3\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23n)\\' opacity=\\'0.06\\'/%3E%3C/svg%3E')"
      }
    }
  },
  plugins: []
};

export default config;
