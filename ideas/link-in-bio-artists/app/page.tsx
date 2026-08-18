import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Link-in-Bio for Artists</h1>
        <p className="mb-6 text-muted">
          A more aesthetic, portfolio-focused version of Linktree — built for
          creative professionals. One public page for your bio, your links,
          and a real portfolio grid.
        </p>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-1 text-lg font-semibold">For artists</h2>
            <p className="mb-4 text-sm text-muted">
              Sign in to build your page — bio, links, and portfolio images.
            </p>
            <Link href="/studio">
              <Button>Go to studio</Button>
            </Link>
          </Card>

          <Card>
            <h2 className="mb-1 text-lg font-semibold">See it in action</h2>
            <p className="mb-4 text-sm text-muted">
              A seeded example profile, published and public.
            </p>
            <Link href="/u/demo-artist">
              <Button variant="secondary">View demo profile</Button>
            </Link>
          </Card>
        </div>
      </main>
    </>
  );
}
