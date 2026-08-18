"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { deleteTestimonial, moderateTestimonial } from "@/app/dashboard/actions";
import { formatDate, type Testimonial, type TestimonialStatus } from "@/lib/types";

function StatusBadge({ status }: { status: TestimonialStatus }) {
  if (status === "approved") {
    return <span className="rounded-brand bg-accent px-2 py-0.5 text-xs font-medium text-[#062b1c]">Approved</span>;
  }
  if (status === "rejected") {
    return <span className="rounded-brand bg-danger px-2 py-0.5 text-xs font-medium text-[#2b0606]">Rejected</span>;
  }
  return <span className="rounded-brand border border-border px-2 py-0.5 text-xs font-medium text-muted">Pending</span>;
}

function TestimonialCard({ testimonial, collectionName }: { testimonial: Testimonial; collectionName: string }) {
  const [isPending, startTransition] = useTransition();
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: string, task: () => Promise<{ ok: true } | { ok: false; error: string }>) {
    setError(null);
    setBusyAction(action);
    startTransition(async () => {
      const result = await task();
      if (!result.ok) setError(result.error);
      setBusyAction(null);
    });
  }

  return (
    <Card>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{testimonial.author_name}</p>
          <p className="text-xs text-muted">
            {collectionName} &middot; {formatDate(testimonial.submitted_at)}
            {testimonial.rating ? ` · ${"★".repeat(testimonial.rating)}` : ""}
          </p>
        </div>
        <StatusBadge status={testimonial.status} />
      </div>

      {testimonial.content && <p className="mb-2 text-sm text-fg">{testimonial.content}</p>}
      {testimonial.video_url && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <video controls className="mb-2 w-full rounded-brand" src={testimonial.video_url} />
      )}

      <div className="flex flex-wrap gap-2">
        {testimonial.status !== "approved" && (
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run("approve", () => moderateTestimonial(testimonial.id, "approved"))}
          >
            {busyAction === "approve" ? "Saving…" : "Approve"}
          </Button>
        )}
        {testimonial.status !== "rejected" && (
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={() => run("reject", () => moderateTestimonial(testimonial.id, "rejected"))}
          >
            {busyAction === "reject" ? "Saving…" : "Reject"}
          </Button>
        )}
        <Button
          variant="danger"
          disabled={isPending}
          onClick={() => {
            if (window.confirm(`Delete this testimonial from ${testimonial.author_name}? This can't be undone.`)) {
              run("delete", () => deleteTestimonial(testimonial.id));
            }
          }}
        >
          {busyAction === "delete" ? "Deleting…" : "Delete"}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Card>
  );
}

export function TestimonialModerationList({
  testimonials,
  collectionNameById,
}: {
  testimonials: Testimonial[];
  collectionNameById: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-3">
      {testimonials.map((testimonial) => (
        <TestimonialCard
          key={testimonial.id}
          testimonial={testimonial}
          collectionName={collectionNameById[testimonial.collection_id] ?? "Unknown collection"}
        />
      ))}
    </div>
  );
}
