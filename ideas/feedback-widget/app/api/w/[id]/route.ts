import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CORS_HEADERS } from "@/lib/feedback/cors";

/**
 * Public, anonymous — the embed script (served from /widget.js) fetches
 * this to get the widget's real question text. No auth: this is meant to
 * be readable from any site that embeds the snippet.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("feedback_widget_widgets")
    .select("id, question")
    .eq("id", params.id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: "Widget not found." },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  return NextResponse.json(data, { headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
