"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

/**
 * Public submission action — deliberately does NOT check for a logged-in
 * user. Anyone with a collection's link can call this. Row Level Security
 * (`testimonials_insert_public`) is what actually enforces "new rows must
 * start as status = 'pending'", not this function — this is just where we
 * give a friendlier error message than a raw Postgres constraint violation.
 */
export async function submitTestimonial(slug: string, formData: FormData): Promise<ActionResult> {
  const author_name = String(formData.get("author_name") || "").trim();
  const author_email = String(formData.get("author_email") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const ratingRaw = String(formData.get("rating") || "").trim();
  const video_url = String(formData.get("video_url") || "").trim();

  if (!author_name) {
    return { ok: false, error: "Your name is required." };
  }
  if (!content && !video_url) {
    return { ok: false, error: "Add a written testimonial or a video before submitting." };
  }

  let rating: number | null = null;
  if (ratingRaw) {
    const parsed = Number(ratingRaw);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
      return { ok: false, error: "Rating must be a whole number between 1 and 5." };
    }
    rating = parsed;
  }

  const supabase = createClient();

  const { data: collection, error: collectionError } = await supabase
    .from("testimonial_collector_collections")
    .select("id")
    .eq("slug", slug)
    .single();

  if (collectionError || !collection) {
    return { ok: false, error: "This collection link doesn't exist or was removed." };
  }

  const { error } = await supabase.from("testimonial_collector_testimonials").insert({
    collection_id: collection.id,
    author_name,
    author_email: author_email || null,
    content: content || null,
    video_url: video_url || null,
    rating,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
