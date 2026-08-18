/**
 * Pure function — no I/O — so it's directly testable with a throwaway
 * `node -e` / `require()` script (after compiling, or via ts-node) and
 * easy to review in isolation from the Supabase insert that consumes it.
 * Generates a run of back-to-back slots for one day, e.g. "09:00–17:00,
 * 30-minute slots" -> 16 slot rows.
 */
export function generateSlotsForDay({
  dateISO,
  startTime,
  endTime,
  durationMinutes,
  serviceName,
}: {
  /** "YYYY-MM-DD" */
  dateISO: string;
  /** "HH:MM", 24h */
  startTime: string;
  /** "HH:MM", 24h */
  endTime: string;
  durationMinutes: number;
  serviceName: string;
}): { starts_at: string; ends_at: string; service_name: string }[] {
  if (durationMinutes <= 0) {
    throw new Error("durationMinutes must be positive");
  }

  const dayStart = new Date(`${dateISO}T${startTime}:00`);
  const dayEnd = new Date(`${dateISO}T${endTime}:00`);

  if (Number.isNaN(dayStart.getTime()) || Number.isNaN(dayEnd.getTime())) {
    throw new Error("Invalid date/time input");
  }
  if (dayEnd <= dayStart) {
    return [];
  }

  const slots: { starts_at: string; ends_at: string; service_name: string }[] = [];
  let cursor = new Date(dayStart);

  while (true) {
    const slotEnd = new Date(cursor.getTime() + durationMinutes * 60_000);
    if (slotEnd > dayEnd) break;
    slots.push({
      starts_at: cursor.toISOString(),
      ends_at: slotEnd.toISOString(),
      service_name: serviceName,
    });
    cursor = slotEnd;
  }

  return slots;
}
