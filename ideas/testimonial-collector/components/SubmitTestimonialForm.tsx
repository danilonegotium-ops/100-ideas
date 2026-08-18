"use client";

import { FormEvent, useRef, useState, useTransition } from "react";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";
import { submitTestimonial } from "@/app/c/[slug]/actions";
import { VIDEO_BUCKET } from "@/lib/types";

type Status = "idle" | "uploading" | "submitting" | "done";

/**
 * Public, unauthenticated submission form. Video upload (if a file is
 * attached) happens directly from the browser to Supabase Storage —
 * standard Supabase pattern, and safe re: the build-safety rule in
 * lib/supabase/client.ts because `createClient()` is only called inside
 * this submit handler, never at render time.
 */
export function SubmitTestimonialForm({ slug, collectionId }: { slug: string; collectionId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const fileInput = form.elements.namedItem("video") as HTMLInputElement | null;
    const file = fileInput?.files?.[0] ?? null;

    startTransition(async () => {
      try {
        if (file) {
          setStatus("uploading");
          const supabase = createClient();
          const path = `${collectionId}/${crypto.randomUUID()}-${file.name}`;
          const { error: uploadError } = await supabase.storage.from(VIDEO_BUCKET).upload(path, file);
          if (uploadError) {
            setError(`Video upload failed: ${uploadError.message}`);
            setStatus("idle");
            return;
          }
          const { data: publicUrlData } = supabase.storage.from(VIDEO_BUCKET).getPublicUrl(path);
          formData.set("video_url", publicUrlData.publicUrl);
        }

        setStatus("submitting");
        const result = await submitTestimonial(slug, formData);
        if (!result.ok) {
          setError(result.error);
          setStatus("idle");
          return;
        }
        setStatus("done");
        formRef.current?.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong — try again.");
        setStatus("idle");
      }
    });
  }

  if (status === "done") {
    return <p className="text-sm text-fg">Thank you! Your testimonial was submitted for review.</p>;
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <label htmlFor="author_name">Your name</label>
        <input id="author_name" name="author_name" type="text" required placeholder="Jane Doe" />
      </div>
      <div>
        <label htmlFor="author_email">Your email (optional, kept private)</label>
        <input id="author_email" name="author_email" type="email" placeholder="jane@example.com" />
      </div>
      <div>
        <label htmlFor="content">Your testimonial</label>
        <textarea id="content" name="content" rows={4} placeholder="What was your experience like?" />
      </div>
      <div>
        <label htmlFor="rating">Rating (optional)</label>
        <select id="rating" name="rating" defaultValue="">
          <option value="">No rating</option>
          <option value="5">★★★★★</option>
          <option value="4">★★★★</option>
          <option value="3">★★★</option>
          <option value="2">★★</option>
          <option value="1">★</option>
        </select>
      </div>
      <div>
        <label htmlFor="video">Or attach a short video (optional)</label>
        <input id="video" name="video" type="file" accept="video/*" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <Button type="submit" disabled={isPending}>
          {status === "uploading" ? "Uploading video…" : status === "submitting" ? "Submitting…" : "Submit testimonial"}
        </Button>
      </div>
    </form>
  );
}
