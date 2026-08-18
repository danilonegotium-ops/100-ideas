"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

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

export async function createTemplate(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const tasksText = String(formData.get("tasks") || "");
  const taskTitles = tasksText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!name) {
    return { ok: false, error: "Template name is required." };
  }
  if (taskTitles.length === 0) {
    return { ok: false, error: "Add at least one task (one per line)." };
  }

  const supabase = createClient();

  const { data: template, error: templateError } = await supabase
    .from("employee_onboarding_checklist_templates")
    .insert({ user_id: user.id, name })
    .select("id")
    .single();

  if (templateError || !template) {
    return { ok: false, error: templateError?.message ?? "Couldn't create template." };
  }

  const { error: tasksError } = await supabase.from("employee_onboarding_checklist_template_tasks").insert(
    taskTitles.map((title, index) => ({
      template_id: template.id,
      title,
      sort_order: index + 1,
    })),
  );

  if (tasksError) {
    // Best-effort cleanup so a failed task insert doesn't leave an empty
    // orphan template behind.
    await supabase.from("employee_onboarding_checklist_templates").delete().eq("id", template.id);
    return { ok: false, error: tasksError.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTemplate(templateId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("employee_onboarding_checklist_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function assignOnboarding(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const template_id = String(formData.get("template_id") || "").trim();
  const hire_name = String(formData.get("hire_name") || "").trim();
  const hire_email = String(formData.get("hire_email") || "").trim().toLowerCase();

  if (!template_id || !hire_name || !hire_email) {
    return { ok: false, error: "Template, hire name, and hire email are all required." };
  }

  const supabase = createClient();

  const { data: templateTasks, error: templateTasksError } = await supabase
    .from("employee_onboarding_checklist_template_tasks")
    .select("title, sort_order")
    .eq("template_id", template_id)
    .order("sort_order", { ascending: true });

  if (templateTasksError) {
    return { ok: false, error: templateTasksError.message };
  }
  if (!templateTasks || templateTasks.length === 0) {
    return { ok: false, error: "That template has no tasks to assign." };
  }

  const { data: onboarding, error: onboardingError } = await supabase
    .from("employee_onboarding_checklist_onboardings")
    .insert({ user_id: user.id, template_id, hire_name, hire_email })
    .select("id")
    .single();

  if (onboardingError || !onboarding) {
    return { ok: false, error: onboardingError?.message ?? "Couldn't create onboarding." };
  }

  // Snapshot the template's current tasks onto this onboarding — editing
  // the template later must never retroactively change this hire's
  // checklist. See the comment at the top of schema.sql.
  const { error: onboardingTasksError } = await supabase.from("employee_onboarding_checklist_onboarding_tasks").insert(
    templateTasks.map((task) => ({
      onboarding_id: onboarding.id,
      owner_id: user.id,
      hire_email,
      title: task.title,
      sort_order: task.sort_order,
    })),
  );

  if (onboardingTasksError) {
    await supabase.from("employee_onboarding_checklist_onboardings").delete().eq("id", onboarding.id);
    return { ok: false, error: onboardingTasksError.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteOnboarding(onboardingId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("employee_onboarding_checklist_onboardings")
    .delete()
    .eq("id", onboardingId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
