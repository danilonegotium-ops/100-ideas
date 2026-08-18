"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SPORTS } from "@/lib/sports/constants";
import type { Interest, Listing, Profile } from "@/lib/sports/types";

/**
 * Public — no login required to browse. Logged-in users with a profile
 * can express interest directly from here; everyone else sees a prompt to
 * log in / create a profile instead of a broken button.
 */
export default function BrowsePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyListingId, setBusyListingId] = useState<string | null>(null);

  const [sportFilter, setSportFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [listingsResult, profilesResult, interestsResult] =
      await Promise.all([
        supabase
          .from("local_sports_buddy_listings")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false }),
        supabase.from("local_sports_buddy_profiles").select("*"),
        supabase.from("local_sports_buddy_interests").select("*"),
      ]);

    if (listingsResult.error) setError(listingsResult.error.message);
    if (profilesResult.error) setError(profilesResult.error.message);
    if (interestsResult.error) setError(interestsResult.error.message);

    setListings(listingsResult.data ?? []);
    setProfiles(profilesResult.data ?? []);
    setInterests(interestsResult.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const profileById = useMemo(() => {
    const map = new Map<string, Profile>();
    profiles.forEach((p) => map.set(p.id, p));
    return map;
  }, [profiles]);

  const ownProfile = useMemo(
    () => profiles.find((p) => p.owner_id === userId) ?? null,
    [profiles, userId],
  );

  const interestsByListing = useMemo(() => {
    const map = new Map<string, Interest[]>();
    interests.forEach((i) => {
      const list = map.get(i.listing_id) ?? [];
      list.push(i);
      map.set(i.listing_id, list);
    });
    return map;
  }, [interests]);

  const cities = useMemo(
    () => Array.from(new Set(listings.map((l) => l.city))).sort(),
    [listings],
  );

  const filteredListings = listings.filter(
    (l) =>
      (!sportFilter || l.sport === sportFilter) &&
      (!cityFilter || l.city === cityFilter),
  );

  async function toggleInterest(listing: Listing) {
    if (!userId || !ownProfile) return;
    setBusyListingId(listing.id);
    setError("");
    const supabase = createClient();

    const existing = interestsByListing
      .get(listing.id)
      ?.find((i) => i.profile_id === ownProfile.id);

    if (existing) {
      const { error: deleteError } = await supabase
        .from("local_sports_buddy_interests")
        .delete()
        .eq("id", existing.id);
      if (deleteError) setError(deleteError.message);
    } else {
      const { error: insertError } = await supabase
        .from("local_sports_buddy_interests")
        .insert({
          listing_id: listing.id,
          owner_id: userId,
          profile_id: ownProfile.id,
        });
      if (insertError) setError(insertError.message);
    }

    await load();
    setBusyListingId(null);
  }

  async function removeListing(listing: Listing) {
    if (!confirm("Remove this listing?")) return;
    setError("");
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("local_sports_buddy_listings")
      .delete()
      .eq("id", listing.id);
    if (deleteError) setError(deleteError.message);
    else await load();
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">Open games near you</h1>
            <p className="text-muted">
              {userId ? (
                ownProfile ? (
                  <>Logged in as {ownProfile.name}.</>
                ) : (
                  <>
                    Logged in, but no profile yet —{" "}
                    <Link href="/profile" className="text-accent">
                      create one
                    </Link>{" "}
                    to post games or say you&apos;re in.
                  </>
                )
              ) : (
                <>
                  <Link href="/login" className="text-accent">
                    Log in
                  </Link>{" "}
                  to post a game or express interest.
                </>
              )}
            </p>
          </div>
          {ownProfile && (
            <Link href="/post">
              <Button>Post a game</Button>
            </Link>
          )}
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <select
            value={sportFilter}
            onChange={(event) => setSportFilter(event.target.value)}
          >
            <option value="">All sports</option>
            {SPORTS.map((sport) => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
          <select
            value={cityFilter}
            onChange={(event) => setCityFilter(event.target.value)}
          >
            <option value="">All cities</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="mb-4 text-sm text-danger">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : filteredListings.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No open games match those filters yet.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredListings.map((listing) => {
              const poster = profileById.get(listing.profile_id);
              const interested = interestsByListing.get(listing.id) ?? [];
              const isInterested = interested.some(
                (i) => i.profile_id === ownProfile?.id,
              );
              const isOwnListing = listing.owner_id === userId;

              return (
                <Card key={listing.id}>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-fg">
                        {listing.sport}{" "}
                        <span className="text-xs text-muted">
                          {listing.day_time} &middot; {listing.city}
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {listing.location_description}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        posted by {poster?.name ?? "someone"}
                        {interested.length > 0 &&
                          ` · ${interested.length} in: ${interested
                            .map((i) => profileById.get(i.profile_id)?.name)
                            .filter(Boolean)
                            .join(", ")}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {isOwnListing && (
                        <Button
                          variant="secondary"
                          onClick={() => removeListing(listing)}
                        >
                          Remove
                        </Button>
                      )}
                      {ownProfile && !isOwnListing && (
                        <Button
                          variant={isInterested ? "secondary" : "primary"}
                          disabled={busyListingId === listing.id}
                          onClick={() => toggleInterest(listing)}
                        >
                          {busyListingId === listing.id
                            ? "…"
                            : isInterested
                              ? "You're in"
                              : "I'm in"}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
