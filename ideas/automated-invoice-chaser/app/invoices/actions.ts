"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { formatCurrency, formatDate, type ActionResult, type Invoice } from "@/lib/types";

async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function addInvoice(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const client_name = String(formData.get("client_name") || "").trim();
  const client_email = String(formData.get("client_email") || "").trim();
  const amountRaw = String(formData.get("amount") || "").trim();
  const due_date = String(formData.get("due_date") || "").trim();
  const notes = String(formData.get("notes") || "").trim();

  if (!client_name || !client_email || !amountRaw || !due_date) {
    return { ok: false, error: "Client name, email, amount, and due date are required." };
  }
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be a positive number." };
  }
  if (Number.isNaN(Date.parse(due_date))) {
    return { ok: false, error: "Due date is not a valid date." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("automated_invoice_chaser_invoices").insert({
    user_id: user.id,
    client_name,
    client_email,
    amount,
    due_date,
    notes: notes || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/invoices");
  return { ok: true };
}

export async function setInvoiceStatus(
  invoiceId: string,
  status: "pending" | "paid" | "void",
): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("automated_invoice_chaser_invoices")
    .update({ status })
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/invoices");
  return { ok: true };
}

export async function deleteInvoice(invoiceId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("automated_invoice_chaser_invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/invoices");
  return { ok: true };
}

/**
 * Builds the reminder email content and, if RESEND_API_KEY is configured,
 * actually sends it via Resend's HTTP API. Never throws — a missing key or
 * a failed request both degrade to a logged/failed row instead of crashing
 * the action, since chasing an invoice should never be blocked by email
 * infrastructure being unavailable.
 */
async function dispatchReminderEmail(
  invoice: Pick<Invoice, "client_name" | "client_email" | "amount" | "currency" | "due_date">,
): Promise<{ status: "sent" | "logged" | "failed"; preview: string }> {
  const preview = `Reminder: invoice for ${invoice.client_name} (${formatCurrency(
    invoice.amount,
    invoice.currency,
  )}) was due on ${formatDate(invoice.due_date)}.`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { status: "logged", preview };
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "reminders@example.com";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: invoice.client_email,
        subject: `Payment reminder: invoice due ${formatDate(invoice.due_date)}`,
        text: `Hi ${invoice.client_name},\n\nThis is a friendly reminder that your invoice for ${formatCurrency(
          invoice.amount,
          invoice.currency,
        )} was due on ${formatDate(invoice.due_date)}. If you've already paid, please disregard this message.\n\nThanks!`,
      }),
    });

    if (!res.ok) {
      return { status: "failed", preview };
    }
    return { status: "sent", preview };
  } catch {
    return { status: "failed", preview };
  }
}

export async function sendReminder(invoiceId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();

  const { data: invoice, error: fetchError } = await supabase
    .from("automated_invoice_chaser_invoices")
    .select("client_name, client_email, amount, currency, due_date")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !invoice) {
    return { ok: false, error: fetchError?.message ?? "Invoice not found." };
  }

  const { status, preview } = await dispatchReminderEmail(invoice);

  const { error: insertError } = await supabase.from("automated_invoice_chaser_reminders").insert({
    invoice_id: invoiceId,
    user_id: user.id,
    channel: "email",
    delivery_status: status,
    message_preview: preview,
  });

  if (insertError) return { ok: false, error: insertError.message };

  revalidatePath("/invoices");
  return status === "failed"
    ? { ok: false, error: "Resend API call failed — logged the attempt, but no email went out." }
    : { ok: true };
}
