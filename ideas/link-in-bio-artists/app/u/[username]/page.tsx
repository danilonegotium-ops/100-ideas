import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { createClient } from "@/lib/supabase/server";

export default async function PublicProfilePage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("link_in_bio_artists_profiles")
    .select("id, username, display_name, bio, avatar_url, is_published")
    .eq("username", params.username)
    .maybeSingle();

  if (!profile || !profile.is_published) notFound();

  const [{ data: links }, { data: portfolioItems }] = await Promise.all([
    supabase
      .from("link_in_bio_artists_links")
      .select("id, label, url")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("link_in_bio_artists_portfolio_items")
      .select("id, image_url, caption")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GlassPanel glow className="mb-8 flex flex-col items-center text-center">
          {profile.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element -- arbitrary per-artist URL, not a static allowlisted domain
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="mb-4 h-24 w-24 rounded-full border border-border object-cover"
            />
          )}
          <h1 className="text-headline text-fg">{profile.display_name}</h1>
          {profile.bio && <p className="mt-2 max-w-md text-sm text-muted">{profile.bio}</p>}
        </GlassPanel>

        {links && links.length > 0 && (
          <div className="mb-8 flex flex-col gap-3">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-brand border border-border bg-surface px-4 py-3 text-center text-sm font-medium no-underline text-fg transition-colors hover:border-accent"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}

        {portfolioItems && portfolioItems.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {portfolioItems.map((item) => (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary per-artist URL, not a static allowlisted domain
              <img
                key={item.id}
                src={item.image_url}
                alt={item.caption ?? ""}
                className="aspect-square w-full rounded-brand border border-border object-cover"
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
