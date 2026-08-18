import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Flashcard Exchange</h1>
        <p className="mb-6 text-muted">
          Create and share flashcard decks for the exams you&apos;re
          studying for, or browse decks other students have made public.
          Study mode flips through a deck and lets you mark each card
          &quot;got it&quot; or &quot;study again&quot; so the tricky ones
          come back around.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/decks">
            <Button variant="primary">Browse decks</Button>
          </Link>
          <Link href="/decks/new">
            <Button variant="secondary">Create a deck</Button>
          </Link>
        </div>

        <Card>
          <p className="text-sm text-muted">
            This pass is browse/create/study only — there&apos;s no
            marketplace or payments here, just free public decks. Creating a
            deck needs a quick passwordless login (magic link email) so you
            can come back and edit it later; browsing and studying decks is
            open to everyone.
          </p>
        </Card>
      </main>
    </>
  );
}
