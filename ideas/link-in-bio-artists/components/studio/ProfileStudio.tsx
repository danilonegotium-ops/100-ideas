"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/motion/StatTile";
import { createClient } from "@/lib/supabase/client";
import { LinksManager, type LinkRow } from "./LinksManager";
import { PortfolioManager, type PortfolioItemRow } from "./PortfolioManager";

type Tab = "profile" | "links" | "portfolio";

export interface ProfileRow {
  id: string;
  username: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  is_published: boolean;
}

export function ProfileStudio({
  profile,
  links,
  portfolioItems,
}: {
  profile: ProfileRow;
  links: LinkRow[];
  portfolioItems: PortfolioItemRow[];
}) {
  const [tab, setTab] = useState<Tab>("profile");
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [isPublished, setIsPublished] = useState(profile.is_published);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("link_in_bio_artists_profiles")
      .update({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Studio</h1>
          <p className="text-sm text-muted">/u/{profile.username}</p>
        </div>
        <Link href={`/u/${profile.username}`} className="text-sm text-accent">
          View public page &rarr;
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-xs">
        <StatTile label="Links" value={links.length} />
        <StatTile label="Portfolio images" value={portfolioItems.length} />
      </div>

      <div className="mb-6 flex gap-2 border-b border-border">
        {(
          [
            ["profile", "Profile"],
            ["links", "Links"],
            ["portfolio", "Portfolio"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`px-3 py-2 text-sm ${
              tab === value ? "border-b-2 border-accent font-semibold" : "text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <Card>
          <form onSubmit={handleSave} className="flex flex-col gap-3">
            <div>
              <label htmlFor="display-name">Display name</label>
              <input
                id="display-name"
                required
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                rows={3}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder="Illustrator & muralist based in…"
              />
            </div>
            <div>
              <label htmlFor="avatar-url">Avatar image URL</label>
              <input
                id="avatar-url"
                value={avatarUrl}
                onChange={(event) => setAvatarUrl(event.target.value)}
                placeholder="https://…"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="w-auto"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
              />
              Published (visible at /u/{profile.username})
            </label>
            {error && <p className="text-sm text-danger">{error}</p>}
            {saved && <p className="text-sm text-accent">Saved.</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </Card>
      )}

      {tab === "links" && <LinksManager profileId={profile.id} initialLinks={links} />}
      {tab === "portfolio" && (
        <PortfolioManager profileId={profile.id} initialItems={portfolioItems} />
      )}
    </div>
  );
}
