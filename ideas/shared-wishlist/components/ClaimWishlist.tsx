"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import type { PublicItemView } from "@/lib/types";

type ClaimFormState = { name: string; note: string };

export function ClaimWishlist({
  initialItems,
}: {
  initialItems: PublicItemView[];
}) {
  const [items, setItems] = useState<PublicItemView[]>(initialItems);
  const [openFormFor, setOpenFormFor] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, ClaimFormState>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errorFor, setErrorFor] = useState<Record<string, string>>({});

  function formFor(id: string): ClaimFormState {
    return forms[id] ?? { name: "", note: "" };
  }

  async function handleClaim(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setSavingId(id);
    setErrorFor((prev) => ({ ...prev, [id]: "" }));

    const { name, note } = formFor(id);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("shared_wishlist_claims")
      .insert({
        item_id: id,
        claimant_name: name.trim(),
        claimant_note: note.trim() || null,
      })
      .select("item_id, claimant_name, claimant_note")
      .maybeSingle();

    if (error) {
      // 23505 = unique violation on item_id — someone else claimed this
      // item in the moment between page load and this submit.
      setErrorFor((prev) => ({
        ...prev,
        [id]:
          error.code === "23505"
            ? "Someone just claimed this — refresh to see the latest."
            : error.message,
      }));
      setSavingId(null);
      return;
    }

    // `data` can come back null even on success if the current visitor is
    // the wishlist owner claiming their own item — RLS hides the row from
    // them even in the INSERT...RETURNING result (see schema.sql). Either
    // way the insert succeeded (no error), so mark it claimed locally;
    // just don't show a name we were never given back.
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              is_claimed: true,
              claimant_name: data?.claimant_name ?? null,
              claimant_note: data?.claimant_note ?? null,
            }
          : item,
      ),
    );
    setOpenFormFor(null);
    setSavingId(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">This wishlist has no items yet.</p>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted">
                  {item.price != null && `$${Number(item.price).toFixed(2)}`}
                  {item.url && (
                    <>
                      {item.price != null && " · "}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-strong"
                      >
                        link
                      </a>
                    </>
                  )}
                </p>
                {item.notes && (
                  <p className="mt-1 text-sm text-muted">{item.notes}</p>
                )}
              </div>

              {item.is_claimed ? (
                <span className="whitespace-nowrap rounded-full border border-accent px-2 py-0.5 text-xs font-semibold text-accent-strong">
                  {item.claimant_name
                    ? `Claimed by ${item.claimant_name}`
                    : "Claimed"}
                </span>
              ) : openFormFor === item.id ? null : (
                <Button
                  variant="secondary"
                  onClick={() => setOpenFormFor(item.id)}
                >
                  Claim this
                </Button>
              )}
            </div>

            {item.is_claimed && item.claimant_note && (
              <p className="mt-2 text-xs text-muted">
                &ldquo;{item.claimant_note}&rdquo;
              </p>
            )}

            {!item.is_claimed && openFormFor === item.id && (
              <form
                onSubmit={(e) => handleClaim(e, item.id)}
                className="mt-3 flex flex-col gap-2 border-t border-border pt-3"
              >
                <div>
                  <label htmlFor={`name-${item.id}`}>Your name</label>
                  <input
                    id={`name-${item.id}`}
                    required
                    value={formFor(item.id).name}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        [item.id]: { ...formFor(item.id), name: e.target.value },
                      }))
                    }
                    placeholder="So others know it's taken"
                  />
                </div>
                <div>
                  <label htmlFor={`note-${item.id}`}>Note (optional)</label>
                  <input
                    id={`note-${item.id}`}
                    value={formFor(item.id).note}
                    onChange={(e) =>
                      setForms((prev) => ({
                        ...prev,
                        [item.id]: { ...formFor(item.id), note: e.target.value },
                      }))
                    }
                  />
                </div>
                {errorFor[item.id] && (
                  <p className="text-sm text-danger">{errorFor[item.id]}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" disabled={savingId === item.id}>
                    {savingId === item.id ? "Claiming…" : "Confirm claim"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setOpenFormFor(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
