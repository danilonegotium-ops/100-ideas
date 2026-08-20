import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Collection, Testimonial } from "@/lib/types";
import { CreateCollectionForm } from "@/components/CreateCollectionForm";
import { CollectionList } from "@/components/CollectionList";
import { TestimonialModerationList } from "@/components/TestimonialModerationList";
import { SignOutButton } from "@/components/SignOutButton";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();

  // IMPORTANT: `testimonial_collector_collections` and
  // `_testimonials` both have a public-read RLS policy alongside the
  // owner-only one (see schema.sql), because the public collection page
  // and embed endpoint need to read them without auth. That means RLS
  // alone won't scope a bare `.select("*")` to just this user's data here
  // — we explicitly filter by `user_id` / owned `collection_id`s below so
  // this dashboard never shows another tenant's rows.
  const { data: collectionRows, error: collectionsError } = await supabase
    .from("testimonial_collector_collections")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const collections = (collectionRows ?? []) as Collection[];
  const collectionIds = collections.map((collection) => collection.id);

  let testimonials: Testimonial[] = [];
  if (collectionIds.length > 0) {
    const { data: testimonialRows } = await supabase
      .from("testimonial_collector_testimonials")
      .select("*")
      .in("collection_id", collectionIds)
      .order("submitted_at", { ascending: false });
    testimonials = (testimonialRows ?? []) as Testimonial[];
  }

  const collectionNameById = new Map(collections.map((collection) => [collection.id, collection.business_name]));
  const pendingCount = testimonials.filter((testimonial) => testimonial.status === "pending").length;
  const approvedCount = testimonials.filter((testimonial) => testimonial.status === "approved").length;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Testimonial dashboard</h1>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {collectionsError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">Couldn&apos;t load collections: {collectionsError.message}</p>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Collections" value={collections.length} />
          <StatTile
            label="Pending review"
            value={pendingCount}
            trend={pendingCount > 0 ? "needs a look" : undefined}
            trendTone={pendingCount > 0 ? "negative" : "neutral"}
          />
          <StatTile label="Approved" value={approvedCount} trendTone="positive" />
        </div>

        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Create a collection</h2>
          <CreateCollectionForm />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">Your collections</h2>
        {collections.length === 0 ? (
          <div className="mb-8">
            <EmptyState
              title="No collections yet"
              description="Create one above to get a shareable link customers can submit testimonials to."
            />
          </div>
        ) : (
          <div className="mb-8">
            <CollectionList collections={collections} />
          </div>
        )}

        <h2 className="mb-3 text-lg font-semibold">Testimonials</h2>
        {testimonials.length === 0 ? (
          <EmptyState
            title="No submissions yet"
            description="Share a collection link to start collecting testimonials."
          />
        ) : (
          <TestimonialModerationList testimonials={testimonials} collectionNameById={Object.fromEntries(collectionNameById)} />
        )}
      </main>
    </>
  );
}
