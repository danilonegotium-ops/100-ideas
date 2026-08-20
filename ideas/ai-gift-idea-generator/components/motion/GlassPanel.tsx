import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Adds `.glow-accent` (a soft ambient blur behind the panel) — reach for
   * this on a hero panel over a GradientMesh/FloatingOrb backdrop, not on
   * dense in-page cards where it would just look like a rendering glitch. */
  glow?: boolean;
}

/**
 * Tier 1+ building block: a frosted-glass surface (translucent background +
 * backdrop blur + hairline border + inner top highlight) for panels that sit
 * above a gradient/3D backdrop — hero sections, modals, nav bars — where the
 * flat `bg-surface` Card would look like a solid card floating awkwardly
 * on top of the effect instead of part of the scene.
 *
 * Server-renderable (no hooks, no "use client") — use plain `Card` for
 * ordinary list/table content and reach for `GlassPanel` specifically when
 * there's something behind it worth seeing through.
 */
export function GlassPanel({ className, glow = false, ...props }: GlassPanelProps) {
  return (
    <div
      className={cn(
        "glass rounded-brand p-6",
        glow && "glow-accent",
        className,
      )}
      {...props}
    />
  );
}
