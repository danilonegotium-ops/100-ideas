import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

const MAX_MESSAGE_LENGTH = 1000;

/**
 * Expresses interest in a listing — creates the "visible connection"
 * between poster and interested user (the poster can then see this row on
 * their own listing detail page, per RLS in schema.sql).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getUser();
  if (!user || !user.email) {
    return NextResponse.json(
      { error: "You must be logged in to express interest." },
      { status: 401 },
    );
  }

  const supabase = createClient();

  const { data: listing } = await supabase
    .from("concert_buddy_listings")
    .select("id, user_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }
  if (listing.user_id === user.id) {
    return NextResponse.json(
      { error: "You can't express interest in your own listing." },
      { status: 400 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const message =
    typeof payload?.message === "string" && payload.message.trim()
      ? payload.message.trim().slice(0, MAX_MESSAGE_LENGTH)
      : null;

  const { error } = await supabase.from("concert_buddy_interests").insert({
    listing_id: params.id,
    user_id: user.id,
    user_email: user.email,
    message,
  });

  if (error) {
    // Unique (listing_id, user_id) violation just means they already
    // expressed interest — treat re-clicking the button as a no-op
    // success instead of an error, so the action is safely repeatable.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadyInterested: true });
    }
    return NextResponse.json(
      { error: "Couldn't record your interest. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
