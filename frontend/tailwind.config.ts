import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0c0d0d",
          900: "#131515",
          800: "#1d2020",
          700: "#2b3030",
          500: "#687170",
          300: "#b9c0bd",
          100: "#eef0ec"
        },
        paper: {
          50: "#f8f5ef",
          100: "#efeae0",
          200: "#ded5c8"
        },
        accent: {
          50: "#ecfeff",
          100: "#cffafe",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        ambient: "0 24px 80px rgba(0, 0, 0, 0.28)",
        glass: "inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 60px rgba(0,0,0,0.26)"
      },
      backdropBlur: {
        glass: "22px"
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.72", transform: "scale(1)" },
          "50%": { opacity: "0.9", transform: "scale(1.02)" }
        }
      },
      animation: {
        breathe: "breathe 8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;

