/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F5",
        foreground: "#1A1A2E",
        "muted-foreground": "#6B6B7B",
        surface: "#FFFFFF",
        border: "#E5E5E0",
        input: "#D5D5D0",
        muted: "#F5F5F0",
        primary: {
          DEFAULT: "#C53030",
          foreground: "#FFFFFF",
          soft: "#FDF2F2",
        },
        accent: {
          DEFAULT: "#2D7D46",
          foreground: "#FFFFFF",
        },
        gold: {
          DEFAULT: "#D4A017",
          foreground: "#1A1A2E",
        },
        terracotta: "#C53030",
        destructive: {
          DEFAULT: "#DC2626",
          foreground: "#FFFFFF",
        },
      },
      fontFamily: {
        display: ["Inter", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        elegant: "0 10px 40px -10px rgba(0,0,0,0.15)",
      },
    },
  },
  plugins: [],
};
