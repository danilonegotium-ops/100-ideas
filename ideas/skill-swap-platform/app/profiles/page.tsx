import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { SpotlightCard } from "@/components/motion/SpotlightCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";

type Profile = {
  id: string;
  user_id: string | null;
  display_name: string;
  bio: string | null;
  skills_teach: string[];
  skills_learn: string[];
};

/**
 * Browse profiles, optionally filtered by a skill someone wants to learn
 * (`?skill=`). Filtering happens in JS after a single fetch rather than a
 * Postgres array-containment query, since we want a case-insensitive
 * substring match ("photoshop" should match "Photoshop") and this dataset
 * is small (demo/MVP scale).
 */
export default async function ProfilesPage({
  searchParams,
}: {
  searchParams: { skill?: string };
}) {
  const skill = (searchParams.skill ?? "").trim();
  const supabase = createClient();
  const user = await getUser();

  const { data: profiles, error } = await supabase
    .from("skill_swap_platform_profiles")
    .select("id, user_id, display_name, bio, skills_teach, skills_learn")
    .order("created_at", { ascending: false });

  const needle = skill.toLowerCase();
  const filtered = (profiles ?? []).filter((p: Profile) => {
    if (!needle) return true;
    return p.skills_teach.some((s) => s.toLowerCase().includes(needle));
  });

  const allSkills = Array.from(
    new Set((profiles ?? []).flatMap((p: Profile) => p.skills_teach)),
  ).sort();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Browse members</h1>
        <p className="mb-6 text-muted">
          Filter by a skill you want to learn.
        </p>

        <form className="mb-4 flex gap-2" action="/profiles">
          <input
            type="search"
            name="skill"
            defaultValue={skill}
            placeholder="e.g. Photoshop, Spanish, Guitar…"
          />
        </form>

        {allSkills.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {allSkills.map((s) => (
              <Link
                key={s}
                href={`/profiles?skill=${encodeURIComponent(s)}`}
                className="rounded-brand border border-border px-3 py-1 text-xs text-muted no-underline hover:border-accent hover:text-fg"
              >
                {s}
              </Link>
            ))}
          </div>
        )}

        {error && (
          <Card className="mb-4">
            <p className="text-sm text-danger">
              Couldn&apos;t load profiles right now (
              {error.message || "Supabase isn't configured yet"}
              ). This page needs a live Supabase project — see SPEC.md.
            </p>
          </Card>
        )}

        {!error && filtered.length === 0 && (
          <EmptyState
            title={
              skill
                ? `Nobody currently lists "${skill}" as a skill they teach.`
                : "No profiles yet"
            }
            description={!skill ? "Be the first to create one." : undefined}
          />
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((profile: Profile) => (
            <Link
              key={profile.id}
              href={`/profiles/${profile.id}`}
              className="no-underline"
            >
              <SpotlightCard className="h-full transition-colors hover:border-accent">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-fg">
                    {profile.display_name}
                    {user && profile.user_id === user.id ? " (you)" : ""}
                  </h2>
                </div>
                {profile.bio && (
                  <p className="mb-2 text-sm text-muted">{profile.bio}</p>
                )}
                <p className="text-xs text-muted">
                  <span className="text-fg">Teaches:</span>{" "}
                  {profile.skills_teach.join(", ") || "—"}
                </p>
                <p className="text-xs text-muted">
                  <span className="text-fg">Wants to learn:</span>{" "}
                  {profile.skills_learn.join(", ") || "—"}
                </p>
              </SpotlightCard>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
