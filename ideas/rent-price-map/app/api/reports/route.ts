import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateReportInput } from "@/lib/validation";

/**
 * Anonymous rent report submission. Deliberately a Route Handler (not a
 * direct client-side `supabase.insert()`) so the rent-value/coordinate
 * sanity checks in `lib/validation.ts` run server-side and can't be
 * bypassed by calling Supabase directly with different values — the RLS
 * policy on `rent_price_map_reports` only controls *who* can insert
 * (anyone), not *what* they insert; these checks (plus the table's own
 * CHECK constraints, a second independent backstop) control that.
 *
 * No IP address, session, or any other identifying value is read, logged,
 * or stored anywhere in this handler — that's what keeps submissions
 * genuinely anonymous per the idea's own framing. A real anti-spam layer
 * (CAPTCHA, IP rate limiting) is out of scope for this MVP; see SPEC.md.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateReportInput(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("rent_price_map_reports")
    .insert({
      city: result.value.city,
      neighborhood: result.value.neighborhood,
      rent_eur: result.value.rent_eur,
      rooms: result.value.rooms,
      size_m2: result.value.size_m2,
      note: result.value.note,
      lat: result.value.lat,
      lng: result.value.lng,
    })
    .select("id, city, neighborhood, rent_eur, rooms, size_m2, note, lat, lng, created_at")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Could not save that report. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ report: data }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
