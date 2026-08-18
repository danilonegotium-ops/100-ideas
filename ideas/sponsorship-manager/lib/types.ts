export type DealStage = "prospecting" | "negotiating" | "signed" | "paid" | "declined";

export type Deal = {
  id: string;
  sponsor_name: string;
  contact_name: string | null;
  contact_email: string | null;
  stage: DealStage;
  deal_value: number | null;
  currency: string;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
  updated_at: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

// Pipeline order, used to render kanban columns and to compute "move to
// next/previous stage". 'declined' is reachable from any stage but isn't
// part of the forward flow, so it's rendered as its own column at the end
// rather than something you "move forward" into automatically.
export const PIPELINE_STAGES: DealStage[] = ["prospecting", "negotiating", "signed", "paid", "declined"];

export const STAGE_LABEL: Record<DealStage, string> = {
  prospecting: "Prospecting",
  negotiating: "Negotiating",
  signed: "Signed",
  paid: "Paid",
  declined: "Declined",
};

const FORWARD_FLOW: DealStage[] = ["prospecting", "negotiating", "signed", "paid"];

export function nextStage(stage: DealStage): DealStage | null {
  const index = FORWARD_FLOW.indexOf(stage);
  if (index === -1 || index === FORWARD_FLOW.length - 1) return null;
  return FORWARD_FLOW[index + 1];
}

export function previousStage(stage: DealStage): DealStage | null {
  const index = FORWARD_FLOW.indexOf(stage);
  if (index <= 0) return null;
  return FORWARD_FLOW[index - 1];
}

export function formatCurrency(amount: number | null, currency: string): string {
  if (amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
