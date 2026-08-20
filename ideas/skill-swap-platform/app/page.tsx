import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();

  return (
    <>
      <Nav />
      <main className="relative mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GradientMesh animate />
        <h1 className="mb-2 text-2xl font-semibold">Skill Swap Platform</h1>
        <p className="mb-6 text-muted">
          &quot;Tinder for skills&quot; — I teach you Photoshop, you teach
          me guitar. List what you can teach and what you want to learn,
          browse other members, and propose a swap.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/profiles">
            <Button variant="primary">Browse members</Button>
          </Link>
          <Link href="/profiles/new">
            <Button variant="secondary">
              {user ? "Edit your profile" : "Create your profile"}
            </Button>
          </Link>
          {user && (
            <Link href="/swaps">
              <Button variant="secondary">My swaps</Button>
            </Link>
          )}
        </div>

        <GlassPanel>
          <p className="text-sm text-muted">
            Proposing a swap creates a pending match visible to both people
            — there&apos;s no in-app messaging in this pass, so once
            someone accepts, you&apos;ll coordinate the details (when, how)
            outside the app.
          </p>
        </GlassPanel>
      </main>
    </>
  );
}
