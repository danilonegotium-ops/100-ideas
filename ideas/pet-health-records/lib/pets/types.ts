export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  chip_number: string | null;
  created_at: string;
}

export type EntryType = "vaccination" | "vet_visit";

export interface PetEntry {
  id: string;
  owner_id: string;
  pet_id: string;
  entry_type: EntryType;
  description: string;
  entry_date: string; // "YYYY-MM-DD"
  next_due_date: string | null; // "YYYY-MM-DD"
  created_at: string;
}

export type DueStatus = "overdue" | "upcoming" | "ok";

/** Overdue = due date already passed. Upcoming = due within 30 days. */
export function dueStatus(nextDueDate: string, today: Date = new Date()): DueStatus {
  const due = new Date(nextDueDate + "T00:00:00");
  const todayMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const diffDays = Math.round(
    (due.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "overdue";
  if (diffDays <= 30) return "upcoming";
  return "ok";
}
