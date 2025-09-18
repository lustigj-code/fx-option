import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#05070d",
        foreground: "#f4f7ff",
        accent: {
          DEFAULT: "#7c5cff",
          muted: "#362c6b"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        soft: "0 20px 45px -25px rgba(124, 92, 255, 0.8)"
      },
      backgroundImage: {
        "grid-light": "radial-gradient(circle at 1px 1px, rgba(124,92,255,0.35) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};

export default config;
