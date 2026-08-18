"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import type { ActionResult, DealStage } from "@/lib/types";

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

export async function addDeal(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const sponsor_name = String(formData.get("sponsor_name") || "").trim();
  const contact_name = String(formData.get("contact_name") || "").trim();
  const contact_email = String(formData.get("contact_email") || "").trim();
  const dealValueRaw = String(formData.get("deal_value") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const next_action = String(formData.get("next_action") || "").trim();
  const next_action_date = String(formData.get("next_action_date") || "").trim();

  if (!sponsor_name) {
    return { ok: false, error: "Sponsor name is required." };
  }

  let deal_value: number | null = null;
  if (dealValueRaw) {
    const parsed = Number(dealValueRaw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: "Deal value must be a positive number." };
    }
    deal_value = parsed;
  }

  const supabase = createClient();
  const { error } = await supabase.from("sponsorship_manager_deals").insert({
    user_id: user.id,
    sponsor_name,
    contact_name: contact_name || null,
    contact_email: contact_email || null,
    deal_value,
    notes: notes || null,
    next_action: next_action || null,
    next_action_date: next_action_date || null,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setDealStage(dealId: string, stage: DealStage): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("sponsorship_manager_deals")
    .update({ stage })
    .eq("id", dealId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateDealDetails(
  dealId: string,
  fields: {
    notes: string;
    next_action: string;
    next_action_date: string;
    deal_value: string;
  },
): Promise<ActionResult> {
  const user = await requireUser();

  let deal_value: number | null = null;
  if (fields.deal_value.trim()) {
    const parsed = Number(fields.deal_value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: "Deal value must be a positive number." };
    }
    deal_value = parsed;
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("sponsorship_manager_deals")
    .update({
      notes: fields.notes.trim() || null,
      next_action: fields.next_action.trim() || null,
      next_action_date: fields.next_action_date.trim() || null,
      deal_value,
    })
    .eq("id", dealId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteDeal(dealId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("sponsorship_manager_deals")
    .delete()
    .eq("id", dealId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
