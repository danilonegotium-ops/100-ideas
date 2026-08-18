import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient } from "@/lib/supabase/server";
import { formatDate, type Collection, type Testimonial } from "@/lib/types";
import { SubmitTestimonialForm } from "@/components/SubmitTestimonialForm";

export default async function PublicCollectionPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: collection } = await supabase
    .from("testimonial_collector_collections")
    .select("*")
    .eq("slug", params.slug)
    .single<Collection>();

  if (!collection) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <Card>
            <h1 className="mb-2 text-xl font-semibold">Collection not found</h1>
            <p className="text-sm text-muted">
              This link doesn&apos;t point to a testimonial collection that exists.{" "}
              <Link href="/" className="text-accent">
                Go home
              </Link>
              .
            </p>
          </Card>
        </main>
      </>
    );
  }

  const { data: approvedRows } = await supabase
    .from("testimonial_collector_testimonials")
    .select("*")
    .eq("collection_id", collection.id)
    .eq("status", "approved")
    .order("submitted_at", { ascending: false })
    .limit(12);
  const approved = (approvedRows ?? []) as Testimonial[];

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">{collection.business_name}</h1>
        <p className="mb-6 text-muted">{collection.prompt_text}</p>

        <Card className="mb-8">
          <SubmitTestimonialForm slug={collection.slug} collectionId={collection.id} />
        </Card>

        {approved.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-semibold">What people are saying</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {approved.map((testimonial) => (
                <Card key={testimonial.id}>
                  {testimonial.rating && (
                    <p className="mb-1 text-sm text-accent-strong">{"★".repeat(testimonial.rating)}</p>
                  )}
                  {testimonial.content && <p className="mb-2 text-sm text-fg">{testimonial.content}</p>}
                  {testimonial.video_url && (
                    // eslint-disable-next-line jsx-a11y/media-has-caption
                    <video controls className="mb-2 w-full rounded-brand" src={testimonial.video_url} />
                  )}
                  <p className="text-xs text-muted">
                    {testimonial.author_name} &middot; {formatDate(testimonial.submitted_at)}
                  </p>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
