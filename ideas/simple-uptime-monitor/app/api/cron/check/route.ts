import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkUrl, buildAlertEmail } from "@/lib/uptime";
import { sendEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron target (see vercel.json — scheduled every 5 minutes).
 * Route Handlers are never executed during `next build`, only at real
 * request time, so this is safe even with no Supabase/Resend credentials
 * configured yet.
 *
 * Sweeps every monitored URL across every user (via the service-role
 * client, which bypasses RLS), logs a check row, and — only on an actual
 * up→down or down→up transition, never on every check — emails the
 * monitor's owner. "unknown" (a monitor's initial state, before its first
 * ever check) never triggers an email; it just establishes the baseline.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } else {
    console.warn(
      "[simple-uptime-monitor] CRON_SECRET is not set — /api/cron/check is unauthenticated. Set CRON_SECRET before deploying.",
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Supabase not configured" },
      { status: 500 },
    );
  }

  const { data: monitors, error } = await admin
    .from("simple_uptime_monitor_monitors")
    .select("id, user_id, url, label, last_status");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const monitor of monitors ?? []) {
    try {
      const result = await checkUrl(monitor.url);

      await admin.from("simple_uptime_monitor_checks").insert({
        monitor_id: monitor.id,
        status: result.status,
        status_code: result.statusCode,
        response_ms: result.responseMs,
      });

      const previousStatus = monitor.last_status as
        | "unknown"
        | "up"
        | "down";
      const transitioned =
        previousStatus !== "unknown" && previousStatus !== result.status;

      await admin
        .from("simple_uptime_monitor_monitors")
        .update({
          last_status: result.status,
          last_checked_at: new Date().toISOString(),
        })
        .eq("id", monitor.id);

      let emailed = false;
      if (transitioned) {
        const { data: userData } = await admin.auth.admin.getUserById(
          monitor.user_id,
        );
        const email = userData?.user?.email;
        if (email) {
          const { subject, html } = buildAlertEmail({
            label: monitor.label,
            url: monitor.url,
            newStatus: result.status,
          });
          const sendResult = await sendEmail({ to: email, subject, html });
          emailed = sendResult.sent;
        }
      }

      results.push({
        monitorId: monitor.id,
        status: result.status,
        transitioned,
        emailed,
      });
    } catch (err) {
      results.push({
        monitorId: monitor.id,
        error: err instanceof Error ? err.message : "check failed",
      });
    }
  }

  return NextResponse.json({ checked: results.length, results });
}
