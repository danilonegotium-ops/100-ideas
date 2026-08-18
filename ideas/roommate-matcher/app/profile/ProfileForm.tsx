"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

type SleepSchedule = "early_bird" | "night_owl" | "flexible";
type Cleanliness = "very_clean" | "average" | "messy";
type SocialStyle = "quiet" | "social" | "mixed";

type ExistingProfile = {
  display_name: string;
  city: string;
  area: string | null;
  university: string | null;
  budget_min: number;
  budget_max: number;
  sleep_schedule: SleepSchedule;
  cleanliness: Cleanliness;
  social_style: SocialStyle;
  smoker: boolean;
  pets_ok: boolean;
  bio: string | null;
} | null;

export function ProfileForm({ initialProfile }: { initialProfile: ExistingProfile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [city, setCity] = useState(initialProfile?.city ?? "Belgrade");
  const [area, setArea] = useState(initialProfile?.area ?? "");
  const [university, setUniversity] = useState(initialProfile?.university ?? "");
  const [budgetMin, setBudgetMin] = useState(String(initialProfile?.budget_min ?? "200"));
  const [budgetMax, setBudgetMax] = useState(String(initialProfile?.budget_max ?? "350"));
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule>(
    initialProfile?.sleep_schedule ?? "flexible",
  );
  const [cleanliness, setCleanliness] = useState<Cleanliness>(
    initialProfile?.cleanliness ?? "average",
  );
  const [socialStyle, setSocialStyle] = useState<SocialStyle>(
    initialProfile?.social_style ?? "mixed",
  );
  const [smoker, setSmoker] = useState(initialProfile?.smoker ?? false);
  const [petsOk, setPetsOk] = useState(initialProfile?.pets_ok ?? false);
  const [bio, setBio] = useState(initialProfile?.bio ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        city,
        area,
        university,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        sleepSchedule,
        cleanliness,
        socialStyle,
        smoker,
        petsOk,
        bio,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setErrorMessage(data.error || "Something went wrong. Try again.");
      return;
    }

    router.push("/browse");
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="displayName">Display name</label>
          <input
            id="displayName"
            required
            maxLength={100}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="city">City</label>
            <select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="Belgrade">Belgrade</option>
              <option value="Novi Sad">Novi Sad</option>
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="area">Area / neighborhood</label>
            <input
              id="area"
              maxLength={200}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. Vracar"
            />
          </div>
        </div>

        <div>
          <label htmlFor="university">University (optional)</label>
          <input
            id="university"
            maxLength={200}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="budgetMin">Budget min (EUR/mo)</label>
            <input
              id="budgetMin"
              type="number"
              required
              min={1}
              value={budgetMin}
              onChange={(e) => setBudgetMin(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label htmlFor="budgetMax">Budget max (EUR/mo)</label>
            <input
              id="budgetMax"
              type="number"
              required
              min={1}
              value={budgetMax}
              onChange={(e) => setBudgetMax(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label htmlFor="sleepSchedule">Sleep schedule</label>
          <select
            id="sleepSchedule"
            value={sleepSchedule}
            onChange={(e) => setSleepSchedule(e.target.value as SleepSchedule)}
          >
            <option value="early_bird">Early bird</option>
            <option value="night_owl">Night owl</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        <div>
          <label htmlFor="cleanliness">Cleanliness</label>
          <select
            id="cleanliness"
            value={cleanliness}
            onChange={(e) => setCleanliness(e.target.value as Cleanliness)}
          >
            <option value="very_clean">Very clean</option>
            <option value="average">Average</option>
            <option value="messy">Messy</option>
          </select>
        </div>

        <div>
          <label htmlFor="socialStyle">Social style</label>
          <select
            id="socialStyle"
            value={socialStyle}
            onChange={(e) => setSocialStyle(e.target.value as SocialStyle)}
          >
            <option value="quiet">Quiet</option>
            <option value="mixed">Mixed</option>
            <option value="social">Social</option>
          </select>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              className="w-auto"
              checked={smoker}
              onChange={(e) => setSmoker(e.target.checked)}
            />
            Smoker
          </label>
          <label className="flex items-center gap-2 text-sm text-fg">
            <input
              type="checkbox"
              className="w-auto"
              checked={petsOk}
              onChange={(e) => setPetsOk(e.target.checked)}
            />
            OK with pets
          </label>
        </div>

        <div>
          <label htmlFor="bio">Bio (optional)</label>
          <textarea
            id="bio"
            rows={3}
            maxLength={1000}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="A bit about you, what you're looking for, etc."
          />
        </div>

        {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Saving…" : "Save profile"}
        </Button>
      </form>
    </Card>
  );
}
