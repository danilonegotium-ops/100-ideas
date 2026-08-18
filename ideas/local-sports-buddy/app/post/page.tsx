import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { PostListingClient } from "./PostListingClient";

export default async function PostPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("local_sports_buddy_profiles")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Post a game</h1>
        {!profile ? (
          <Card>
            <p className="text-sm text-muted">
              You need a profile before posting a game.{" "}
              <Link href="/profile" className="text-accent">
                Create one
              </Link>
              .
            </p>
          </Card>
        ) : (
          <PostListingClient
            profileId={profile.id}
            defaultCity={profile.city}
          />
        )}
      </main>
    </>
  );
}
