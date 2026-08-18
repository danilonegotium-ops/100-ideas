import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeCompatibility, profileRowToScoring } from "@/lib/compatibility";
import { InterestButton } from "./InterestButton";

type ProfileRow = {
  user_id: string;
  display_name: string;
  city: string;
  area: string | null;
  university: string | null;
  budget_min: number;
  budget_max: number;
  sleep_schedule: "early_bird" | "night_owl" | "flexible";
  cleanliness: "very_clean" | "average" | "messy";
  social_style: "quiet" | "social" | "mixed";
  smoker: boolean;
  pets_ok: boolean;
  bio: string | null;
};

const TAG_LABELS: Record<string, string> = {
  early_bird: "Early bird",
  night_owl: "Night owl",
  flexible: "Flexible schedule",
  very_clean: "Very clean",
  average: "Average tidiness",
  messy: "Messy",
  quiet: "Quiet",
  social: "Social",
  mixed: "Mixed social style",
};

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: { city?: string; budgetMin?: string; budgetMax?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: myProfile } = await supabase
    .from("roommate_matcher_profiles")
    .select(
      "user_id, display_name, city, area, university, budget_min, budget_max, sleep_schedule, cleanliness, social_style, smoker, pets_ok, bio",
    )
    .eq("user_id", user.id)
    .maybeSingle<ProfileRow>();

  if (!myProfile) redirect("/profile");

  const city = searchParams.city || myProfile.city;

  let query = supabase
    .from("roommate_matcher_profiles")
    .select(
      "user_id, display_name, city, area, university, budget_min, budget_max, sleep_schedule, cleanliness, social_style, smoker, pets_ok, bio",
    )
    .neq("user_id", user.id)
    .eq("city", city);

  if (searchParams.budgetMin) {
    query = query.gte("budget_max", Number(searchParams.budgetMin));
  }
  if (searchParams.budgetMax) {
    query = query.lte("budget_min", Number(searchParams.budgetMax));
  }

  const { data: candidates } = await query.returns<ProfileRow[]>();

  const { data: outgoing } = await supabase
    .from("roommate_matcher_interests")
    .select("to_user_id")
    .eq("from_user_id", user.id);
  const outgoingSet = new Set((outgoing ?? []).map((r) => r.to_user_id));

  const { data: incoming } = await supabase
    .from("roommate_matcher_interests")
    .select("from_user_id")
    .eq("to_user_id", user.id);
  const incomingSet = new Set((incoming ?? []).map((r) => r.from_user_id));

  const myScoring = profileRowToScoring(myProfile);
  const scored = (candidates ?? [])
    .map((candidate) => ({
      candidate,
      score: computeCompatibility(myScoring, profileRowToScoring(candidate)),
      interested: outgoingSet.has(candidate.user_id),
      mutual: outgoingSet.has(candidate.user_id) && incomingSet.has(candidate.user_id),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Browse roommates</h1>
        <p className="mb-6 text-muted">
          Sorted by compatibility with your own profile — budget overlap,
          sleep schedule, cleanliness, social style, smoking, and pets.
        </p>

        <form method="get" className="mb-6 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <label htmlFor="city">City</label>
            <select id="city" name="city" defaultValue={city}>
              <option value="Belgrade">Belgrade</option>
              <option value="Novi Sad">Novi Sad</option>
            </select>
          </div>
          <div className="w-32">
            <label htmlFor="budgetMin">Min budget</label>
            <input
              id="budgetMin"
              name="budgetMin"
              type="number"
              min={1}
              defaultValue={searchParams.budgetMin}
            />
          </div>
          <div className="w-32">
            <label htmlFor="budgetMax">Max budget</label>
            <input
              id="budgetMax"
              name="budgetMax"
              type="number"
              min={1}
              defaultValue={searchParams.budgetMax}
            />
          </div>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>

        {scored.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No other profiles in {city} match yet — check back soon, or
              try a different city/budget above.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {scored.map(({ candidate, score, interested, mutual }) => (
              <li key={candidate.user_id}>
                <Card>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {candidate.display_name}{" "}
                        <span className="font-normal text-muted">
                          · {candidate.area || candidate.city}
                        </span>
                      </p>
                      <p className="text-sm text-muted">
                        {candidate.university && `${candidate.university} · `}
                        {candidate.budget_min}–{candidate.budget_max} EUR/mo
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {TAG_LABELS[candidate.sleep_schedule]} ·{" "}
                        {TAG_LABELS[candidate.cleanliness]} ·{" "}
                        {TAG_LABELS[candidate.social_style]}
                        {candidate.smoker ? " · Smoker" : " · Non-smoker"}
                        {candidate.pets_ok ? " · OK with pets" : ""}
                      </p>
                      {candidate.bio && (
                        <p className="mt-2 text-sm">{candidate.bio}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-2 text-lg font-semibold text-accent">
                        {score}%
                      </p>
                      <InterestButton
                        toUserId={candidate.user_id}
                        initialInterested={interested}
                        mutual={mutual}
                      />
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
