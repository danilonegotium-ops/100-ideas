import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Public embed endpoint — returns approved testimonials for a collection
 * as JSON, so a business can pull them into their own site (a simple
 * `fetch()` + render loop, or an iframe pointed at a small viewer built
 * on top of this later). No auth required; Access-Control-Allow-Origin is
 * wide open on purpose since this is meant to be called cross-origin from
 * arbitrary third-party sites embedding the widget.
 *
 * Route Handlers are never executed during `next build`, so this is safe
 * with no Supabase env vars configured.
 */
export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: collection, error: collectionError } = await supabase
    .from("testimonial_collector_collections")
    .select("id, business_name")
    .eq("slug", params.slug)
    .single();

  if (collectionError || !collection) {
    return NextResponse.json(
      { error: "Collection not found" },
      { status: 404, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  const { data: testimonials, error: testimonialsError } = await supabase
    .from("testimonial_collector_testimonials")
    .select("author_name, content, video_url, rating, submitted_at")
    .eq("collection_id", collection.id)
    .eq("status", "approved")
    .order("submitted_at", { ascending: false });

  if (testimonialsError) {
    return NextResponse.json(
      { error: testimonialsError.message },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } },
    );
  }

  return NextResponse.json(
    { business_name: collection.business_name, testimonials: testimonials ?? [] },
    { headers: { "Access-Control-Allow-Origin": "*" } },
  );
}
