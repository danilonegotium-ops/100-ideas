/**
 * Formats a Postgres `date` column value ("YYYY-MM-DD", no time/timezone)
 * for display. Deliberately does NOT use `new Date("YYYY-MM-DD")` —
 * that constructor parses the string as UTC midnight, and
 * `.toLocaleDateString()` then renders it in the viewer's local timezone,
 * which can shift the displayed date back a day for anyone west of UTC.
 * Building the Date from its parts instead keeps it a local-timezone date
 * with the same calendar day the string says.
 */
export function formatDateOnly(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Today as "YYYY-MM-DD" in the server's local calendar day. */
export function todayDateInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
