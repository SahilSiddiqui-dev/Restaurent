import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-border": "var(--card-border)",
        accent: {
          DEFAULT: "var(--accent)",
          secondary: "var(--accent-secondary)",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
        },
        veg: "#22C55E",
        "non-veg": "#EF4444",
        success: "#16A34A",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        serif: ["var(--font-playfair)", "serif"],
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)', filter: 'brightness(1.1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      animation: {
        'pulse-soft': 'pulseSoft 1.5s ease-in-out infinite',
        'float-slow': 'float 4s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
export default config;
