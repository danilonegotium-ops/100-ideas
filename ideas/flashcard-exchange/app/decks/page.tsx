import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/server";

type Deck = {
  id: string;
  title: string;
  subject: string;
  exam_tag: string | null;
  description: string | null;
  owner_label: string | null;
};

/**
 * Browse + search public decks. Calling `createClient()` here (which reads
 * cookies internally) marks this route dynamic, so it's excluded from
 * static prerendering at build time and only runs a real query at request
 * time — safe with placeholder/missing Supabase env vars during `next build`.
 */
export default async function DecksPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let query = supabase
    .from("flashcard_exchange_decks")
    .select("id, title, subject, exam_tag, description, owner_label")
    .order("created_at", { ascending: false });

  if (q) {
    const escaped = q.replace(/[%_]/g, (c) => `\\${c}`);
    query = query.or(
      `title.ilike.%${escaped}%,subject.ilike.%${escaped}%,exam_tag.ilike.%${escaped}%`,
    );
  }

  const { data: decks, error } = await query;

  const subjects = Array.from(
    new Set((decks ?? []).map((d) => d.subject)),
  ).sort();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Browse decks</h1>
        <p className="mb-6 text-muted">
          Search by title, subject, or exam tag.
        </p>

        <form className="mb-4 flex gap-2" action="/decks">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="e.g. organic chemistry, Spanish 101…"
          />
        </form>

        {subjects.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {subjects.map((s) => (
              <Link
                key={s}
                href={`/decks?q=${encodeURIComponent(s)}`}
                className="rounded-brand border border-border px-3 py-1 text-xs text-muted no-underline hover:border-accent hover:text-fg"
              >
                {s}
              </Link>
            ))}
          </div>
        )}

        {error && (
          <Card className="mb-4">
            <p className="text-sm text-danger">
              Couldn&apos;t load decks right now (
              {error.message || "Supabase isn't configured yet"}
              ). This page needs a live Supabase project — see SPEC.md.
            </p>
          </Card>
        )}

        {!error && decks && decks.length === 0 && (
          <EmptyState
            title={q ? `No decks match "${q}".` : "No decks yet"}
            description={
              q
                ? "Try a different title, subject, or exam tag."
                : "Be the first to create one and share it with other students."
            }
            action={
              !q ? (
                <Link href="/decks/new">
                  <Button variant="secondary">Create a deck</Button>
                </Link>
              ) : undefined
            }
          />
        )}

        <div className="flex flex-col gap-3">
          {decks?.map((deck: Deck, i: number) => (
            <Link key={deck.id} href={`/decks/${deck.id}`} className="no-underline">
              <AnimatedCard index={i} className="transition-colors hover:border-accent">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-fg">
                    {deck.title}
                  </h2>
                  <span className="whitespace-nowrap rounded-brand border border-border px-2 py-0.5 text-xs text-muted">
                    {deck.subject}
                  </span>
                </div>
                {deck.exam_tag && (
                  <p className="mb-1 text-xs text-muted">{deck.exam_tag}</p>
                )}
                {deck.description && (
                  <p className="text-sm text-muted">{deck.description}</p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {deck.owner_label ?? "Shared by a member"}
                </p>
              </AnimatedCard>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
