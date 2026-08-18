export type InvoiceStatus = "pending" | "paid" | "void";

export type Invoice = {
  id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: InvoiceStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Reminder = {
  id: string;
  invoice_id: string;
  sent_at: string;
  channel: string;
  delivery_status: "sent" | "logged" | "failed";
  message_preview: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

/** True when an invoice is still unpaid and past its due date. Derived,
 * never stored — see the comment in schema.sql. */
export function isOverdue(invoice: Pick<Invoice, "status" | "due_date">): boolean {
  if (invoice.status !== "pending") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(invoice.due_date + "T00:00:00");
  return due.getTime() < today.getTime();
}

export function formatCurrency(amount: number, currency: string): string {
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
