import type { ServiceEvent } from "./types";

export type SystemStatus = "overdue" | "due-soon" | "ok" | "unscheduled";

/** A system's next service is flagged "due soon" inside this many days. */
export const DUE_SOON_WINDOW_DAYS = 30;

/**
 * Parses a Postgres `date` string ("YYYY-MM-DD") into a UTC-midnight
 * timestamp, deliberately avoiding the local-timezone shifting that
 * `new Date("YYYY-MM-DD")` combined with local-time comparisons can cause
 * (e.g. a serverless function running in one UTC offset reading a date as
 * "yesterday"). Every date in this app is treated as a plain calendar date,
 * not an instant, so all comparisons happen in UTC calendar-day space.
 */
function parseDateOnlyUTC(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function todayUTC(referenceDate: Date): number {
  return Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  );
}

/**
 * Status of a system based on the `next_service_due` date of its most
 * recent service event (or `null` if it has never been serviced / has no
 * scheduled next date).
 */
export function getSystemStatus(
  nextServiceDue: string | null,
  referenceDate: Date = new Date(),
): SystemStatus {
  if (!nextServiceDue) return "unscheduled";

  const dueDays = parseDateOnlyUTC(nextServiceDue);
  const diffDays = Math.round((dueDays - todayUTC(referenceDate)) / 86_400_000);

  if (diffDays < 0) return "overdue";
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return "due-soon";
  return "ok";
}

/** Signed day count until `nextServiceDue` (negative = overdue). */
export function daysUntil(
  nextServiceDue: string,
  referenceDate: Date = new Date(),
): number {
  const dueDays = parseDateOnlyUTC(nextServiceDue);
  return Math.round((dueDays - todayUTC(referenceDate)) / 86_400_000);
}

/**
 * Given all service events for a set of systems, returns a map of
 * systemId -> most recent event (by `service_date`, ties broken by
 * `created_at`). Pure function, safe to unit-test without a database.
 */
export function latestEventBySystem(
  events: ServiceEvent[],
): Map<string, ServiceEvent> {
  const latest = new Map<string, ServiceEvent>();

  for (const event of events) {
    const current = latest.get(event.system_id);
    if (
      !current ||
      event.service_date > current.service_date ||
      (event.service_date === current.service_date &&
        event.created_at > current.created_at)
    ) {
      latest.set(event.system_id, event);
    }
  }

  return latest;
}

/** Severity ordering used to pick the "worst" status across several systems. */
const SEVERITY: Record<SystemStatus, number> = {
  overdue: 3,
  "due-soon": 2,
  unscheduled: 1,
  ok: 0,
};

export function worstStatus(statuses: SystemStatus[]): SystemStatus {
  return statuses.reduce<SystemStatus>(
    (worst, s) => (SEVERITY[s] > SEVERITY[worst] ? s : worst),
    "ok",
  );
}
