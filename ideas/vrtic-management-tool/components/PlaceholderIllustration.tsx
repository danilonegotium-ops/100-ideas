import type { PlaceholderKey } from "@/lib/types";

/**
 * Deliberately NOT a real photo, and NOT free-form user-supplied
 * SVG/HTML (which would be an XSS vector) — `placeholder_key` is a fixed
 * enum column (see schema.sql's check constraint), mapped here to a
 * hardcoded emoji + background color card.
 */
const PLACEHOLDER_MAP: Record<PlaceholderKey, { emoji: string; bg: string }> = {
  sun: { emoji: "☀️", bg: "#fde68a" },
  balloons: { emoji: "🎈", bg: "#fecaca" },
  painting: { emoji: "🎨", bg: "#bfdbfe" },
  blocks: { emoji: "🧱", bg: "#fed7aa" },
  garden: { emoji: "🌻", bg: "#bbf7d0" },
  nap: { emoji: "🌙", bg: "#ddd6fe" },
  music: { emoji: "🎵", bg: "#fbcfe8" },
  story: { emoji: "📖", bg: "#a5f3fc" },
};

export function PlaceholderIllustration({ placeholderKey }: { placeholderKey: PlaceholderKey }) {
  const entry = PLACEHOLDER_MAP[placeholderKey] ?? PLACEHOLDER_MAP.sun;
  return (
    <div
      className="flex h-32 w-full items-center justify-center rounded-brand text-5xl"
      style={{ backgroundColor: entry.bg }}
      role="img"
      aria-label={`ilustracija: ${placeholderKey}`}
    >
      {entry.emoji}
    </div>
  );
}
