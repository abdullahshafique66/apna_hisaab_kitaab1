/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["variant", [
    '&:is([data-theme="dark"] *)',
    '@media (prefers-color-scheme: dark) { &:not([data-theme="light"] *) }',
  ]],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: v("brand"), dark: v("brand-dark"), soft: v("brand-soft") },
        saffron: { DEFAULT: v("saffron"), soft: v("saffron-soft") },
        bg: v("bg"),
        surface: { DEFAULT: v("surface"), 2: v("surface-2") },
        ink: { DEFAULT: v("ink"), muted: v("ink-muted") },
        line: v("line"),
        success: v("success"),
        warning: v("warning"),
        danger: v("danger"),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        urdu: ['"Noto Nastaliq Urdu"', 'serif'],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.04), 0 4px 16px -6px rgb(var(--shadow) / 0.08)",
        lift: "0 2px 4px rgb(var(--shadow) / 0.05), 0 18px 40px -12px rgb(var(--shadow) / 0.18)",
        float: "0 10px 30px -8px rgb(var(--shadow) / 0.22)",
      },
      borderRadius: { xl2: "1.125rem" },
      keyframes: {
        float: { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        pulseRing: { "0%": { transform: "scale(.8)", opacity: ".6" }, "100%": { transform: "scale(2)", opacity: "0" } },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        shimmer: "shimmer 1.4s infinite",
        "pulse-ring": "pulseRing 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
