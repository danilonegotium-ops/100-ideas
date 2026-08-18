"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveProgressResult =
  | { saved: true }
  | { saved: false; reason: "not_logged_in" | "db_error" };

/**
 * Called imperatively from the client Quiz component (not via a <form
 * action>, since the quiz itself is interactive client state) once a quiz
 * is graded. Small and isolated: one auth check, one upsert. Silently
 * no-ops (rather than redirecting) for a logged-out visitor — the quiz UI
 * already tells them their result won't be saved, so this just confirms
 * that rather than erroring.
 */
export async function saveProgress(
  lessonSlug: string,
  score: number,
  total: number,
): Promise<SaveProgressResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { saved: false, reason: "not_logged_in" };
  }

  const { error } = await supabase.from("serbian_for_expats_progress").upsert(
    {
      user_id: user.id,
      lesson_slug: lessonSlug,
      score,
      total,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_slug" },
  );

  if (error) {
    return { saved: false, reason: "db_error" };
  }

  revalidatePath("/progress");
  revalidatePath("/");
  return { saved: true };
}
