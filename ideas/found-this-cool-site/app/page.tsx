import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Stumble } from "@/components/Stumble";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Site } from "@/lib/types";

export default async function Home() {
  const user = await getUser();

  // Server Component: safe to call createClient() here at request time
  // (see lib/supabase/server.ts) — cookies() makes this route dynamic, so
  // it never runs during `next build`. Browsing is public (no login
  // required), so this fetch happens regardless of auth state.
  const supabase = createClient();
  const { data, error } = await supabase
    .from("found_this_cool_site_sites")
    .select("id, title, url, description, category")
    .eq("approved", true)
    .order("created_at", { ascending: false });

  const sites: Site[] = error ? [] : (data ?? []);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Found This Cool Site</h1>
        <p className="mb-6 text-muted">
          A &quot;StumbleUpon&quot; clone — hit the button, land on a cool,
          useful, or weird real website.
        </p>
        {error && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              Couldn&apos;t load the site pool: {error.message}
            </p>
          </Card>
        )}
        <Stumble initialSites={sites} userId={user?.id ?? null} />
      </main>
    </>
  );
}
