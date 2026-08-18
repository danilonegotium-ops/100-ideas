"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import type { ActionResult, MemberStatus } from "@/lib/types";

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

export async function addMember(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const full_name = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const plan_name = String(formData.get("plan_name") || "").trim() || "Standard";
  const subscription_end = String(formData.get("subscription_end") || "").trim();

  if (!full_name || !subscription_end) {
    return { ok: false, error: "Full name and subscription end date are required." };
  }
  if (Number.isNaN(Date.parse(subscription_end))) {
    return { ok: false, error: "Subscription end date is not valid." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("micro_saas_gyms_members").insert({
    user_id: user.id,
    full_name,
    email: email || null,
    phone: phone || null,
    plan_name,
    subscription_end,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setMemberStatus(memberId: string, status: MemberStatus): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("micro_saas_gyms_members")
    .update({ status })
    .eq("id", memberId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function renewMembership(memberId: string, newEndDate: string): Promise<ActionResult> {
  const user = await requireUser();
  if (Number.isNaN(Date.parse(newEndDate))) {
    return { ok: false, error: "New end date is not valid." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("micro_saas_gyms_members")
    .update({ subscription_end: newEndDate, status: "active" })
    .eq("id", memberId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteMember(memberId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("micro_saas_gyms_members")
    .delete()
    .eq("id", memberId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function checkInMember(memberId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();

  // Confirm the member belongs to this user before logging a check-in —
  // the RLS insert policy would reject a mismatched user_id anyway, but
  // this gives a clearer error message than a raw policy violation.
  const { data: member, error: memberError } = await supabase
    .from("micro_saas_gyms_members")
    .select("id")
    .eq("id", memberId)
    .eq("user_id", user.id)
    .single();

  if (memberError || !member) {
    return { ok: false, error: "Member not found." };
  }

  const { error } = await supabase.from("micro_saas_gyms_checkins").insert({
    member_id: memberId,
    user_id: user.id,
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
