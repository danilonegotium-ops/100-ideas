import type { Config } from "tailwindcss";

// Same design tokens as `_shared/static-template/theme.css`, expressed as
// Tailwind theme extensions instead of raw CSS classes. The actual values
// live in `app/globals.css` as CSS custom properties (with a
// prefers-color-scheme light override, same as the static template) — this
// file just maps Tailwind utility names onto those variables so Wave 3+
// apps look visually consistent with Wave 1/2 static tools.
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // maps to --bg
        bg: "var(--bg)",
        // maps to --bg-elevated (used for cards/panels)
        surface: "var(--bg-elevated)",
        // maps to --border
        border: "var(--border)",
        // maps to --text (named "fg" to avoid clashing with the `text-*` utility prefix)
        fg: "var(--text)",
        // maps to --text-muted
        muted: "var(--text-muted)",
        // maps to --accent / --accent-strong
        accent: {
          DEFAULT: "var(--accent)",
          strong: "var(--accent-strong)",
        },
        // maps to --danger
        danger: "var(--danger)",
        // secondary accent hue for gradient meshes / bento-grid variety
        // (design-system v2 — see _shared/nextjs-template/DESIGN_SYSTEM.md)
        "accent-2": "var(--accent-2)",
      },
      borderRadius: {
        // overrides Tailwind's default `rounded` scale with the shared radius,
        // plus an explicit `rounded-brand` alias for clarity in components
        DEFAULT: "var(--radius)",
        brand: "var(--radius)",
        // slightly larger radius for the flagship hero/glass panels
        xl2: "calc(var(--radius) * 1.5)",
      },
      maxWidth: {
        // matches --max-width / the static template's `.wrap` container
        site: "var(--max-width)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        display: ["var(--text-display)", { lineHeight: "1.08", letterSpacing: "-0.02em", fontWeight: "700" }],
        headline: ["var(--text-headline)", { lineHeight: "1.15", letterSpacing: "-0.01em", fontWeight: "700" }],
        title: ["var(--text-title)", { lineHeight: "1.3", fontWeight: "600" }],
        caption: ["var(--text-caption)", { lineHeight: "1.4" }],
      },
      transitionTimingFunction: {
        "out-expo": "var(--ease-out-expo)",
        spring: "var(--ease-spring)",
      },
      transitionDuration: {
        fast: "150ms",
        base: "350ms",
        slow: "600ms",
      },
      boxShadow: {
        "glow-sm": "0 0 20px -6px rgba(var(--accent-rgb), 0.5)",
        "glow-md": "0 0 40px -10px rgba(var(--accent-rgb), 0.5)",
        "glow-lg": "0 0 80px -16px rgba(var(--accent-rgb), 0.55)",
        depth: "0 1px 2px rgba(0,0,0,0.06), 0 8px 24px -8px rgba(0,0,0,0.18)",
      },
      backgroundImage: {
        "gradient-mesh":
          "radial-gradient(at 15% 20%, rgba(var(--accent-rgb), 0.35) 0px, transparent 50%), " +
          "radial-gradient(at 85% 15%, rgba(var(--accent-2-rgb), 0.3) 0px, transparent 50%), " +
          "radial-gradient(at 50% 85%, rgba(var(--accent-rgb), 0.2) 0px, transparent 50%)",
        "gradient-border": "linear-gradient(120deg, rgba(var(--accent-rgb), .8), rgba(var(--accent-2-rgb), .8))",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        marquee: "marquee 25s linear infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.5s var(--ease-out-expo) both",
      },
      backgroundSize: {
        "gradient-x": "200% 200%",
      },
    },
  },
  plugins: [],
};
export default config;
