"use client";

import { FloatingOrb } from "./FloatingOrb";

/**
 * Flagship fork of `FloatingOrb` for this dashboard's hero (see
 * DESIGN_SYSTEM.md's Tier 3 note: each flagship app should extend the
 * generic orb into something specific to its own concept rather than
 * reusing it literally everywhere).
 *
 * For a financial dashboard, "specific to the concept" isn't a literal
 * object — it's restraint: a single softly-distorting glass sphere tucked
 * behind the hero copy, tinted with the secondary accent hue and heavily
 * faded, reading as an ambient premium-analytics glow rather than a
 * decoration competing with the numbers. Purely decorative (`aria-hidden`
 * via FloatingOrb itself) — never sits under interactive elements.
 *
 * This is the actual `<Canvas>`-rendering component — always load it via
 * the `AmbientRevenueOrb.tsx` client-side lazy wrapper next to this file,
 * never import it directly. react-three-fiber touches `window`/WebGL at
 * module init, which breaks Next.js's server render of this component; the
 * wrapper's `next/dynamic(..., { ssr: false })` is what skips that.
 */
export default function AmbientRevenueOrbInner() {
  return (
    <div className="pointer-events-none absolute -right-16 -top-24 h-[420px] w-[420px] opacity-40 mix-blend-screen sm:-right-10 sm:-top-32">
      <FloatingOrb color="#a78bfa" distort={0.55} className="h-full w-full" />
    </div>
  );
}
