import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { ProposeSwapForm } from "@/components/ProposeSwapForm";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function ProfileDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const user = await getUser();

  const { data: profile } = await supabase
    .from("skill_swap_platform_profiles")
    .select("id, user_id, display_name, bio, skills_teach, skills_learn")
    .eq("id", params.id)
    .maybeSingle();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user !== null && profile.user_id === user.id;

  let myProfile: { skills_teach: string[] } | null = null;
  if (user && !isOwnProfile) {
    const { data } = await supabase
      .from("skill_swap_platform_profiles")
      .select("skills_teach")
      .eq("user_id", user.id)
      .maybeSingle();
    myProfile = data;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          {profile.display_name}
          {isOwnProfile ? " (you)" : ""}
        </h1>
        {profile.bio && <p className="mb-4 text-muted">{profile.bio}</p>}

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <AnimatedCard index={0}>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              Teaches
            </p>
            <p className="text-sm text-fg">
              {profile.skills_teach.join(", ") || "—"}
            </p>
          </AnimatedCard>
          <AnimatedCard index={1}>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              Wants to learn
            </p>
            <p className="text-sm text-fg">
              {profile.skills_learn.join(", ") || "—"}
            </p>
          </AnimatedCard>
        </div>

        <GlassPanel glow>
          <h2 className="mb-3 text-sm font-semibold text-fg">
            Propose a swap
          </h2>
          {isOwnProfile ? (
            <p className="text-sm text-muted">This is your own profile.</p>
          ) : !user ? (
            <p className="text-sm text-muted">
              <Link
                href={`/login?next=/profiles/${profile.id}`}
                className="text-accent underline"
              >
                Log in
              </Link>{" "}
              to propose a swap with {profile.display_name}.
            </p>
          ) : !myProfile ? (
            <p className="text-sm text-muted">
              <Link href="/profiles/new" className="text-accent underline">
                Create your profile
              </Link>{" "}
              first so {profile.display_name} knows what you can teach in
              return.
            </p>
          ) : profile.skills_teach.length === 0 ? (
            <p className="text-sm text-muted">
              {profile.display_name} hasn&apos;t listed anything to teach
              yet.
            </p>
          ) : (
            <ProposeSwapForm
              targetProfileId={profile.id}
              myTeachSkills={myProfile.skills_teach}
              targetTeachSkills={profile.skills_teach}
            />
          )}
        </GlassPanel>
      </main>
    </>
  );
}
