// Presentation-only data for the Tier 3 3D room preview (components/three/RoomPreview.tsx).
// Pure and side-effect-free — safe to import from both the client page and,
// if ever needed, a server component. Does NOT touch the AI request/response
// shape in app/api/decorate-room/route.ts or lib/ai/gemini.ts.
//
// three.js materials need literal color values (there's no CSS-variable
// resolution inside a WebGL scene), so this is the one place in the app
// where hex values are hand-picked rather than read from a `--token`. Each
// swatch is anchored back to the shared `--accent`/`--accent-2` palette
// where it makes sense (see `FloatingOrb`'s own hard-coded default color for
// precedent) with a few curated per-style hues layered on top for variety —
// this does not introduce a competing color system for any 2D UI chrome,
// which stays on `bg`/`surface`/`border`/`fg`/`muted`/`accent` throughout.
import { STYLES, type Style } from "./styles";

export interface RoomPalette {
  /** Back/side wall color. */
  wall: string;
  /** Floor color. */
  floor: string;
  /** Main furniture primitive (the "sofa" box). */
  primary: string;
  /** Secondary furniture primitive (the "side table" cylinder). */
  secondary: string;
  /** Floating accent/palette-swatch orb + its glow light. */
  accent: string;
}

const PALETTES: Record<Style, RoomPalette> = {
  Modern: {
    wall: "#e4e4e7",
    floor: "#2b2f36",
    primary: "#3f3f46",
    secondary: "#6ee7b7",
    accent: "#6ee7b7",
  },
  "Nordic / Scandinavian": {
    wall: "#f5f1ea",
    floor: "#c9b79c",
    primary: "#9fb8ad",
    secondary: "#e8dcc8",
    accent: "#6ee7b7",
  },
  Minimalist: {
    wall: "#f2f2f0",
    floor: "#d9d5cd",
    primary: "#bfbfbf",
    secondary: "#e5e5e5",
    accent: "#9ca3af",
  },
  Industrial: {
    wall: "#3a3a3a",
    floor: "#55524d",
    primary: "#8b7355",
    secondary: "#4b5563",
    accent: "#f59e0b",
  },
  Bohemian: {
    wall: "#caa472",
    floor: "#7c4a2d",
    primary: "#c1440e",
    secondary: "#2f6f4f",
    accent: "#e0b13a",
  },
  "Mid-Century Modern": {
    wall: "#d8c9a3",
    floor: "#8a5a34",
    primary: "#d97a4a",
    secondary: "#3f6b5e",
    accent: "#e0b13a",
  },
  Rustic: {
    wall: "#e7d9c3",
    floor: "#6b4a30",
    primary: "#8a5a3a",
    secondary: "#5c4433",
    accent: "#c98a4b",
  },
  Coastal: {
    wall: "#eef4f5",
    floor: "#d8cdb8",
    primary: "#5aa0b0",
    secondary: "#e8e0cf",
    accent: "#6ee7b7",
  },
};

const DEFAULT_PALETTE = PALETTES[STYLES[0]];

/** Style-driven palette — the primary way the 3D preview "recolors": pick a
 * style before generating, the room preview reflects it immediately. */
export function getRoomPalette(style: string): RoomPalette {
  return PALETTES[style as Style] ?? DEFAULT_PALETTE;
}

// Small keyword -> hex map used only to nudge the floating accent orb's
// color toward whatever the AI's own free-text `colorPalette` description
// mentions (text-suggestions fallback mode only). Deliberately conservative:
// first keyword match wins, falls back to the style's own accent if nothing
// matches. Not a parser — just a light visual tie-in so the orb reacts to
// the actual AI response, not only the pre-submit style choice.
const KEYWORD_ACCENTS: Array<[RegExp, string]> = [
  [/terracotta|rust|burnt orange/i, "#c1440e"],
  [/mustard|ochre|gold/i, "#e0b13a"],
  [/sage|olive/i, "#8a9a6b"],
  [/forest|emerald|green/i, "#2f6f4f"],
  [/navy|indigo/i, "#3b4a7a"],
  [/teal|turquoise/i, "#2c7a7b"],
  [/blue/i, "#5aa0b0"],
  [/blush|dusty pink|rose/i, "#d98a95"],
  [/charcoal|graphite|black/i, "#3a3a3a"],
  [/cream|ivory|beige|tan/i, "#e8dcc8"],
  [/walnut|wood|oak|brown/i, "#8a5a34"],
  [/lavender|purple|violet/i, "#a78bfa"],
];

export function deriveAccentFromText(text: string, fallback: string): string {
  for (const [pattern, hex] of KEYWORD_ACCENTS) {
    if (pattern.test(text)) return hex;
  }
  return fallback;
}
