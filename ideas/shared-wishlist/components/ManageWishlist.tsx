"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { OwnerItemView } from "@/lib/types";

type FormStatus = "idle" | "saving" | "error";

export function ManageWishlist({
  wishlistId,
  initialItems,
}: {
  wishlistId: string;
  initialItems: OwnerItemView[];
}) {
  const [items, setItems] = useState<OwnerItemView[]>(initialItems);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareUrl(`${window.location.origin}/w/${wishlistId}`);
  }, [wishlistId]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("saving");
    setFormError("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("shared_wishlist_items")
      .insert({
        wishlist_id: wishlistId,
        name: name.trim(),
        url: url.trim() || null,
        price: price.trim() ? Number(price) : null,
        notes: notes.trim() || null,
      })
      .select("id, wishlist_id, name, url, price, notes, created_at")
      .single();

    if (error || !data) {
      setFormStatus("error");
      setFormError(error?.message ?? "Could not add the item.");
      return;
    }

    setItems((prev) => [...prev, { ...data, is_claimed: false }]);
    setName("");
    setUrl("");
    setPrice("");
    setNotes("");
    setFormStatus("idle");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const supabase = createClient();
    const { error } = await supabase
      .from("shared_wishlist_items")
      .delete()
      .eq("id", id);

    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }
    setDeletingId(null);
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail (permissions, non-HTTPS context) — the URL
      // is still visible/selectable in the input below as a fallback.
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <label htmlFor="share-url">Share this link with friends</label>
        <div className="flex gap-2">
          <input id="share-url" readOnly value={shareUrl} />
          <Button variant="secondary" onClick={copyShareLink}>
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Anyone with this link can view the list and claim items — no
          account needed on their end.
        </p>
      </Card>

      <Card>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <div>
            <label htmlFor="name">Item name</label>
            <input
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Wireless headphones"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <label htmlFor="url">Link (optional)</label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/product"
              />
            </div>
            <div className="w-full sm:w-32">
              <label htmlFor="price">Price (optional)</label>
              <input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="49.99"
              />
            </div>
          </div>
          <div>
            <label htmlFor="notes">Notes (optional)</label>
            <input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any color except pink"
            />
          </div>
          {formStatus === "error" && (
            <p className="text-sm text-danger">{formError}</p>
          )}
          <Button type="submit" disabled={formStatus === "saving"}>
            {formStatus === "saving" ? "Adding…" : "Add item"}
          </Button>
        </form>
      </Card>

      {items.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No items yet — add one above.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
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
                <div className="flex flex-col items-end gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-xs font-semibold",
                      item.is_claimed
                        ? "border-accent text-accent-strong"
                        : "border-border text-muted",
                    )}
                  >
                    {item.is_claimed ? "Claimed" : "Available"}
                  </span>
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? "Removing…" : "Remove"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
