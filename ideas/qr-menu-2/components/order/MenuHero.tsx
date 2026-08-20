"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { StatTile } from "@/components/motion/StatTile";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

/**
 * Tier 3 flagship hero for the table-facing menu page — the first thing a
 * diner sees after scanning the QR code at their table. Orchestrated
 * page-load sequence (eyebrow → name → subhead → stat row, staggered, not
 * everything fading in at once), a slowly-panning GradientMesh backdrop
 * behind a frosted `.glass` panel. Purely presentational — every number
 * here is derived from the same `categories`/`items` arrays the page
 * already fetched server-side, nothing new queried.
 */
export function MenuHero({
  restaurantName,
  tableLabel,
  dishCount,
  categoryCount,
  availableCount,
}: {
  restaurantName: string;
  tableLabel: string;
  dishCount: number;
  categoryCount: number;
  availableCount: number;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="glass glow-accent relative mb-8 overflow-hidden rounded-xl2 border border-border px-6 py-10 sm:px-10 sm:py-14">
      <GradientMesh animate className="opacity-70" />
      <motion.div
        variants={container}
        initial={prefersReducedMotion ? undefined : "hidden"}
        animate="show"
        className="relative"
      >
        <motion.p
          variants={item}
          className="mb-2 text-caption font-semibold uppercase tracking-widest text-accent"
        >
          {tableLabel} · scan-to-order menu
        </motion.p>
        <motion.h1 variants={item} className="text-display text-fg">
          {restaurantName}
        </motion.h1>
        <motion.p variants={item} className="mt-3 max-w-md text-body text-muted">
          Browse the menu, add what you&apos;re craving, and pay right from
          your phone — no server flag-down required.
        </motion.p>

        <motion.div variants={item} className="mt-7 grid grid-cols-3 gap-3">
          <StatTile label="Dishes" value={dishCount} />
          <StatTile label="Categories" value={categoryCount} />
          <StatTile label="Available now" value={availableCount} />
        </motion.div>

        <motion.div
          variants={item}
          className="mt-8 flex items-center gap-2 text-caption text-muted"
        >
          <motion.span
            aria-hidden
            animate={prefersReducedMotion ? undefined : { y: [0, 4, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            ↓
          </motion.span>
          Browse the menu below
        </motion.div>
      </motion.div>
    </section>
  );
}
