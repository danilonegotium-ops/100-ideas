import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { WishlistList } from "@/components/WishlistList";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Wishlist } from "@/lib/types";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-2 text-2xl font-semibold">Shared Wishlist</h1>
          <p className="mb-6 text-muted">
            Create a wishlist, share the link with friends and family, and
            let them claim items to avoid duplicate gifts — without ever
            spoiling the surprise for you.
          </p>
          <GlassPanel glow>
            <p className="mb-4 text-sm text-muted">
              Log in with a magic link to create your own wishlist.
            </p>
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          </GlassPanel>
        </main>
      </>
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_wishlist_wishlists")
    .select("id, title, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  const wishlists: Wishlist[] = error ? [] : (data ?? []);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Shared Wishlist</h1>
        <p className="mb-6 text-muted">
          Logged in as <strong className="text-fg">{user.email}</strong>.
        </p>
        {error && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              Couldn&apos;t load your wishlists: {error.message}
            </p>
          </Card>
        )}
        <WishlistList initialWishlists={wishlists} />
      </main>
    </>
  );
}
