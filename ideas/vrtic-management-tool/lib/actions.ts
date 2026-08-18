"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PLACEHOLDER_KEYS, type AttendanceStatus, type PlaceholderKey } from "@/lib/types";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createGroup(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/dashboard?error=Naziv grupe je obavezan.");

  const { data, error } = await supabase
    .from("vrtic_management_tool_groups")
    .insert({ teacher_id: user.id, name })
    .select("id")
    .single();

  if (error || !data) redirect("/dashboard?error=Greška pri kreiranju grupe.");

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}

export async function addChild(groupId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const fullName = String(formData.get("full_name") ?? "").trim();
  const birthDate = String(formData.get("birth_date") ?? "").trim();
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentEmail = String(formData.get("parent_email") ?? "").trim();

  if (!fullName) redirect(`/dashboard/${groupId}?error=Ime deteta je obavezno.`);

  const { data: child, error } = await supabase
    .from("vrtic_management_tool_children")
    .insert({ group_id: groupId, full_name: fullName, birth_date: birthDate || null })
    .select("id")
    .single();

  if (error || !child) {
    redirect(`/dashboard/${groupId}?error=Greška pri dodavanju deteta (proverite da li ste vaspitač ove grupe).`);
  }

  if (parentName || parentEmail) {
    await supabase.from("vrtic_management_tool_child_contacts").insert({
      child_id: child.id,
      parent_name: parentName || null,
      parent_email: parentEmail || null,
    });
  }

  revalidatePath(`/dashboard/${groupId}`);
}

const VALID_STATUSES: AttendanceStatus[] = ["present", "absent", "sick", "excused"];

export async function markAttendance(
  groupId: string,
  childId: string,
  formData: FormData,
) {
  const { supabase } = await requireUser();

  const status = String(formData.get("status") ?? "");
  const date = String(formData.get("attendance_date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim();

  if (!VALID_STATUSES.includes(status as AttendanceStatus)) {
    redirect(`/dashboard/${groupId}?error=Nepoznat status prisustva.`);
  }

  const { error } = await supabase.from("vrtic_management_tool_attendance_records").upsert(
    {
      child_id: childId,
      group_id: groupId,
      attendance_date: date,
      status,
      note: note || null,
    },
    { onConflict: "child_id,attendance_date" },
  );

  if (error) redirect(`/dashboard/${groupId}?error=Greška pri unosu prisustva.`);

  revalidatePath(`/dashboard/${groupId}`);
}

export async function upsertDailyMenu(groupId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const date = String(formData.get("menu_date") ?? "").trim() ||
    new Date().toISOString().slice(0, 10);
  const breakfast = String(formData.get("breakfast") ?? "").trim();
  const lunch = String(formData.get("lunch") ?? "").trim();
  const snack = String(formData.get("snack") ?? "").trim();

  const { error } = await supabase.from("vrtic_management_tool_daily_menus").upsert(
    {
      group_id: groupId,
      menu_date: date,
      breakfast: breakfast || null,
      lunch: lunch || null,
      snack: snack || null,
    },
    { onConflict: "group_id,menu_date" },
  );

  if (error) redirect(`/dashboard/${groupId}?error=Greška pri unosu jelovnika.`);

  revalidatePath(`/dashboard/${groupId}`);
}

export async function addPhotoPost(groupId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const caption = String(formData.get("caption") ?? "").trim();
  const placeholderKey = String(formData.get("placeholder_key") ?? "");

  if (!caption || !PLACEHOLDER_KEYS.includes(placeholderKey as PlaceholderKey)) {
    redirect(`/dashboard/${groupId}?error=Opis i ilustracija su obavezni.`);
  }

  const { error } = await supabase.from("vrtic_management_tool_photo_posts").insert({
    group_id: groupId,
    caption,
    placeholder_key: placeholderKey,
  });

  if (error) redirect(`/dashboard/${groupId}?error=Greška pri objavljivanju.`);

  revalidatePath(`/dashboard/${groupId}`);
}
