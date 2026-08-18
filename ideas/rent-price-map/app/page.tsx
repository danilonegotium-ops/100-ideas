import Link from "next/link";
import { Nav } from "@/components/Nav";
import { RentMapView } from "@/components/RentMapView";
import { createClient } from "@/lib/supabase/server";
import type { RentReport } from "@/lib/types";

// This route calls the Supabase server client (which reads cookies
// internally, even though this app has no auth), so it's already dynamic
// by Next's own rules — declared explicitly here for clarity: every
// visitor should see the latest reports, never a stale cached page.
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: { submitted?: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("rent_price_map_reports")
    .select("id, city, neighborhood, rent_eur, rooms, size_m2, note, lat, lng, created_at")
    .order("created_at", { ascending: false });
  const reports = (data ?? []) as RentReport[];

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Rent Price Map</h1>
            <p className="max-w-xl text-muted">
              Crowdsourced, completely anonymous rent reports — see what
              people are actually paying around Serbia, and add your own to
              help others find a fair deal.
            </p>
          </div>
          <Link
            href="/submit"
            className="inline-block shrink-0 rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
          >
            Report your rent
          </Link>
        </div>

        {searchParams.submitted === "1" && (
          <p className="mb-4 rounded-brand border border-border bg-surface px-3 py-2 text-sm text-fg">
            Thanks — your anonymous report was added to the map below.
          </p>
        )}

        {reports.length === 0 ? (
          <p className="text-sm text-muted">
            No reports yet.{" "}
            <Link href="/submit" className="text-accent-strong">
              Be the first to add one.
            </Link>
          </p>
        ) : (
          <RentMapView reports={reports} />
        )}
      </main>
    </>
  );
}
