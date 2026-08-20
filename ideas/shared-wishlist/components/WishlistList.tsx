"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/client";
import type { Wishlist } from "@/lib/types";

type FormStatus = "idle" | "saving" | "error";

export function WishlistList({
  initialWishlists,
}: {
  initialWishlists: Wishlist[];
}) {
  const [wishlists, setWishlists] = useState<Wishlist[]>(initialWishlists);
  const [title, setTitle] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState("");

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormStatus("saving");
    setFormError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setFormStatus("error");
      setFormError("You must be logged in.");
      return;
    }

    const { data, error } = await supabase
      .from("shared_wishlist_wishlists")
      .insert({ title: title.trim(), owner_id: user.id })
      .select("id, title, created_at")
      .single();

    if (error || !data) {
      setFormStatus("error");
      setFormError(error?.message ?? "Could not create the wishlist.");
      return;
    }

    setWishlists((prev) => [data, ...prev]);
    setTitle("");
    setFormStatus("idle");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="title">New wishlist</label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My Birthday 2026"
            />
          </div>
          <Button type="submit" disabled={formStatus === "saving"}>
            {formStatus === "saving" ? "Creating…" : "Create wishlist"}
          </Button>
        </form>
        {formStatus === "error" && (
          <p className="mt-2 text-sm text-danger">{formError}</p>
        )}
      </Card>

      {wishlists.length === 0 ? (
        <EmptyState
          title="No wishlists yet"
          description="Create one above to get a shareable link."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {wishlists.map((w, i) => (
            <AnimatedCard
              key={w.id}
              index={i}
              className="flex items-center justify-between"
            >
              <div>
                <p className="font-semibold">{w.title}</p>
                <p className="text-xs text-muted">
                  Created {new Date(w.created_at).toLocaleDateString()}
                </p>
              </div>
              <Link href={`/wishlist/${w.id}`}>
                <Button variant="secondary">Manage</Button>
              </Link>
            </AnimatedCard>
          ))}
        </div>
      )}
    </div>
  );
}
