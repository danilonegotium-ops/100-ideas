"use client";

import { HTMLAttributes } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

// framer-motion's <motion.div> redeclares a handful of DOM event handlers
// (onDrag/onAnimationStart/etc.) with its own richer signatures, so a plain
// HTMLAttributes spread onto it conflicts. Omit those few — nothing here
// uses them — rather than fighting the two overload sets.
type DivPropsSafeForMotion = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

export interface AnimatedCardProps extends DivPropsSafeForMotion {
  /** Stagger index — pass the item's position in a list/grid so a group of
   * AnimatedCards cascades in instead of popping in all at once. */
  index?: number;
  /** Set false to skip the mount animation (e.g. cards added one-by-one by
   * user action, where a fade-in on every re-render would be distracting). */
  animateOnMount?: boolean;
  /** Set false for static/dense list rows where a hover lift would be noisy. */
  hoverLift?: boolean;
}

/**
 * Tier 1 building block: the shared `Card` with a Framer Motion fade/slide-in
 * on mount and a subtle hover lift + shadow. Drop-in replacement for `Card`
 * anywhere a list of cards, a bento grid, or a dashboard tile needs to feel
 * alive without any bespoke animation code per-app.
 *
 * Usage:
 *   {items.map((item, i) => (
 *     <AnimatedCard key={item.id} index={i}>...</AnimatedCard>
 *   ))}
 */
export function AnimatedCard({
  className,
  index = 0,
  animateOnMount = true,
  hoverLift = true,
  children,
  ...props
}: AnimatedCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={animateOnMount && !prefersReducedMotion ? { opacity: 0, y: 12 } : undefined}
      animate={animateOnMount && !prefersReducedMotion ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.45,
        delay: Math.min(index * 0.06, 0.6),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={
        hoverLift && !prefersReducedMotion
          ? { y: -4, boxShadow: "0 12px 32px -12px rgba(0,0,0,0.28)" }
          : undefined
      }
      className={cn(
        "rounded-brand border border-border bg-surface p-5 transition-colors",
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
