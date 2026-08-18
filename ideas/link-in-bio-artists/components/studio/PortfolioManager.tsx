"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

export interface PortfolioItemRow {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

export function PortfolioManager({
  profileId,
  initialItems,
}: {
  profileId: string;
  initialItems: PortfolioItemRow[];
}) {
  const [items, setItems] = useState(initialItems);
  const [imageUrl, setImageUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!imageUrl.trim()) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("link_in_bio_artists_portfolio_items")
      .insert({
        profile_id: profileId,
        image_url: imageUrl.trim(),
        caption: caption.trim() || null,
        sort_order: items.length,
      })
      .select("id, image_url, caption, sort_order")
      .single();

    setSubmitting(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add image.");
      return;
    }

    setItems((prev) => [...prev, data]);
    setImageUrl("");
    setCaption("");
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("link_in_bio_artists_portfolio_items")
      .delete()
      .eq("id", id);
    if (!deleteError) {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div>
            <label htmlFor="image-url">Image URL</label>
            <input
              id="image-url"
              value={imageUrl}
              onChange={(event) => setImageUrl(event.target.value)}
              placeholder="https://…"
            />
            <p className="mt-1 text-xs text-muted">
              No image upload in this MVP — paste a hosted image URL. Try{" "}
              <a href="https://picsum.photos" target="_blank" rel="noreferrer" className="text-accent">
                picsum.photos
              </a>{" "}
              for a placeholder.
            </p>
          </div>
          <div>
            <label htmlFor="caption">Caption (optional)</label>
            <input
              id="caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Mural, downtown"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={submitting}>
            Add to portfolio
          </Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-muted">No portfolio images yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary user-submitted URL, next/image needs a static domain allowlist */}
              <img
                src={item.image_url}
                alt={item.caption ?? ""}
                className="aspect-square w-full rounded-brand border border-border object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="text-xs text-danger"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
