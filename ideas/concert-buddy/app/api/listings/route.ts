import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { todayDateInputValue } from "@/lib/formatDate";

const MAX_NOTE_LENGTH = 1000;
const MAX_CONTACT_HINT_LENGTH = 300;

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !user.email) {
    return NextResponse.json(
      { error: "You must be logged in to post a listing." },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { eventName, eventDate, city, note, contactHint } = payload as {
    eventName?: string;
    eventDate?: string;
    city?: string;
    note?: string;
    contactHint?: string;
  };

  const trimmedName = typeof eventName === "string" ? eventName.trim() : "";
  const trimmedCity = typeof city === "string" ? city.trim() : "";

  if (!trimmedName) {
    return NextResponse.json({ error: "Give the event a name." }, { status: 400 });
  }
  if (!trimmedCity) {
    return NextResponse.json({ error: "Which city is it in?" }, { status: 400 });
  }
  if (!eventDate || Number.isNaN(new Date(eventDate).getTime())) {
    return NextResponse.json({ error: "Pick a valid event date." }, { status: 400 });
  }
  if (eventDate < todayDateInputValue()) {
    return NextResponse.json(
      { error: "The event date can't be in the past." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("concert_buddy_listings")
    .insert({
      user_id: user.id,
      user_email: user.email,
      event_name: trimmedName,
      event_date: eventDate,
      city: trimmedCity,
      note: typeof note === "string" && note.trim() ? note.trim().slice(0, MAX_NOTE_LENGTH) : null,
      contact_hint:
        typeof contactHint === "string" && contactHint.trim()
          ? contactHint.trim().slice(0, MAX_CONTACT_HINT_LENGTH)
          : null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save your listing. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ listing: data }, { status: 201 });
}
