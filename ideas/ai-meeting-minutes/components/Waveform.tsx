"use client";

import { motion, useReducedMotion } from "framer-motion";

// Fixed per-bar timing so the waveform reads as organic (not a single wave
// scrolling uniformly) without any per-frame audio analysis — this is a
// listening-state indicator, not a real amplitude visualization, so it
// doesn't need to touch the SpeechRecognition capture logic at all.
const BARS = [
  { duration: 0.9, delay: 0 },
  { duration: 1.1, delay: 0.05 },
  { duration: 0.75, delay: 0.1 },
  { duration: 1.3, delay: 0.02 },
  { duration: 0.95, delay: 0.15 },
  { duration: 1.05, delay: 0.08 },
  { duration: 0.8, delay: 0.2 },
  { duration: 1.2, delay: 0.04 },
  { duration: 0.9, delay: 0.12 },
  { duration: 1.0, delay: 0.06 },
  { duration: 0.85, delay: 0.18 },
  { duration: 1.15, delay: 0.03 },
];

/**
 * Tier 2 core-loop centerpiece: a live "listening" waveform shown while
 * `SpeechRecognition` is actively capturing. Purely presentational — driven
 * by `active`, which the page already derives from its own `recording`
 * state — so it needs no access to the mic stream or recognition internals.
 */
export function Waveform({ active }: { active: boolean }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-label={active ? "Listening" : "Microphone idle"}
      className="flex h-14 items-center justify-center gap-1 rounded-brand border border-border bg-surface px-4"
    >
      {BARS.map((bar, i) => (
        <motion.span
          key={i}
          className="w-1.5 rounded-full bg-accent"
          style={{ height: "100%" }}
          animate={
            active && !prefersReducedMotion
              ? { scaleY: [0.25, 1, 0.4, 0.85, 0.25] }
              : { scaleY: 0.15 }
          }
          transition={
            active && !prefersReducedMotion
              ? {
                  duration: bar.duration,
                  delay: bar.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}
