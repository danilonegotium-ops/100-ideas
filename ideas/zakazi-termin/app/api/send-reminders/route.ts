import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRoleClient";
import { sendEmail } from "@/lib/email/sendEmail";

// This handler doesn't call any Next.js "dynamic API" (no cookies()/headers()
// from next/headers, no dynamic route segment) — it only reads the raw Web
// Request object, which Next's static analysis doesn't treat as a dynamic
// signal. Without this, `next build` tries to statically render/execute the
// route ONCE at build time (to cache the response), which throws because
// Supabase env vars aren't configured yet. `force-dynamic` makes this run
// fresh on every real request instead, which is what a cron-triggered
// endpoint needs anyway (it must re-check the database each time, not serve
// a cached response). Learned by hitting the actual build failure — the
// template's "Route Handlers are never executed during next build" note
// only holds once a route calls cookies()/headers() itself.
export const dynamic = "force-dynamic";

/**
 * Meant to be hit periodically by an external scheduler (Vercel Cron / a
 * GitHub Actions cron job) once this idea is deployed — NOT wired up to an
 * actual cron trigger yet in this pass (no live deploy exists to point one
 * at). Finds confirmed bookings starting within the next 24h that haven't
 * had a reminder sent, emails each one, and marks `reminder_sent_at`.
 * Idempotent: safe to call repeatedly, already-reminded bookings are
 * skipped.
 *
 * Route Handlers are never executed during `next build`, only at real
 * request time, so this is safe with no env vars configured (it'll just
 * throw a normal runtime error if hit before Supabase credentials exist,
 * same as any other DB-touching route).
 *
 * Optional light protection: if `CRON_SECRET` is set, requests must pass it
 * as `?secret=...` or an `Authorization: Bearer ...` header. If unset
 * (default), the endpoint is open — fine for this sprint's undeployed
 * state, but set `CRON_SECRET` before wiring a real cron job at it.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const url = new URL(request.url);
    const provided =
      url.searchParams.get("secret") ??
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (provided !== cronSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createServiceRoleClient();
  const windowEndMs = Date.now() + 24 * 60 * 60 * 1000;

  // PostgREST's embedded-resource filters only narrow which rows of a
  // to-many embed are returned — they don't filter the parent row by an
  // embedded to-one resource's column. So the "starts within 24h" check is
  // done here in application code after fetching, not pushed into the
  // query, to avoid relying on filter semantics that can't be verified
  // without a live project.
  const { data: bookings, error } = await supabase
    .from("zakazi_termin_bookings")
    .select(
      "id, customer_name, customer_email, slot_id, shop_id, zakazi_termin_slots(starts_at, service_name), zakazi_termin_shops(name)",
    )
    .eq("status", "confirmed")
    .is("reminder_sent_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  for (const booking of bookings ?? []) {
    const slot = Array.isArray(booking.zakazi_termin_slots)
      ? booking.zakazi_termin_slots[0]
      : booking.zakazi_termin_slots;
    const shop = Array.isArray(booking.zakazi_termin_shops)
      ? booking.zakazi_termin_shops[0]
      : booking.zakazi_termin_shops;
    if (!slot) continue;
    if (new Date(slot.starts_at).getTime() > windowEndMs) continue;

    const result = await sendEmail({
      to: booking.customer_email,
      subject: `Podsetnik: termin sutra — ${shop?.name ?? "Zakazi Termin"}`,
      html: `<p>Zdravo ${booking.customer_name},</p><p>Podsećamo vas na termin (${slot.service_name}) zakazan za ${new Date(slot.starts_at).toLocaleString("sr-RS")}.</p>`,
    });

    if (result.sent) {
      sent += 1;
      await supabase
        .from("zakazi_termin_bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", booking.id);
    }
  }

  return NextResponse.json({ checked: bookings?.length ?? 0, sent });
}
