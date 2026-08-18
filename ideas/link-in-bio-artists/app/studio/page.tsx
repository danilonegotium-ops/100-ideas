import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient, getUser } from "@/lib/supabase/server";
import { CreateProfileForm } from "@/components/studio/CreateProfileForm";
import { ProfileStudio } from "@/components/studio/ProfileStudio";

export default async function StudioPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/studio");

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("link_in_bio_artists_profiles")
    .select("id, username, display_name, bio, avatar_url, is_published")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!profile) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-6 text-2xl font-semibold">Studio</h1>
          <CreateProfileForm />
        </main>
      </>
    );
  }

  const [{ data: links }, { data: portfolioItems }] = await Promise.all([
    supabase
      .from("link_in_bio_artists_links")
      .select("id, label, url, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("link_in_bio_artists_portfolio_items")
      .select("id, image_url, caption, sort_order")
      .eq("profile_id", profile.id)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <ProfileStudio profile={profile} links={links ?? []} portfolioItems={portfolioItems ?? []} />
      </main>
    </>
  );
}
