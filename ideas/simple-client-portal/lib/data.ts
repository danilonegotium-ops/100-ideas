import type { SupabaseClient } from "@supabase/supabase-js";
import type { Project, ProjectClient, ProjectFile, ProjectUpdate } from "./types";

export const FILES_BUCKET = "simple_client_portal_files";

/**
 * Small, isolated Supabase read functions — each takes an already-created
 * client so they're easy to unit test / review independently of Next.js
 * request plumbing (same pattern as the other Wave 3 ideas in this batch).
 */

/** Every project the logged-in user can see — RLS (`scp_is_project_member`) does the filtering. */
export async function getProjectsForUser(supabase: SupabaseClient): Promise<Project[]> {
  const { data, error } = await supabase
    .from("simple_client_portal_projects")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProjectById(
  supabase: SupabaseClient,
  projectId: string,
): Promise<Project | null> {
  const { data, error } = await supabase
    .from("simple_client_portal_projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getProjectClients(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectClient[]> {
  const { data, error } = await supabase
    .from("simple_client_portal_project_clients")
    .select("*")
    .eq("project_id", projectId)
    .order("invited_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProjectUpdates(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectUpdate[]> {
  const { data, error } = await supabase
    .from("simple_client_portal_project_updates")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getProjectFiles(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectFile[]> {
  const { data, error } = await supabase
    .from("simple_client_portal_project_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/**
 * Signed download URL for a private Storage object — subject to the same
 * `scp_is_project_member` SELECT policy on `storage.objects` (see
 * storage.sql), so this simply returns `null` instead of throwing if the
 * caller isn't authorized or the object doesn't exist yet (e.g. the seeded
 * placeholder file row, which has no real bytes behind it).
 */
export async function getSignedFileUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresInSeconds = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(FILES_BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
