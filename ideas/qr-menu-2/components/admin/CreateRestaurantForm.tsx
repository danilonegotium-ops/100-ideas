"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function CreateRestaurantForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const finalSlug = slugify(slug || name);
    if (finalSlug.length < 2) {
      setError("Pick a longer name or URL slug.");
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
      .from("qr_menu_2_restaurants")
      .insert({ owner_id: user.id, slug: finalSlug, name: name.trim() });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "That URL slug is already taken — try another."
          : insertError.message,
      );
      setSubmitting(false);
      return;
    }

    router.push(`/admin/${finalSlug}`);
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold">Create your restaurant</h2>
      <p className="mb-4 text-sm text-muted">
        You don&apos;t have a restaurant yet — set one up to start building
        your menu.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label htmlFor="restaurant-name">Restaurant name</label>
          <input
            id="restaurant-name"
            required
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (!slugTouched) setSlug(slugify(event.target.value));
            }}
            placeholder="Demo Bistro"
          />
        </div>
        <div>
          <label htmlFor="restaurant-slug">URL slug</label>
          <input
            id="restaurant-slug"
            required
            value={slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
            placeholder="demo-bistro"
          />
          <p className="mt-1 text-xs text-muted">
            Customers will visit /r/{slug || "your-slug"}
          </p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creating…" : "Create restaurant"}
        </Button>
      </form>
    </Card>
  );
}
