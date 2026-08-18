import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { escapeHtml } from "@/lib/dates";

export const dynamic = "force-dynamic";

type PendingLetter = {
  id: string;
  user_email: string;
  title: string | null;
  body: string;
};

/**
 * Daily delivery sweep — see `vercel.json` for the Cron schedule that hits
 * this route. Also safe to call manually/repeatedly (e.g. a smoke test
 * once Supabase is live), which is exactly the property that matters here.
 *
 * IDEMPOTENCY (read this before changing anything below):
 *
 * The single UPDATE below atomically "claims" every letter that is both
 * still `delivered = false` AND past its `deliver_at` — in one SQL
 * statement, BEFORE any email is sent. Postgres evaluates `UPDATE ... SET
 * delivered = true WHERE delivered = false AND deliver_at <= now()` as one
 * atomic operation, so:
 *
 *   - Two overlapping runs (accidental duplicate cron trigger, a manual
 *     re-run while the scheduled one is still in flight, Vercel retrying a
 *     slow invocation, etc.) can never both claim the same row: whichever
 *     transaction's UPDATE commits first flips `delivered` to true, and the
 *     other's `WHERE delivered = false` then matches zero rows for that
 *     letter.
 *   - Re-running this route on a normal day (nothing new due) is a no-op —
 *     the WHERE clause matches nothing already delivered.
 *
 * This means a letter can never be *claimed* twice, which means it can
 * never be *emailed* twice as a result of this route re-running — the
 * failure mode this design exists to prevent (a 10-year letter landing in
 * someone's inbox more than once).
 *
 * Explicit tradeoff (documented for whoever verifies this once Supabase is
 * live — see MASTER_TRACKER.md): the claim happens BEFORE the email send,
 * not after. If `sendLetterEmail` throws (Resend down, network blip,
 * timeout, etc.) for an already-claimed row, that letter stays marked
 * `delivered = true` — we record the failure in `delivery_error` for
 * manual follow-up rather than losing it silently, but we deliberately do
 * NOT flip `delivered` back to false and retry automatically. Reverting on
 * a failed *response* is unsafe: email providers can time out or drop the
 * response on the client side after the send already succeeded server-side,
 * and auto-retrying in that scenario would cause the exact double-send
 * this claim-first design exists to prevent. In short: this design
 * guarantees "at most once" delivery, not "exactly once" — a very rare
 * Resend-fails-after-claim letter needs a human to check `delivery_error`
 * and resend by hand. That's the correct tradeoff for a letter someone
 * waited 5-10 years for.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY isn't configured yet." },
      { status: 503 },
    );
  }

  const nowIso = new Date().toISOString();

  const { data: claimed, error: claimError } = await supabase
    .from("digital_time_capsule_letters")
    .update({ delivered: true, delivered_at: nowIso })
    .eq("delivered", false)
    .lte("deliver_at", nowIso)
    .select("id, user_email, title, body");

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  const letters = (claimed ?? []) as PendingLetter[];

  const results = await Promise.all(
    letters.map(async (letter) => {
      try {
        await sendLetterEmail(letter);
        return { id: letter.id, sent: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown send error";
        // Best-effort — the letter stays `delivered = true` regardless
        // (see the idempotency note above), this is just so a human can
        // find and manually resend it.
        await supabase
          .from("digital_time_capsule_letters")
          .update({ delivery_error: message })
          .eq("id", letter.id);
        return { id: letter.id, sent: false, error: message };
      }
    }),
  );

  return NextResponse.json({ claimed: letters.length, results });
}

async function sendLetterEmail(letter: PendingLetter) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "capsule@resend.dev";
  const subject = letter.title
    ? `A letter from your past self: ${letter.title}`
    : "A letter from your past self";

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <p>You wrote this to yourself a while ago. It's time.</p>
      <blockquote style="border-left: 3px solid #ccc; padding-left: 1rem; white-space: pre-wrap;">${escapeHtml(
        letter.body,
      )}</blockquote>
      <p style="color: #888; font-size: 0.85rem;">Sent by Digital Time Capsule.</p>
    </div>
  `;

  if (!apiKey) {
    // No Resend key configured — log instead of failing, so the claim
    // (and thus the idempotency guarantee above) is still exercised
    // correctly in dev/local/undeployed runs.
    console.log(
      `[digital-time-capsule] RESEND_API_KEY not set — would send letter ${letter.id} to ${letter.user_email}`,
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: letter.user_email,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${text.slice(0, 300)}`);
  }
}
