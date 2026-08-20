"use client";

import { ReactNode, useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  /** Final numeric value to count up to. Use `value` for the number and
   * `prefix`/`suffix` for currency signs, units, "%", etc. so the digits
   * animate cleanly (e.g. value={128} suffix=" bookings"). */
  value: number;
  prefix?: string;
  suffix?: string;
  /** Decimal places to render, e.g. 2 for currency totals. */
  decimals?: number;
  /** BCP 47 locale for thousands-grouping during the count-up, e.g. "sr-RS"
   * for "125.000" instead of the default "125,000". Omit to use the
   * viewer's browser locale. */
  locale?: string;
  /** Optional trend badge, e.g. "+12% vs last week". Purely presentational —
   * pass a pre-colored className via trendTone if it's negative. */
  trend?: string;
  trendTone?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  className?: string;
}

/**
 * Tier 1 building block: a dashboard stat card whose headline number counts
 * up from 0 the first time it scrolls into view (via a spring, not a linear
 * tween, so it settles instead of ticking to a hard stop). Built for the
 * ~35 CRUD/dashboard apps that currently just render a raw number — swap
 * `<p className="text-2xl">{count}</p>` for `<StatTile label="..." value={count} />`.
 */
export function StatTile({
  label,
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  locale,
  trend,
  trendTone = "neutral",
  icon,
  className,
}: StatTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const prefersReducedMotion = useReducedMotion();
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.6 });
  const displayRef = useRef<HTMLSpanElement>(null);
  const formatNumber = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

  useEffect(() => {
    if (inView) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const unsubscribe = spring.on("change", (latest) => {
      if (displayRef.current) {
        displayRef.current.textContent = formatNumber(latest);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spring, decimals, locale, prefersReducedMotion]);

  const trendColor =
    trendTone === "positive"
      ? "text-accent-strong"
      : trendTone === "negative"
        ? "text-danger"
        : "text-muted";

  return (
    <motion.div
      ref={ref}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-brand border border-border bg-surface p-5",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-caption uppercase tracking-wide text-muted">{label}</span>
        {icon ? <span className="text-muted">{icon}</span> : null}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-headline text-fg tabular-nums">
          {prefix}
          <span ref={displayRef}>{prefersReducedMotion ? formatNumber(value) : formatNumber(0)}</span>
          {suffix}
        </p>
      </div>
      {trend ? <p className={cn("mt-1 text-caption", trendColor)}>{trend}</p> : null}
    </motion.div>
  );
}
