"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { FILES_BUCKET } from "@/lib/data";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createProject(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) redirect("/dashboard?error=Naziv projekta je obavezan.");

  const { data, error } = await supabase
    .from("simple_client_portal_projects")
    .insert({ freelancer_id: user.id, name, description: description || null })
    .select("id")
    .single();

  if (error || !data) redirect("/dashboard?error=Greška pri kreiranju projekta.");

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}

export async function inviteClient(projectId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const clientEmail = String(formData.get("client_email") ?? "").trim().toLowerCase();
  if (!clientEmail) redirect(`/dashboard/${projectId}?error=Email klijenta je obavezan.`);

  const { error } = await supabase
    .from("simple_client_portal_project_clients")
    .insert({ project_id: projectId, client_email: clientEmail });

  if (error) {
    redirect(
      `/dashboard/${projectId}?error=Greška pri pozivanju klijenta (možda je već pozvan, ili niste vlasnik projekta).`,
    );
  }

  revalidatePath(`/dashboard/${projectId}`);
}

export async function postUpdate(projectId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/dashboard/${projectId}?error=Tekst objave je obavezan.`);

  const { error } = await supabase.from("simple_client_portal_project_updates").insert({
    project_id: projectId,
    author_id: user.id,
    body,
  });

  if (error) redirect(`/dashboard/${projectId}?error=Greška pri objavljivanju.`);

  revalidatePath(`/dashboard/${projectId}`);
}

/**
 * Uploads a real file to Supabase Storage (private bucket, see
 * storage.sql) and records its metadata. The `<project_id>/...` path
 * prefix is what the Storage RLS policies check against, so it's built
 * here, not left to the caller.
 */
export async function uploadFile(projectId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`/dashboard/${projectId}?error=Izaberite fajl za otpremanje.`);
  }

  const storagePath = `${projectId}/${randomUUID()}-${file.name}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(FILES_BUCKET)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    redirect(`/dashboard/${projectId}?error=Greška pri otpremanju fajla: ${uploadError.message}`);
  }

  const { error: insertError } = await supabase.from("simple_client_portal_project_files").insert({
    project_id: projectId,
    uploaded_by: user.id,
    storage_path: storagePath,
    file_name: file.name,
    size_bytes: file.size,
    content_type: file.type || null,
  });

  if (insertError) {
    redirect(`/dashboard/${projectId}?error=Fajl je otpremljen ali beleženje nije uspelo.`);
  }

  revalidatePath(`/dashboard/${projectId}`);
}
