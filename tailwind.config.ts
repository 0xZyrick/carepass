import type { Config } from "tailwindcss";

/**
 * CarePass design tokens
 * - brand:   medical teal, deepened so white text on brand-600 passes WCAG AA
 * - ink:     cool near-black text scale
 * - canvas:  cool off-white app background; surfaces are pure white
 * - sun / rose / iris: warning, danger, info
 */
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
          50: "#EBFAFA",
          100: "#CFF3F3",
          200: "#A0E6E6",
          300: "#66D1D3",
          400: "#2EB5BA",
          500: "#0F9AA3",
          600: "#0E7C86",
          700: "#0F636C",
          800: "#11505A",
          900: "#0F3F48",
          950: "#072A31",
        },
        ink: {
          DEFAULT: "#0E1B2E",
          soft: "#38465A",
          mute: "#5A687B",
          faint: "#8B97A7",
        },
        canvas: { DEFAULT: "#F5F7FA", 2: "#EBEEF3", 3: "#DFE4EB" },
        line: { DEFAULT: "#E3E8EF", strong: "#D0D7E1" },
        sun: { 50: "#FFF6DD", 100: "#FFEBB0", 400: "#F2B133", 500: "#D99A14", 600: "#9A5F05", 700: "#7A4A02" },
        rose: { 50: "#FDEDEA", 100: "#FAD3CD", 500: "#E0483A", 600: "#C93A2D", 700: "#A62E23" },
        iris: { 50: "#EFEEFD", 100: "#DEDCFB", 500: "#6459EE", 600: "#5146D9", 700: "#4239B8" },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ['"Bricolage Grotesque Variable"', '"Plus Jakarta Sans Variable"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono Variable"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        xs: "0 1px 1px rgba(14,27,46,.04)",
        card: "0 1px 2px rgba(14,27,46,.04), 0 1px 1px rgba(14,27,46,.03)",
        raise: "0 1px 2px rgba(14,27,46,.05), 0 8px 24px -12px rgba(14,27,46,.16)",
        pop: "0 2px 6px rgba(14,27,46,.06), 0 28px 64px -20px rgba(14,27,46,.32)",
        glow: "0 14px 40px -10px rgba(14,124,134,.5)",
        btn: "inset 0 1px 0 rgba(255,255,255,.16), 0 1px 2px rgba(7,42,49,.28)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": { from: { opacity: "0", transform: "scale(.96)" }, to: { opacity: "1", transform: "scale(1)" } },
        "sheet-up": { from: { transform: "translateY(100%)" }, to: { transform: "translateY(0)" } },
        "toast-in": { from: { opacity: "0", transform: "translateY(-10px) scale(.97)" }, to: { opacity: "1", transform: "translateY(0) scale(1)" } },
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        ring: { "0%": { transform: "scale(.8)", opacity: ".5" }, "100%": { transform: "scale(1.8)", opacity: "0" } },
        shake: { "0%,100%": { transform: "translateX(0)" }, "25%": { transform: "translateX(-6px)" }, "75%": { transform: "translateX(6px)" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "60%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        draw: { to: { strokeDashoffset: "0" } },
      },
      animation: {
        "fade-up": "fade-up .5s cubic-bezier(.2,.7,.2,1) both",
        "fade-in": "fade-in .25s ease both",
        "scale-in": "scale-in .22s cubic-bezier(.2,.8,.2,1) both",
        "sheet-up": "sheet-up .32s cubic-bezier(.2,.8,.2,1) both",
        "toast-in": "toast-in .26s cubic-bezier(.2,.8,.2,1) both",
        float: "float 6s ease-in-out infinite",
        ring: "ring 2.2s ease-out infinite",
        shake: "shake .32s ease",
        pop: "pop .45s cubic-bezier(.2,.9,.3,1.2) both",
        draw: "draw .6s .1s ease-out forwards",
      },
    },
  },
  plugins: [],
};
export default config;
