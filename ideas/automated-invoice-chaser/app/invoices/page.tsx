import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { isOverdue, type Invoice, type Reminder } from "@/lib/types";
import { AddInvoiceForm } from "@/components/AddInvoiceForm";
import { InvoiceTable } from "@/components/InvoiceTable";
import { SignOutButton } from "@/components/SignOutButton";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";

export default async function InvoicesPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();

  const [{ data: invoiceRows, error: invoicesError }, { data: reminderRows }] = await Promise.all([
    supabase
      .from("automated_invoice_chaser_invoices")
      .select("*")
      .order("due_date", { ascending: true }),
    supabase
      .from("automated_invoice_chaser_reminders")
      .select("*")
      .order("sent_at", { ascending: false }),
  ]);

  const invoices = (invoiceRows ?? []) as Invoice[];
  const reminders = (reminderRows ?? []) as Reminder[];

  // Most recent reminder per invoice, for the "last reminded" column.
  const lastReminderByInvoice = new Map<string, Reminder>();
  for (const reminder of reminders) {
    if (!lastReminderByInvoice.has(reminder.invoice_id)) {
      lastReminderByInvoice.set(reminder.invoice_id, reminder);
    }
  }

  const pending = invoices.filter((invoice) => invoice.status === "pending");
  const overdue = pending.filter((invoice) => isOverdue(invoice));
  const paid = invoices.filter((invoice) => invoice.status === "paid");

  const outstandingTotal = pending.reduce((sum, invoice) => sum + invoice.amount, 0);
  const overdueTotal = overdue.reduce((sum, invoice) => sum + invoice.amount, 0);
  const paidTotal = paid.reduce((sum, invoice) => sum + invoice.amount, 0);

  // Sort so overdue invoices surface first, then upcoming pending by due
  // date, then paid/void at the bottom.
  const sortedInvoices = [...invoices].sort((a, b) => {
    const rank = (invoice: Invoice) => (isOverdue(invoice) ? 0 : invoice.status === "pending" ? 1 : 2);
    const rankDiff = rank(a) - rank(b);
    if (rankDiff !== 0) return rankDiff;
    return a.due_date.localeCompare(b.due_date);
  });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Invoices</h1>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {invoicesError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">Couldn&apos;t load invoices: {invoicesError.message}</p>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            label="Outstanding"
            value={outstandingTotal}
            prefix="$"
            decimals={2}
            trend={`${pending.length} unpaid invoice${pending.length === 1 ? "" : "s"}`}
          />
          <StatTile
            label="Overdue"
            value={overdueTotal}
            prefix="$"
            decimals={2}
            trend={`${overdue.length} invoice${overdue.length === 1 ? "" : "s"} past due`}
            trendTone={overdue.length > 0 ? "negative" : "neutral"}
            className={overdue.length > 0 ? "border-danger" : undefined}
          />
          <StatTile
            label="Paid to date"
            value={paidTotal}
            prefix="$"
            decimals={2}
            trend={`${paid.length} invoice${paid.length === 1 ? "" : "s"}`}
            trendTone="positive"
          />
        </div>

        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Add invoice</h2>
          <AddInvoiceForm />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">All invoices</h2>
        {sortedInvoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            description="Add your first invoice above — overdue ones are flagged automatically once they pass their due date."
          />
        ) : (
          <InvoiceTable invoices={sortedInvoices} lastReminderByInvoice={Object.fromEntries(lastReminderByInvoice)} />
        )}
      </main>
    </>
  );
}
