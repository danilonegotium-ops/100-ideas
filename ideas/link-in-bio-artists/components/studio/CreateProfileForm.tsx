"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

function slugifyUsername(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

export function CreateProfileForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const finalUsername = slugifyUsername(username || displayName);
    if (finalUsername.length < 3) {
      setError("Pick a longer name or username (at least 3 characters).");
      setSubmitting(false);
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You're not signed in.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("link_in_bio_artists_profiles")
      .insert({ owner_id: user.id, username: finalUsername, display_name: displayName.trim() });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That username is already taken — try another."
          : insertError.message,
      );
      setSubmitting(false);
      return;
    }

    router.push("/studio");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold">Create your profile</h2>
      <p className="mb-4 text-sm text-muted">
        Pick a display name and a username — your public page will live at
        /u/&lt;username&gt;.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            required
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              if (!usernameTouched) setUsername(slugifyUsername(event.target.value));
            }}
            placeholder="Sasha Rivera"
          />
        </div>
        <div>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            required
            value={username}
            onChange={(event) => {
              setUsernameTouched(true);
              setUsername(event.target.value);
            }}
            placeholder="sasha-rivera"
          />
          <p className="mt-1 text-xs text-muted">/u/{username || "your-username"}</p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create profile"}
        </Button>
      </form>
    </Card>
  );
}
