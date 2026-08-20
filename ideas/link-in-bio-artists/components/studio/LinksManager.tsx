"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/client";

export interface LinkRow {
  id: string;
  label: string;
  url: string;
  sort_order: number;
}

export function LinksManager({
  profileId,
  initialLinks,
}: {
  profileId: string;
  initialLinks: LinkRow[];
}) {
  const [links, setLinks] = useState(initialLinks);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!label.trim() || !url.trim()) return;
    setSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("link_in_bio_artists_links")
      .insert({ profile_id: profileId, label: label.trim(), url: url.trim(), sort_order: links.length })
      .select("id, label, url, sort_order")
      .single();

    setSubmitting(false);

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add link.");
      return;
    }

    setLinks((prev) => [...prev, data]);
    setLabel("");
    setUrl("");
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error: deleteError } = await supabase.from("link_in_bio_artists_links").delete().eq("id", id);
    if (!deleteError) {
      setLinks((prev) => prev.filter((link) => link.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="link-label">Label</label>
            <input
              id="link-label"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Instagram"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="link-url">URL</label>
            <input
              id="link-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://instagram.com/you"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            Add link
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      </Card>

      {links.length === 0 ? (
        <EmptyState
          title="No links yet"
          description="Add your first link above — Instagram, a shop, a mailing list, whatever fits."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {links.map((link, i) => (
            <AnimatedCard key={link.id} index={i} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{link.label}</p>
                <p className="break-all text-xs text-muted">{link.url}</p>
              </div>
              <button type="button" onClick={() => handleDelete(link.id)} className="text-sm text-danger">
                Delete
              </button>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
