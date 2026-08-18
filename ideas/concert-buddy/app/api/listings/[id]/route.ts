import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

/** Owner-only toggle for `is_filled` — "found a buddy" / "reopen listing". */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload.is_filled !== "boolean") {
    return NextResponse.json(
      { error: "Missing or invalid is_filled." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("concert_buddy_listings")
    .update({ is_filled: payload.is_filled })
    .eq("id", params.id)
    // RLS already restricts updates to the owner — this explicit filter
    // just gives us a clean "0 rows" result to turn into a 404 below,
    // instead of a generic RLS-denied error.
    .eq("user_id", user.id)
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Couldn't update the listing." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "Listing not found, or it isn't yours." },
      { status: 404 },
    );
  }

  return NextResponse.json({ listing: data });
}
