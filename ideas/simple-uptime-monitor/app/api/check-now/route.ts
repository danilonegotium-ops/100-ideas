import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";
import { checkUrl, buildAlertEmail } from "@/lib/uptime";
import { sendEmail } from "@/lib/resend";

/**
 * Authenticated "check now" — lets a logged-in user trigger an immediate
 * check of their own monitors without waiting for the next Vercel Cron
 * sweep (app/api/cron/check/route.ts). Uses the user's own session (RLS
 * scopes everything to their own rows), not the service-role key, so it
 * only ever touches monitors the caller owns — no admin API needed since
 * the email address is already on the session (`user.email`).
 */
export async function POST() {
  const user = await getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const supabase = createClient();
  const { data: monitors, error } = await supabase
    .from("simple_uptime_monitor_monitors")
    .select("id, url, label, last_status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const monitor of monitors ?? []) {
    const result = await checkUrl(monitor.url);

    await supabase.from("simple_uptime_monitor_checks").insert({
      monitor_id: monitor.id,
      status: result.status,
      status_code: result.statusCode,
      response_ms: result.responseMs,
    });

    const previousStatus = monitor.last_status as "unknown" | "up" | "down";
    const transitioned =
      previousStatus !== "unknown" && previousStatus !== result.status;

    await supabase
      .from("simple_uptime_monitor_monitors")
      .update({
        last_status: result.status,
        last_checked_at: new Date().toISOString(),
      })
      .eq("id", monitor.id);

    let emailed = false;
    if (transitioned) {
      const { subject, html } = buildAlertEmail({
        label: monitor.label,
        url: monitor.url,
        newStatus: result.status,
      });
      const sendResult = await sendEmail({ to: user.email, subject, html });
      emailed = sendResult.sent;
    }

    results.push({
      monitorId: monitor.id,
      status: result.status,
      transitioned,
      emailed,
    });
  }

  return NextResponse.json({ checked: results.length, results });
}
