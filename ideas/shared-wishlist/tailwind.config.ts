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
      },
      borderRadius: {
        // overrides Tailwind's default `rounded` scale with the shared radius,
        // plus an explicit `rounded-brand` alias for clarity in components
        DEFAULT: "var(--radius)",
        brand: "var(--radius)",
      },
      maxWidth: {
        // matches --max-width / the static template's `.wrap` container
        site: "var(--max-width)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
