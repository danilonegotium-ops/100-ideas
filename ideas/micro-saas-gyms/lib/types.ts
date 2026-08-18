export type MemberStatus = "active" | "cancelled";
export type MembershipState = "active" | "expiring" | "expired" | "cancelled";

export type Member = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  plan_name: string;
  subscription_end: string;
  status: MemberStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Checkin = {
  id: string;
  member_id: string;
  checked_in_at: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

const EXPIRING_SOON_WINDOW_DAYS = 7;

/** Derives the effective membership state from the manual `status`
 * override plus `subscription_end` vs today. See the comment in
 * schema.sql for why this isn't just a single stored column. */
export function membershipState(member: Pick<Member, "status" | "subscription_end">): MembershipState {
  if (member.status === "cancelled") return "cancelled";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(member.subscription_end + "T00:00:00");

  if (end.getTime() < today.getTime()) return "expired";

  const soonCutoff = new Date(today);
  soonCutoff.setDate(soonCutoff.getDate() + EXPIRING_SOON_WINDOW_DAYS);
  if (end.getTime() <= soonCutoff.getTime()) return "expiring";

  return "active";
}

export function isCheckedInToday(checkedInAt: string): boolean {
  const today = new Date();
  const date = new Date(checkedInAt);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
