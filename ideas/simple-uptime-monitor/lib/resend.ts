/**
 * Minimal Resend (resend.com) email sender — a plain `fetch` call against
 * their REST API rather than the `resend` npm SDK, to keep this idea's
 * dependency count down (the SDK is a thin wrapper around the same POST
 * request anyway). Docs: https://resend.com/docs/api-reference/emails/send-email
 *
 * Gracefully no-ops (logs instead of sending) when RESEND_API_KEY isn't
 * configured yet, per the project-wide convention documented in
 * docs/PLAN.md — email-sending ideas must not hard-fail just because the
 * optional Resend key hasn't been set up.
 */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM_EMAIL ||
    "Simple Uptime Monitor <onboarding@resend.dev>";

  if (!apiKey) {
    console.log(
      `[simple-uptime-monitor] RESEND_API_KEY not set — skipping email. to=${to} subject="${subject}"`,
    );
    return { sent: false, error: "RESEND_API_KEY not configured" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      `[simple-uptime-monitor] Resend send failed: ${res.status} ${body}`,
    );
    return { sent: false, error: `Resend ${res.status}: ${body}` };
  }

  return { sent: true };
}
