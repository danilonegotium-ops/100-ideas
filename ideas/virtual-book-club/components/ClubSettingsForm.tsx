"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Initial = {
  current_book_title: string;
  current_book_author: string;
  next_meeting_at: string; // ISO or ""
  meeting_link: string;
};

function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ClubSettingsForm({
  clubId,
  initial,
}: {
  clubId: string;
  initial: Initial;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.current_book_title);
  const [author, setAuthor] = useState(initial.current_book_author);
  const [meetingAt, setMeetingAt] = useState(
    toDatetimeLocal(initial.next_meeting_at),
  );
  const [meetingLink, setMeetingLink] = useState(initial.meeting_link);
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "saved">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("virtual_book_club_clubs")
      .update({
        current_book_title: title.trim() || null,
        current_book_author: author.trim() || null,
        next_meeting_at: meetingAt ? new Date(meetingAt).toISOString() : null,
        meeting_link: meetingLink.trim() || null,
      })
      .eq("id", clubId);

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="currentBookTitle">Currently reading</label>
          <input
            id="currentBookTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
          />
        </div>
        <div>
          <label htmlFor="currentBookAuthor">Author</label>
          <input
            id="currentBookAuthor"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author"
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="meetingAt">Next meeting</label>
          <input
            id="meetingAt"
            type="datetime-local"
            value={meetingAt}
            onChange={(e) => setMeetingAt(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="meetingLink">Video call link (optional)</label>
          <input
            id="meetingLink"
            type="url"
            value={meetingLink}
            onChange={(e) => setMeetingLink(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>
      {status === "error" && <p className="text-sm text-danger">{errorMessage}</p>}
      {status === "saved" && <p className="text-sm text-muted">Saved.</p>}
      <Button type="submit" disabled={status === "saving"} className="self-start">
        {status === "saving" ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
