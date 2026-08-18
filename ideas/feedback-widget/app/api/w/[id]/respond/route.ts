import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CORS_HEADERS } from "@/lib/feedback/cors";

/**
 * Public, anonymous — the embed script POSTs a yes/no answer here from
 * whatever third-party site it's running on. Sends `application/json`,
 * which is a non-"simple" content type, so browsers preflight this with
 * an OPTIONS request first (handled below).
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.answer !== "boolean") {
    return NextResponse.json(
      { error: "Missing boolean 'answer'." },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const pageUrl =
    typeof body.pageUrl === "string" ? body.pageUrl.slice(0, 2048) : null;

  const supabase = createClient();
  const { error } = await supabase.from("feedback_widget_responses").insert({
    widget_id: params.id,
    answer: body.answer,
    page_url: pageUrl,
  });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
