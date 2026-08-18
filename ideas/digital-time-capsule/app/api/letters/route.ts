import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { computeDeliverAt, type DeliveryOption } from "@/lib/dates";

const MAX_BODY_LENGTH = 20000;
const MAX_TITLE_LENGTH = 200;

/**
 * Creates a new letter for the signed-in user. Route Handlers never run
 * during `next build`, so this is safe with no Supabase credentials
 * configured — see `lib/supabase/server.ts`.
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !user.email) {
    return NextResponse.json(
      { error: "You must be logged in to write a letter." },
      { status: 401 },
    );
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { title, body, deliveryOption, customDate } = payload as {
    title?: string;
    body?: string;
    deliveryOption?: DeliveryOption;
    customDate?: string;
  };

  const trimmedBody = typeof body === "string" ? body.trim() : "";
  if (!trimmedBody) {
    return NextResponse.json(
      { error: "Write something before sending it to your future self." },
      { status: 400 },
    );
  }
  if (trimmedBody.length > MAX_BODY_LENGTH) {
    return NextResponse.json(
      { error: `Letters are capped at ${MAX_BODY_LENGTH.toLocaleString()} characters.` },
      { status: 400 },
    );
  }

  const trimmedTitle = typeof title === "string" ? title.trim().slice(0, MAX_TITLE_LENGTH) : "";

  let deliverAt: Date;
  try {
    deliverAt = computeDeliverAt(deliveryOption, customDate);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid delivery date.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("digital_time_capsule_letters")
    .insert({
      user_id: user.id,
      user_email: user.email,
      title: trimmedTitle || null,
      body: trimmedBody,
      delivery_option: deliveryOption,
      deliver_at: deliverAt.toISOString(),
    })
    .select("id, title, deliver_at, delivered, delivered_at, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save your letter. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ letter: data }, { status: 201 });
}
