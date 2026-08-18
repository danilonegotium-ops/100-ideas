"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getUser } from "@/lib/supabase/server";
import { slugify, type ActionResult, type TestimonialStatus } from "@/lib/types";

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

export async function createCollection(formData: FormData): Promise<ActionResult> {
  const user = await requireUser();

  const business_name = String(formData.get("business_name") || "").trim();
  const prompt_text = String(formData.get("prompt_text") || "").trim();
  const requestedSlug = String(formData.get("slug") || "").trim();

  if (!business_name) {
    return { ok: false, error: "Business name is required." };
  }

  const slug = slugify(requestedSlug || business_name);
  if (!slug) {
    return { ok: false, error: "Couldn't derive a valid link from that name — try adding a slug manually." };
  }

  const supabase = createClient();
  const { error } = await supabase.from("testimonial_collector_collections").insert({
    user_id: user.id,
    slug,
    business_name,
    prompt_text: prompt_text || undefined,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: `The link "/c/${slug}" is already taken — try a different name or slug.` };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteCollection(collectionId: string): Promise<ActionResult> {
  const user = await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("testimonial_collector_collections")
    .delete()
    .eq("id", collectionId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function moderateTestimonial(
  testimonialId: string,
  status: TestimonialStatus,
): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();
  // RLS's "testimonials_update_own" policy already scopes this to
  // testimonials whose collection belongs to the current user — no need
  // to repeat that filter client-side, a mismatched id just updates 0 rows.
  const { error } = await supabase
    .from("testimonial_collector_testimonials")
    .update({ status })
    .eq("id", testimonialId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTestimonial(testimonialId: string): Promise<ActionResult> {
  await requireUser();
  const supabase = createClient();
  const { error } = await supabase
    .from("testimonial_collector_testimonials")
    .delete()
    .eq("id", testimonialId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}
