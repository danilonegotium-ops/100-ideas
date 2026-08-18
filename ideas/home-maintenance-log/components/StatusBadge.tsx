import { cn } from "@/lib/utils";
import type { SystemStatus } from "@/lib/status";

const LABELS: Record<SystemStatus, string> = {
  overdue: "Overdue",
  "due-soon": "Due soon",
  ok: "On track",
  unscheduled: "Not scheduled",
};

// Solid color pairings only (no opacity modifiers on the CSS-variable-backed
// theme colors — Tailwind's `/alpha` shorthand can't reliably decompose a
// `var(--x)` color value into RGB channels at build time, so we mirror the
// exact solid pairings already used by Button.tsx's variants instead).
const CLASSES: Record<SystemStatus, string> = {
  overdue: "bg-danger text-[#2b0606]",
  "due-soon": "bg-accent text-[#062b1c]",
  ok: "bg-border text-fg",
  unscheduled: "bg-border text-muted",
};

export function StatusBadge({
  status,
  className,
}: {
  status: SystemStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        CLASSES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}
