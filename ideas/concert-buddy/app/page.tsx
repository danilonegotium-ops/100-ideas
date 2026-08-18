import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/server";
import { formatDateOnly } from "@/lib/formatDate";

type ListingRow = {
  id: string;
  event_name: string;
  event_date: string;
  city: string;
  note: string | null;
  is_filled: boolean;
};

/**
 * Public browse page — no login required to look. Reads filters from the
 * URL's query string via a plain GET `<form>`, so it works with
 * JavaScript disabled and doesn't need a Client Component.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: { city?: string; from?: string; to?: string };
}) {
  const supabase = createClient();
  let query = supabase
    .from("concert_buddy_listings")
    .select("id, event_name, event_date, city, note, is_filled")
    .order("event_date", { ascending: true });

  if (searchParams.city) {
    query = query.ilike("city", `%${searchParams.city}%`);
  }
  if (searchParams.from) {
    query = query.gte("event_date", searchParams.from);
  }
  if (searchParams.to) {
    query = query.lte("event_date", searchParams.to);
  }

  const { data: listings } = await query.returns<ListingRow[]>();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Concert Buddy</h1>
            <p className="text-muted">
              Going to a show with no one to go with? Post it, or find
              someone else who&apos;s already going.
            </p>
          </div>
          <Link
            href="/new"
            className="shrink-0 rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
          >
            Post a listing
          </Link>
        </div>

        <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={searchParams.city}
              placeholder="Belgrade..."
            />
          </div>
          <div className="w-40">
            <label htmlFor="from">From</label>
            <input id="from" name="from" type="date" defaultValue={searchParams.from} />
          </div>
          <div className="w-40">
            <label htmlFor="to">To</label>
            <input id="to" name="to" type="date" defaultValue={searchParams.to} />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
          {(searchParams.city || searchParams.from || searchParams.to) && (
            <Link href="/" className="text-sm text-muted hover:text-fg">
              Clear
            </Link>
          )}
        </form>

        {!listings || listings.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No listings match yet. Try clearing the filters, or be the
              first to post one.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <Link href={`/listings/${listing.id}`}>
                  <Card className="transition-colors hover:border-accent">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium">{listing.event_name}</p>
                        <p className="text-sm text-muted">
                          {formatDateOnly(listing.event_date)} · {listing.city}
                        </p>
                        {listing.note && (
                          <p className="mt-1 text-sm text-muted">{listing.note}</p>
                        )}
                      </div>
                      {listing.is_filled && (
                        <span className="shrink-0 text-sm text-muted">Filled</span>
                      )}
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
