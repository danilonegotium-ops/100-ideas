import { cn } from "@/lib/utils";

export interface GradientMeshProps {
  className?: string;
  /** Slowly pans the mesh (CSS-only animation, no JS). Off by default so it
   * reads as a still backdrop unless a hero specifically wants motion. */
  animate?: boolean;
}

/**
 * Tier 2/3 building block: a soft, blurred multi-color radial-gradient
 * backdrop (the "gradient mesh" / "aurora" pattern from 21st.dev's
 * Backgrounds category) built from the two accent hues in globals.css.
 * Absolutely positioned — render it as the first child of a `relative`
 * hero/section wrapper, behind real content (`aria-hidden`, no layout box).
 *
 * Pure CSS: no canvas, no per-frame JS, safe to use on pages that also run
 * FloatingOrb or SpotlightCard without competing for the GPU.
 */
export function GradientMesh({ className, animate = false }: GradientMeshProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 bg-gradient-mesh blur-3xl",
        animate && "bg-[length:200%_200%] animate-gradient-x",
        className,
      )}
    />
  );
}
