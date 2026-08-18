import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();
  let hasProfile = false;

  if (user) {
    const supabase = createClient();
    const { data } = await supabase
      .from("roommate_matcher_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    hasProfile = !!data;
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Roommate Matcher</h1>
        <p className="mb-6 text-muted">
          For students in Belgrade and Novi Sad — find a roommate who
          actually matches your lifestyle, not just whoever answered the
          group chat first.
        </p>

        {!user && (
          <Card>
            <p className="mb-4 text-sm text-muted">
              Log in with just your email (no password) to create a
              profile and start browsing.
            </p>
            <Link
              href="/login"
              className="inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
            >
              Log in
            </Link>
          </Card>
        )}

        {user && !hasProfile && (
          <Card>
            <p className="mb-4 text-sm text-muted">
              You don&apos;t have a profile yet — create one so others can
              find you, and so we can score compatibility when you browse.
            </p>
            <Link
              href="/profile"
              className="inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
            >
              Create your profile
            </Link>
          </Card>
        )}

        {user && hasProfile && (
          <Card className="flex flex-wrap items-center gap-3">
            <Link
              href="/browse"
              className="inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
            >
              Browse roommates
            </Link>
            <Link href="/profile" className="text-sm text-muted hover:text-fg">
              Edit your profile
            </Link>
          </Card>
        )}
      </main>
    </>
  );
}
