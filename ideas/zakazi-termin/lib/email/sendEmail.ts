/**
 * SCOPE ADAPTATION: the original idea says "sends SMS reminders." Twilio
 * (SMS) costs money even at low volume; Resend's free tier (100 emails/day,
 * no card) doesn't. This idea ships email confirmations/reminders instead,
 * documented in SPEC.md and MASTER_TRACKER.md.
 *
 * Small, isolated function: calls Resend if `RESEND_API_KEY` is set, else
 * logs and no-ops. Never throws — a failed/unconfigured email must never
 * block the booking flow itself.
 */
export type SendEmailResult =
  | { sent: true }
  | { sent: false; reason: "not_configured" | "resend_error" | "network_error" };

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email:noop] to=${to} subject="${subject}" (RESEND_API_KEY not configured)`);
    return { sent: false, reason: "not_configured" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Zakazi Termin <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email:error] Resend responded ${res.status}: ${detail}`);
      return { sent: false, reason: "resend_error" };
    }

    return { sent: true };
  } catch (err) {
    console.error("[email:error] Resend request threw", err);
    return { sent: false, reason: "network_error" };
  }
}
