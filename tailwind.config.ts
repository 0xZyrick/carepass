import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    screens: {
      xs: "420px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        brand: {
          50: "#E9F8F1",
          100: "#CFF0E0",
          200: "#A2E1C4",
          300: "#6CCDA3",
          400: "#2FB985",
          500: "#00A86B",
          600: "#00935D",
          700: "#007A4D",
          800: "#0A5F40",
          900: "#0A3D2B",
          950: "#052619",
        },
        ink: {
          DEFAULT: "#10231C",
          soft: "#3D5149",
          mute: "#66766F",
          faint: "#97A39D",
        },
        canvas: { DEFAULT: "#F6F1E6", 2: "#EDE6D6" },
        line: { DEFAULT: "#E3DAC5", strong: "#CFC4AA" },
        sun: { 50: "#FFF7E0", 100: "#FFEDB8", 400: "#F5B83D", 600: "#A86A06" },
        rose: { 50: "#FDECEA", 100: "#FAD4CF", 500: "#E5594B", 700: "#B3352A" },
        iris: { 50: "#EEEDFD", 500: "#6C63F0", 700: "#4A41C4" },
      },
      fontFamily: {
        sans: ['"Figtree Variable"', "system-ui", "sans-serif"],
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,35,28,.04), 0 10px 28px -14px rgba(16,35,28,.14)",
        pop: "0 2px 4px rgba(16,35,28,.05), 0 24px 56px -16px rgba(16,35,28,.28)",
        glow: "0 12px 40px -8px rgba(0,168,107,.45)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.94)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        ring: {
          "0%": { transform: "scale(.8)", opacity: ".6" },
          "100%": { transform: "scale(1.9)", opacity: "0" },
        },
        scan: {
          "0%": { top: "6%" },
          "50%": { top: "88%" },
          "100%": { top: "6%" },
        },
        draw: { to: { strokeDashoffset: "0" } },
      },
      animation: {
        "fade-up": "fade-up .55s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .3s ease both",
        "scale-in": "scale-in .28s cubic-bezier(.2,.8,.2,1) both",
        "sheet-up": "sheet-up .34s cubic-bezier(.2,.8,.2,1) both",
        float: "float 6s ease-in-out infinite",
        ring: "ring 2s ease-out infinite",
        scan: "scan 2.6s ease-in-out infinite",
        draw: "draw .6s .1s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
