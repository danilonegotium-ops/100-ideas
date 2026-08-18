"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { createClient } from "@/lib/supabase/client";

type CardDraft = { front: string; back: string };

const emptyCard: CardDraft = { front: "", back: "" };

export function NewDeckForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examTag, setExamTag] = useState("");
  const [description, setDescription] = useState("");
  const [cards, setCards] = useState<CardDraft[]>([{ ...emptyCard }, { ...emptyCard }]);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function updateCard(index: number, field: keyof CardDraft, value: string) {
    setCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  }

  function addCardRow() {
    setCards((prev) => [...prev, { ...emptyCard }]);
  }

  function removeCardRow(index: number) {
    setCards((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const validCards = cards
      .map((c) => ({ front: c.front.trim(), back: c.back.trim() }))
      .filter((c) => c.front && c.back);

    if (!title.trim() || !subject.trim()) {
      setStatus("error");
      setErrorMessage("Title and subject are required.");
      return;
    }
    if (validCards.length === 0) {
      setStatus("error");
      setErrorMessage("Add at least one card with both a front and a back.");
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("error");
      setErrorMessage("Your session expired — please log in again.");
      return;
    }

    const { data: deck, error: deckError } = await supabase
      .from("flashcard_exchange_decks")
      .insert({
        owner_id: user.id,
        title: title.trim(),
        subject: subject.trim(),
        exam_tag: examTag.trim() || null,
        description: description.trim() || null,
      })
      .select("id")
      .single();

    if (deckError || !deck) {
      setStatus("error");
      setErrorMessage(deckError?.message ?? "Couldn't create the deck.");
      return;
    }

    const { error: cardsError } = await supabase
      .from("flashcard_exchange_cards")
      .insert(
        validCards.map((c, i) => ({
          deck_id: deck.id,
          front: c.front,
          back: c.back,
          position: i,
        })),
      );

    if (cardsError) {
      setStatus("error");
      setErrorMessage(cardsError.message);
      return;
    }

    router.push(`/decks/${deck.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Organic Chemistry: Functional Groups"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Chemistry"
            required
          />
        </div>
        <div>
          <label htmlFor="examTag">Exam tag (optional)</label>
          <input
            id="examTag"
            value={examTag}
            onChange={(e) => setExamTag(e.target.value)}
            placeholder="e.g. Orgo I Midterm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="description">Description (optional)</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-fg">Cards</p>
        <div className="flex flex-col gap-3">
          {cards.map((card, i) => (
            <Card key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">Card {i + 1}</span>
                {cards.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCardRow(i)}
                    className="text-xs text-danger underline"
                  >
                    Remove
                  </button>
                )}
              </div>
              <div>
                <label htmlFor={`front-${i}`}>Front</label>
                <input
                  id={`front-${i}`}
                  value={card.front}
                  onChange={(e) => updateCard(i, "front", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor={`back-${i}`}>Back</label>
                <input
                  id={`back-${i}`}
                  value={card.back}
                  onChange={(e) => updateCard(i, "back", e.target.value)}
                />
              </div>
            </Card>
          ))}
        </div>
        <Button type="button" variant="secondary" className="mt-3" onClick={addCardRow}>
          Add another card
        </Button>
      </div>

      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}

      <Button type="submit" disabled={status === "saving"}>
        {status === "saving" ? "Saving…" : "Create deck"}
      </Button>
    </form>
  );
}
