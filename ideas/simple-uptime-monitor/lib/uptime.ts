export type CheckStatus = "up" | "down";

export interface CheckResult {
  status: CheckStatus;
  statusCode: number | null;
  responseMs: number;
}

const TIMEOUT_MS = 10_000;

/**
 * Checks a single URL. "up" = the request completed with an HTTP status in
 * the 200–399 range (the server responded, including redirects fetch has
 * already followed to their final destination). "down" = a 4xx/5xx
 * response, a network error, or a timeout. This is a simple, documented
 * definition — a real uptime tool might treat a 404 as "up" (server is
 * reachable) rather than "down"; keeping it strict here so a broken deploy
 * (which often 404s or 500s) actually triggers an alert.
 */
export async function checkUrl(url: string): Promise<CheckResult> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "SimpleUptimeMonitor/1.0 (+vercel-cron)" },
    });
    const responseMs = Date.now() - started;
    return {
      status: res.status < 400 ? "up" : "down",
      statusCode: res.status,
      responseMs,
    };
  } catch {
    return {
      status: "down",
      statusCode: null,
      responseMs: Date.now() - started,
    };
  }
}

export function buildAlertEmail(params: {
  label: string | null;
  url: string;
  newStatus: CheckStatus;
}): { subject: string; html: string } {
  const name = params.label || params.url;
  if (params.newStatus === "down") {
    return {
      subject: `🔴 ${name} is down`,
      html: `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(
        params.url,
      )}) just went <strong>down</strong>.</p><p>We'll email you again as soon as it's back up.</p>`,
    };
  }
  return {
    subject: `🟢 ${name} is back up`,
    html: `<p><strong>${escapeHtml(name)}</strong> (${escapeHtml(
      params.url,
    )}) is back <strong>up</strong>.</p>`,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
