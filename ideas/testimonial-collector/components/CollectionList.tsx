"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { deleteCollection } from "@/app/dashboard/actions";
import { formatDate, type Collection } from "@/lib/types";

function CollectionRow({ collection }: { collection: Collection }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "embed" | null>(null);

  const publicPath = `/c/${collection.slug}`;
  const embedPath = `/api/embed/${collection.slug}`;

  function copy(kind: "link" | "embed", path: string) {
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium">{collection.business_name}</p>
          <p className="text-xs text-muted">Created {formatDate(collection.created_at)}</p>
          <p className="mt-1 font-mono text-xs text-muted">{publicPath}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => copy("link", publicPath)}>
            {copied === "link" ? "Copied!" : "Copy submission link"}
          </Button>
          <Button variant="secondary" onClick={() => copy("embed", embedPath)}>
            {copied === "embed" ? "Copied!" : "Copy embed URL"}
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(`Delete "${collection.business_name}" and all its testimonials? This can't be undone.`)) {
                setError(null);
                startTransition(async () => {
                  const result = await deleteCollection(collection.id);
                  if (!result.ok) setError(result.error);
                });
              }
            }}
          >
            {isPending ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}

export function CollectionList({ collections }: { collections: Collection[] }) {
  return (
    <div className="flex flex-col gap-3">
      {collections.map((collection) => (
        <CollectionRow key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
