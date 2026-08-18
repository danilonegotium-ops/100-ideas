// Shared between the client style-picker and server-side validation —
// pure data, safe to import from both.
export const STYLES = [
  "Modern",
  "Nordic / Scandinavian",
  "Minimalist",
  "Industrial",
  "Bohemian",
  "Mid-Century Modern",
  "Rustic",
  "Coastal",
] as const;

export type Style = (typeof STYLES)[number];
