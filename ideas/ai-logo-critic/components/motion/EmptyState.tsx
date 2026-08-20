"use client";

import { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Tier 1 building block: a friendlier "nothing here yet" state than a bare
 * `<p className="text-muted">No items.</p>` — a soft fade/scale-in, an
 * optional icon in a glowing circle, and an optional action slot (usually a
 * `<Button>`). Every one of the 51 apps hits this state constantly (first
 * login, cleared filters, empty search) so it's worth one shared component
 * instead of 35 bespoke one-liners.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center rounded-brand border border-dashed border-border bg-surface/50 px-6 py-12 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
          {icon}
        </div>
      ) : null}
      <p className="text-title text-fg">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </motion.div>
  );
}
