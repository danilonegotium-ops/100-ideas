import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { StudyDeck } from "@/components/StudyDeck";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { createClient } from "@/lib/supabase/server";

export default async function DeckPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: deck } = await supabase
    .from("flashcard_exchange_decks")
    .select("id, title, subject, exam_tag, description, owner_label")
    .eq("id", params.id)
    .maybeSingle();

  if (!deck) {
    notFound();
  }

  const { data: cards } = await supabase
    .from("flashcard_exchange_cards")
    .select("id, front, back")
    .eq("deck_id", params.id)
    .order("position", { ascending: true });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{deck.title}</h1>
          <span className="rounded-brand border border-border px-2 py-0.5 text-xs text-muted">
            {deck.subject}
          </span>
        </div>
        {deck.exam_tag && <p className="mb-2 text-sm text-muted">{deck.exam_tag}</p>}
        {deck.description && (
          <p className="mb-2 text-sm text-muted">{deck.description}</p>
        )}
        <p className="mb-6 text-xs text-muted">
          {deck.owner_label ?? "Shared by a member"} · {cards?.length ?? 0} cards
        </p>

        <GlassPanel glow className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-fg">Study mode</h2>
          <StudyDeck cards={cards ?? []} />
        </GlassPanel>

        {cards && cards.length > 0 && (
          <details>
            <summary className="cursor-pointer text-sm text-muted">
              View all cards
            </summary>
            <div className="mt-3 flex flex-col gap-2">
              {cards.map((card, i) => (
                <AnimatedCard key={card.id} index={i} hoverLift={false}>
                  <p className="text-sm text-fg">{card.front}</p>
                  <p className="mt-1 text-sm text-muted">{card.back}</p>
                </AnimatedCard>
              ))}
            </div>
          </details>
        )}
      </main>
    </>
  );
}
