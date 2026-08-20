import Link from "next/link";
import { Nav } from "@/components/Nav";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { HomeCapsule } from "./HomeCapsule";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="relative mb-6 overflow-hidden rounded-xl2">
          <GradientMesh animate />
          <GlassPanel glow className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div>
              <h1 className="text-headline text-fg">Digital Time Capsule</h1>
              <p className="mt-2 max-w-md text-muted">
                Write a letter to your future self. Pick 5 years, 10 years,
                or any custom date — we&apos;ll email it to you exactly
                then. Nobody reads it before you do.
              </p>
              <Link
                href="/capsule"
                className="mt-5 inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
              >
                Write a letter
              </Link>
              <p className="mt-3 text-sm text-muted">
                Log in with just your email — no password.
              </p>
            </div>
            <div className="h-40 w-40 shrink-0 sm:h-52 sm:w-52">
              <HomeCapsule />
            </div>
          </GlassPanel>
        </div>
        <p className="text-sm text-muted">
          How it works: your letter is sealed the moment you save it. A
          daily job checks for letters whose delivery date has arrived and
          emails them out automatically — you don&apos;t have to do
          anything else, and it&apos;s designed so a letter can never be
          sent twice.
        </p>
      </main>
    </>
  );
}
