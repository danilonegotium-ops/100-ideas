"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SPORTS } from "@/lib/sports/constants";

export function PostListingClient({
  profileId,
  defaultCity,
}: {
  profileId: string;
  defaultCity: string;
}) {
  const router = useRouter();
  const [sport, setSport] = useState<string>(SPORTS[0]);
  const [city, setCity] = useState(defaultCity);
  const [dayTime, setDayTime] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!city.trim() || !dayTime.trim() || !locationDescription.trim()) return;
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

    const { error: insertError } = await supabase
      .from("local_sports_buddy_listings")
      .insert({
        owner_id: user.id,
        profile_id: profileId,
        sport,
        city: city.trim(),
        day_time: dayTime.trim(),
        location_description: locationDescription.trim(),
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push("/browse");
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="text-sm text-danger">{error}</p>}
        <div>
          <label htmlFor="sport">Sport</label>
          <select
            id="sport"
            value={sport}
            onChange={(event) => setSport(event.target.value)}
          >
            {SPORTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
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
          <label htmlFor="dayTime">Day / time</label>
          <input
            id="dayTime"
            value={dayTime}
            onChange={(event) => setDayTime(event.target.value)}
            placeholder="Saturday 10:00"
            required
          />
        </div>
        <div>
          <label htmlFor="locationDescription">Where exactly</label>
          <input
            id="locationDescription"
            value={locationDescription}
            onChange={(event) => setLocationDescription(event.target.value)}
            placeholder="Karadjordjev park outdoor court"
            required
          />
        </div>
        <Button type="submit" disabled={saving} className="self-start">
          {saving ? "Posting…" : "Post game"}
        </Button>
      </form>
    </Card>
  );
}
