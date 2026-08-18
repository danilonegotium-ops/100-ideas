"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getUser } from "@/lib/supabase/server";
import { isSystemCategory } from "@/lib/categories";

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Adds a new home for the signed-in user, then jumps straight to it. */
export async function addHome(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const name = str(formData, "name");
  const address = str(formData, "address");

  if (!name) fail("/dashboard", "Home name is required.");
  if (name.length > 100) fail("/dashboard", "Home name is too long.");

  const supabase = createClient();
  const { data, error } = await supabase
    .from("home_maintenance_log_homes")
    .insert({ user_id: user.id, name, address: address || null })
    .select("id")
    .single();

  if (error || !data) {
    fail("/dashboard", "Could not save that home. Please try again.");
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}

/** Deletes a home (and, via ON DELETE CASCADE, its systems/service history). */
export async function deleteHome(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const homeId = str(formData, "homeId");
  if (!homeId) fail("/dashboard", "Missing home.");

  const supabase = createClient();
  // RLS already scopes this to homes owned by the current user, but scoping
  // the query by user_id too avoids relying on RLS alone to report a
  // meaningful failure vs. silently affecting zero rows.
  await supabase
    .from("home_maintenance_log_homes")
    .delete()
    .eq("id", homeId)
    .eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** Adds a system/appliance to a home. */
export async function addSystem(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const homeId = str(formData, "homeId");
  const name = str(formData, "name");
  const category = str(formData, "category");
  const installDate = str(formData, "install_date");
  const notes = str(formData, "notes");

  const homePath = `/dashboard/${homeId}`;

  if (!homeId) fail("/dashboard", "Missing home.");
  if (!name) fail(homePath, "System name is required.");
  if (name.length > 100) fail(homePath, "System name is too long.");
  if (!isSystemCategory(category)) fail(homePath, "Choose a valid category.");
  if (installDate && Number.isNaN(Date.parse(installDate))) {
    fail(homePath, "Install date is invalid.");
  }
  if (notes.length > 1000) fail(homePath, "Notes are too long.");

  const supabase = createClient();
  const { error } = await supabase.from("home_maintenance_log_systems").insert({
    home_id: homeId,
    name,
    category,
    install_date: installDate || null,
    notes: notes || null,
  });

  if (error) fail(homePath, "Could not save that system. Please try again.");

  revalidatePath(homePath);
  redirect(homePath);
}

/** Deletes a system (and its service history via ON DELETE CASCADE). */
export async function deleteSystem(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const homeId = str(formData, "homeId");
  const systemId = str(formData, "systemId");
  if (!homeId || !systemId) fail("/dashboard", "Missing system.");

  const supabase = createClient();
  await supabase
    .from("home_maintenance_log_systems")
    .delete()
    .eq("id", systemId)
    .eq("home_id", homeId);

  const homePath = `/dashboard/${homeId}`;
  revalidatePath(homePath);
  redirect(homePath);
}

/** Logs a service event for a system. */
export async function addServiceEvent(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const homeId = str(formData, "homeId");
  const systemId = str(formData, "systemId");
  const serviceDate = str(formData, "service_date");
  const description = str(formData, "description");
  const costRaw = str(formData, "cost");
  const nextServiceDue = str(formData, "next_service_due");

  const systemPath = `/dashboard/${homeId}/systems/${systemId}`;

  if (!homeId || !systemId) fail("/dashboard", "Missing system.");
  if (!serviceDate || Number.isNaN(Date.parse(serviceDate))) {
    fail(systemPath, "Service date is required and must be valid.");
  }
  if (!description) fail(systemPath, "Description is required.");
  if (description.length > 1000) fail(systemPath, "Description is too long.");

  let cost: number | null = null;
  if (costRaw) {
    cost = Number(costRaw);
    if (!Number.isFinite(cost) || cost < 0 || cost > 1_000_000) {
      fail(systemPath, "Cost must be a positive number.");
    }
  }

  if (nextServiceDue) {
    if (Number.isNaN(Date.parse(nextServiceDue))) {
      fail(systemPath, "Next service due date is invalid.");
    }
    if (nextServiceDue < serviceDate) {
      fail(systemPath, "Next service due date can't be before the service date.");
    }
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("home_maintenance_log_service_events")
    .insert({
      system_id: systemId,
      service_date: serviceDate,
      description,
      cost,
      next_service_due: nextServiceDue || null,
    });

  if (error) fail(systemPath, "Could not save that service record. Please try again.");

  revalidatePath(systemPath);
  revalidatePath(`/dashboard/${homeId}`);
  revalidatePath("/dashboard");
  redirect(systemPath);
}

/** Deletes a single service event. */
export async function deleteServiceEvent(formData: FormData) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const homeId = str(formData, "homeId");
  const systemId = str(formData, "systemId");
  const eventId = str(formData, "eventId");
  if (!homeId || !systemId || !eventId) fail("/dashboard", "Missing record.");

  const supabase = createClient();
  await supabase
    .from("home_maintenance_log_service_events")
    .delete()
    .eq("id", eventId)
    .eq("system_id", systemId);

  const systemPath = `/dashboard/${homeId}/systems/${systemId}`;
  revalidatePath(systemPath);
  revalidatePath(`/dashboard/${homeId}`);
  revalidatePath("/dashboard");
  redirect(systemPath);
}
