export interface MoodEntry {
  id: string;
  entry_date: string; // Postgres `date`, e.g. "2026-08-10"
  content: string;
  mood_label: string | null;
  mood_score: number | null;
  created_at: string;
}

/**
 * A Postgres `date` column ("YYYY-MM-DD") has no time/timezone component.
 * `new Date("YYYY-MM-DD")` parses it as UTC midnight, so `.toLocaleDateString()`
 * can render the previous day for anyone west of UTC. Build the `Date` from
 * its parts instead — see the same gotcha noted for concert-buddy/pet-health-records.
 */
export function formatEntryDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Local (device timezone) "today" as a `YYYY-MM-DD` string, for matching a `date` column. */
export function todayLocalISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
