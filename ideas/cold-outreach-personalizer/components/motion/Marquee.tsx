import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface MarqueeProps {
  children: ReactNode;
  className?: string;
  /** Reverse scroll direction. */
  reverse?: boolean;
  /** Pause the scroll on hover — nice for a strip of cards the user might
   * want to actually read/click. */
  pauseOnHover?: boolean;
}

/**
 * Tier 1/2 building block: an infinite horizontal auto-scroll strip (logos,
 * testimonials, recent-activity chips, menu categories). Renders `children`
 * twice back-to-back and animates a translateX(-50%) loop, so the content
 * must be a fixed-width flex row (e.g. a row of chips/cards) — not
 * full-width block content.
 *
 * Pure CSS animation (`animate-marquee` from tailwind.config.ts), respects
 * prefers-reduced-motion via the guard in globals.css.
 */
export function Marquee({ children, className, reverse = false, pauseOnHover = false }: MarqueeProps) {
  return (
    <div className={cn("group relative overflow-hidden scrollbar-hide", className)}>
      <div
        className={cn(
          "flex w-max animate-marquee gap-4",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        <div className="flex shrink-0 items-center gap-4">{children}</div>
        <div className="flex shrink-0 items-center gap-4" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}
