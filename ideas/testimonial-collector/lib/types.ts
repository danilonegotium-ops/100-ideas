export type TestimonialStatus = "pending" | "approved" | "rejected";

export type Collection = {
  id: string;
  slug: string;
  business_name: string;
  prompt_text: string;
  created_at: string;
};

export type Testimonial = {
  id: string;
  collection_id: string;
  author_name: string;
  author_email: string | null;
  content: string | null;
  video_url: string | null;
  rating: number | null;
  status: TestimonialStatus;
  submitted_at: string;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export const VIDEO_BUCKET = "testimonial-collector-videos";

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

/** Basic slug sanitizer for the "create collection" form — lowercase,
 * alphanumeric + hyphens only, no leading/trailing/double hyphens. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
