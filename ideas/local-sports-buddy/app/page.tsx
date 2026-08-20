import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { GlassPanel } from "@/components/motion/GlassPanel";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Local Sports Buddy</h1>
        <p className="mb-6 text-muted">
          Find people nearby to play basketball, football, or tennis with —
          post a game, browse what&apos;s open near you, and say
          you&apos;re in.
        </p>

        <GlassPanel className="mb-6">
          <ol className="list-inside list-decimal space-y-2 text-sm text-fg">
            <li>Browse open games by sport and city — no account needed.</li>
            <li>Create a profile to post your own game.</li>
            <li>
              Tap &ldquo;I&apos;m in&rdquo; on a game you want to join —
              coordination happens however you two connect from there.
            </li>
          </ol>
        </GlassPanel>

        <div className="flex gap-3">
          <Link href="/browse">
            <Button>Browse games</Button>
          </Link>
          <Link href="/login">
            <Button variant="secondary">Log in / sign up</Button>
          </Link>
        </div>
      </main>
    </>
  );
}
