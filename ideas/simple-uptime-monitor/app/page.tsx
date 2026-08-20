import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Dashboard } from "@/components/Dashboard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { StatTile } from "@/components/motion/StatTile";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Monitor, CheckLogRow } from "@/lib/types";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-2 text-2xl font-semibold">
            Simple Uptime Monitor
          </h1>
          <p className="mb-6 text-muted">
            Emails you the second your website goes down. Add a URL, we
            check it every few minutes, and alert you only on an actual
            up→down or down→up change — not on every check.
          </p>
          <GlassPanel glow>
            <p className="mb-4 text-sm text-muted">
              Log in with a magic link to add and manage your monitors.
            </p>
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          </GlassPanel>
        </main>
      </>
    );
  }

  const supabase = createClient();
  const { data: monitorsData, error: monitorsError } = await supabase
    .from("simple_uptime_monitor_monitors")
    .select("id, url, label, last_status, last_checked_at, created_at")
    .order("created_at", { ascending: false });

  const monitors: Monitor[] = monitorsError ? [] : (monitorsData ?? []);
  const upCount = monitors.filter((m) => m.last_status === "up").length;
  const downCount = monitors.filter((m) => m.last_status === "down").length;

  let checks: CheckLogRow[] = [];
  if (monitors.length > 0) {
    const { data: checksData } = await supabase
      .from("simple_uptime_monitor_checks")
      .select("id, monitor_id, status, status_code, response_ms, checked_at")
      .in(
        "monitor_id",
        monitors.map((m) => m.id),
      )
      .order("checked_at", { ascending: false })
      .limit(200);
    checks = checksData ?? [];
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          Simple Uptime Monitor
        </h1>
        <p className="mb-6 text-muted">
          Logged in as <strong className="text-fg">{user.email}</strong>.
        </p>
        {monitorsError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              Couldn&apos;t load monitors: {monitorsError.message}
            </p>
          </Card>
        )}
        {monitors.length > 0 && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Monitors" value={monitors.length} />
            <StatTile
              label="Up"
              value={upCount}
              trend={downCount > 0 ? `${downCount} down` : "All healthy"}
              trendTone={downCount > 0 ? "negative" : "positive"}
            />
            <StatTile label="Down" value={downCount} trendTone="negative" />
          </div>
        )}
        <Dashboard initialMonitors={monitors} initialChecks={checks} />
      </main>
    </>
  );
}
