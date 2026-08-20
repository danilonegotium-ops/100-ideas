"use client";

import { motion, useReducedMotion } from "framer-motion";

const SIZE = 140;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatElapsed(ms: number): string {
  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(1)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(1);
  return `${minutes}m ${seconds}s`;
}

/**
 * Tier 2 core-loop centerpiece: a live "the clock is ticking" ring around
 * the elapsed-time readout. There's no fixed countdown target (the riddle
 * has no time limit — fastest correct solve wins), so instead of a
 * progress-to-zero sweep this renders a continuously spinning arc + a soft
 * pulse, the same visual language as a countdown ring but honest about the
 * fact this game clock counts up, not down.
 */
export function TimerRing({ elapsedMs, active }: { elapsedMs: number; active: boolean }) {
  const prefersReducedMotion = useReducedMotion();
  // A partial arc (75% of the circumference) so the spin reads clearly as
  // motion rather than a static full circle.
  const arcLength = CIRCUMFERENCE * 0.75;
  const dashArray = `${arcLength} ${CIRCUMFERENCE}`;

  return (
    <div className="relative mx-auto flex h-[140px] w-[140px] items-center justify-center">
      <motion.svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="absolute inset-0"
        animate={active && !prefersReducedMotion ? { rotate: 360 } : undefined}
        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          className={active && !prefersReducedMotion ? "animate-glow-pulse" : undefined}
        />
      </motion.svg>
      <div className="relative flex flex-col items-center">
        <span className="font-mono text-xl font-semibold text-fg tabular-nums">
          {formatElapsed(elapsedMs)}
        </span>
        <span className="text-caption text-muted">{active ? "solving…" : "time"}</span>
      </div>
    </div>
  );
}
