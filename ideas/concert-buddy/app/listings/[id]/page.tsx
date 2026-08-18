import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/formatDate";
import { InterestForm } from "./InterestForm";
import { MarkFilledButton } from "./MarkFilledButton";

type Listing = {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  city: string;
  note: string | null;
  contact_hint: string | null;
  is_filled: boolean;
};

type Interest = {
  id: string;
  user_email: string;
  message: string | null;
  created_at: string;
};

export default async function ListingPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const user = await getUser();

  const { data: listing } = await supabase
    .from("concert_buddy_listings")
    .select(
      "id, user_id, event_name, event_date, city, note, contact_hint, is_filled",
    )
    .eq("id", params.id)
    .maybeSingle<Listing>();

  if (!listing) notFound();

  const isOwner = user?.id === listing.user_id;

  let interests: Interest[] = [];
  let alreadyInterested = false;

  if (isOwner) {
    const { data } = await supabase
      .from("concert_buddy_interests")
      .select("id, user_email, message, created_at")
      .eq("listing_id", listing.id)
      .order("created_at", { ascending: true })
      .returns<Interest[]>();
    interests = data ?? [];
  } else if (user) {
    const { data } = await supabase
      .from("concert_buddy_interests")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("user_id", user.id)
      .maybeSingle();
    alreadyInterested = !!data;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <Link href="/" className="mb-4 inline-block text-sm text-muted hover:text-fg">
          &larr; all listings
        </Link>
        <h1 className="mb-1 text-2xl font-semibold">{listing.event_name}</h1>
        <p className="mb-6 text-muted">
          {formatDateOnly(listing.event_date)} · {listing.city}
          {listing.is_filled && " · Filled"}
        </p>

        {listing.note && (
          <Card className="mb-4">
            <p className="text-sm">{listing.note}</p>
          </Card>
        )}

        {listing.contact_hint && (
          <p className="mb-6 text-sm text-muted">
            Contact: {listing.contact_hint}
          </p>
        )}

        {isOwner ? (
          <>
            <MarkFilledButton listingId={listing.id} isFilled={listing.is_filled} />
            <h2 className="mb-3 mt-8 text-lg font-semibold">
              {interests.length === 0
                ? "No interest yet"
                : `${interests.length} interested`}
            </h2>
            {interests.length > 0 && (
              <ul className="flex flex-col gap-3">
                {interests.map((interest) => (
                  <li key={interest.id}>
                    <Card>
                      <p className="font-medium">{interest.user_email}</p>
                      {interest.message && (
                        <p className="mt-1 text-sm text-muted">{interest.message}</p>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : !user ? (
          <Card>
            <p className="mb-3 text-sm text-muted">
              Log in to let them know you&apos;re interested.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
            >
              Log in
            </Link>
          </Card>
        ) : alreadyInterested ? (
          <Card>
            <p className="text-sm text-fg">
              You&apos;re marked as interested. The poster can see your
              email ({user.email}) and reach out.
            </p>
          </Card>
        ) : (
          <InterestForm listingId={listing.id} />
        )}
      </main>
    </>
  );
}
