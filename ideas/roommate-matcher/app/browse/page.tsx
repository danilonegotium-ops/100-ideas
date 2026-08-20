import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeCompatibility, profileRowToScoring } from "@/lib/compatibility";
import { SwipeDeck } from "./SwipeDeck";
import { TAG_LABELS, type DeckCandidate } from "./types";

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

  // Same underlying data, split into three presentation buckets: cards
  // already mutually matched, cards where you're waiting on a reply, and
  // the actual swipeable deck (everyone you haven't acted on yet). This is
  // purely a rendering split — every row here comes from the same `scored`
  // array computed above from unchanged Supabase queries.
  const mutualMatches = scored.filter((s) => s.mutual);
  const pending = scored.filter((s) => s.interested && !s.mutual);
  const deckCandidates: DeckCandidate[] = scored
    .filter((s) => !s.interested)
    .map((s) => ({
      ...s.candidate,
      score: s.score,
      alreadyInterestedInMe: incomingSet.has(s.candidate.user_id),
    }));

  return (
    <>
      <Nav />
      <main className="relative mx-auto w-full max-w-site-wide flex-1 px-5 py-8">
        <div className="relative mb-8 overflow-hidden rounded-xl2">
          <GradientMesh />
          <GlassPanel className="relative">
            <h1 className="text-headline text-fg">Browse roommates</h1>
            <p className="mt-2 text-muted">
              Swipe through profiles in {city}, sorted by compatibility —
              budget overlap, sleep schedule, cleanliness, social style,
              smoking, and pets. Swipe right (or tap &ldquo;I&apos;m
              interested&rdquo;) and if they&apos;ve already done the same,
              it&apos;s a match.
            </p>

            <form method="get" className="mt-5 flex flex-wrap items-end gap-3">
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
          </GlassPanel>
        </div>

        {mutualMatches.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-title text-fg">Your matches</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {mutualMatches.map(({ candidate, score }, index) => (
                <AnimatedCard key={candidate.user_id} index={index} hoverLift={false}>
                  <p className="font-medium text-fg">
                    {candidate.display_name}{" "}
                    <span className="font-normal text-muted">
                      · {candidate.area || candidate.city}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {TAG_LABELS[candidate.sleep_schedule]} ·{" "}
                    {TAG_LABELS[candidate.cleanliness]}
                  </p>
                  <p className="mt-2 text-sm font-medium text-accent">
                    Mutual match · {score}%
                  </p>
                </AnimatedCard>
              ))}
            </div>
          </section>
        )}

        {pending.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-title text-fg">Waiting on a response</h2>
            <ul className="flex flex-col gap-2">
              {pending.map(({ candidate, score }) => (
                <li
                  key={candidate.user_id}
                  className="flex items-center justify-between rounded-brand border border-border bg-surface px-4 py-3"
                >
                  <span className="text-sm text-fg">
                    {candidate.display_name}{" "}
                    <span className="text-muted">· {candidate.area || candidate.city}</span>
                  </span>
                  <span className="text-sm text-muted">{score}% · Interested ✓</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <h2 className="mb-4 text-title text-fg">Discover</h2>
          <SwipeDeck candidates={deckCandidates} />
        </section>
      </main>
    </>
  );
}
