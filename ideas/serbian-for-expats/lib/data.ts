import type { SupabaseClient } from "@supabase/supabase-js";
import type { LessonProgress } from "./types";

/** Small, isolated Supabase read function — takes an already-created client. */
export async function getProgressForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<LessonProgress[]> {
  const { data, error } = await supabase
    .from("serbian_for_expats_progress")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  return data ?? [];
}

/** Pure function — index progress rows by lesson slug for O(1) page lookups. */
export function progressBySlug(rows: LessonProgress[]): Map<string, LessonProgress> {
  return new Map(rows.map((row) => [row.lesson_slug, row]));
}
