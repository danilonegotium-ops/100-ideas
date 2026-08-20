"use client";

import { CSSProperties, HTMLAttributes, PointerEvent, useRef } from "react";
import { cn } from "@/lib/utils";

type DivPropsSafeForMotion = Omit<HTMLAttributes<HTMLDivElement>, "onPointerMove">;

export interface SpotlightCardProps extends DivPropsSafeForMotion {
  /** Radius of the glow in px. */
  size?: number;
}

/**
 * Tier 2 building block: a card with a mouse-tracked radial "spotlight" glow
 * that follows the pointer (the 21st.dev/Aceternity "Spotlight" pattern) —
 * reach for this on the ~10 rich-interactive apps' core-loop cards (a match
 * profile, a menu item, a map popup) where a bit of physicality rewards
 * hovering, not on dense CRUD tables.
 *
 * Pure CSS custom-property tracking (no per-frame React state), so it's
 * cheap even in a grid of many cards.
 */
export function SpotlightCard({ className, size = 400, style, children, ...props }: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  }

  return (
    <div
      ref={ref}
      onPointerMove={handlePointerMove}
      className={cn(
        "group relative overflow-hidden rounded-brand border border-border bg-surface p-5",
        className,
      )}
      style={{ ...style, "--spot-size": `${size}px` } as CSSProperties}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(var(--spot-size) circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(var(--accent-rgb), 0.15), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}
