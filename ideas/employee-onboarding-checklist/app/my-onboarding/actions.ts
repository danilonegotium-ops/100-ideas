"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/");
}

/**
 * Toggles a single onboarding task's completion for the currently logged
 * in hire. No ownership check needed beyond "is logged in" — Row Level
 * Security (`onboarding_tasks_update_hire` in schema.sql) is what
 * actually restricts this to rows whose `hire_email` matches the caller's
 * own JWT email; a mismatched task id just updates 0 rows rather than
 * silently touching someone else's checklist.
 */
export async function toggleOnboardingTask(taskId: string, completed: boolean): Promise<ActionResult> {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { error } = await supabase
    .from("employee_onboarding_checklist_onboarding_tasks")
    .update({ completed, completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/my-onboarding");
  return { ok: true };
}
