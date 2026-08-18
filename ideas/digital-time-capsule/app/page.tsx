import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Digital Time Capsule</h1>
        <p className="mb-6 text-muted">
          Write a letter to your future self. Pick 5 years, 10 years, or any
          custom date — we&apos;ll email it to you exactly then. Nobody reads
          it before you do.
        </p>
        <Card className="mb-6">
          <p className="mb-4 text-sm text-muted">
            Log in with just your email (no password) to write your first
            letter.
          </p>
          <Link
            href="/capsule"
            className="inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
          >
            Write a letter
          </Link>
        </Card>
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
