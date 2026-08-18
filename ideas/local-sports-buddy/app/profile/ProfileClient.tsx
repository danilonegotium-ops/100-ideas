"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SPORTS } from "@/lib/sports/constants";
import type { Profile } from "@/lib/sports/types";

/**
 * Public read access on `local_sports_buddy_profiles` (see schema.sql)
 * means a plain `select("*")` returns everyone's profiles, not just this
 * user's — so unlike the owner-only ideas in this batch, this query must
 * explicitly filter by `owner_id` itself rather than relying on RLS to
 * narrow it.
 */
export function ProfileClient() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [selectedSports, setSelectedSports] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error: loadError } = await supabase
      .from("local_sports_buddy_profiles")
      .select("*")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (loadError) setError(loadError.message);
    if (data) {
      setProfile(data);
      setName(data.name);
      setCity(data.city);
      setSelectedSports(data.sports);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggleSport(sport: string) {
    setSelectedSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport],
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !city.trim() || selectedSports.length === 0) return;
    setSaving(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not logged in.");
      setSaving(false);
      return;
    }

    let opErrorMessage: string | null = null;
    if (profile) {
      const { error: updateError } = await supabase
        .from("local_sports_buddy_profiles")
        .update({
          name: name.trim(),
          city: city.trim(),
          sports: selectedSports,
        })
        .eq("id", profile.id);
      if (updateError) opErrorMessage = updateError.message;
    } else {
      const { error: insertError } = await supabase
        .from("local_sports_buddy_profiles")
        .insert({
          owner_id: user.id,
          name: name.trim(),
          city: city.trim(),
          sports: selectedSports,
        });
      if (insertError) opErrorMessage = insertError.message;
    }

    if (opErrorMessage) {
      setError(opErrorMessage);
      setSaving(false);
      return;
    }

    router.push("/browse");
  }

  if (loading) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-danger">{error}</p>}
        <div>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Marko"
            required
          />
        </div>
        <div>
          <label htmlFor="city">City / area</label>
          <input
            id="city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Belgrade - Vracar"
            required
          />
        </div>
        <div>
          <label>Sports you play</label>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {SPORTS.map((sport) => (
              <label
                key={sport}
                className="inline-flex items-center gap-1.5 text-sm text-fg"
              >
                <input
                  type="checkbox"
                  className="w-auto"
                  checked={selectedSports.includes(sport)}
                  onChange={() => toggleSport(sport)}
                />
                {sport}
              </label>
            ))}
          </div>
        </div>
        <Button
          type="submit"
          disabled={saving || selectedSports.length === 0}
          className="self-start"
        >
          {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
        </Button>
      </form>
    </Card>
  );
}
