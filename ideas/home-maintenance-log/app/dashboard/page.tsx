import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { createClient, getUser } from "@/lib/supabase/server";
import { addHome } from "./actions";
import {
  daysUntil,
  getSystemStatus,
  latestEventBySystem,
  worstStatus,
} from "@/lib/status";
import type { Home, HomeSystem, ServiceEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");

  const supabase = createClient();

  const { data: homesData } = await supabase
    .from("home_maintenance_log_homes")
    .select("*")
    .order("created_at", { ascending: true });
  const homes = (homesData ?? []) as Home[];

  const homeIds = homes.map((h) => h.id);

  let systems: HomeSystem[] = [];
  if (homeIds.length > 0) {
    const { data } = await supabase
      .from("home_maintenance_log_systems")
      .select("*")
      .in("home_id", homeIds);
    systems = (data ?? []) as HomeSystem[];
  }

  const systemIds = systems.map((s) => s.id);
  let events: ServiceEvent[] = [];
  if (systemIds.length > 0) {
    const { data } = await supabase
      .from("home_maintenance_log_service_events")
      .select("*")
      .in("system_id", systemIds);
    events = (data ?? []) as ServiceEvent[];
  }

  const latestBySystem = latestEventBySystem(events);
  const homeById = new Map(homes.map((h) => [h.id, h]));

  const needsAttention = systems
    .map((system) => {
      const latest = latestBySystem.get(system.id);
      const status = getSystemStatus(latest?.next_service_due ?? null);
      return { system, latest, status };
    })
    .filter((s) => s.status === "overdue" || s.status === "due-soon")
    .sort((a, b) => {
      // Overdue first, then soonest due date.
      if (a.status !== b.status) return a.status === "overdue" ? -1 : 1;
      const aDue = a.latest?.next_service_due ?? "";
      const bDue = b.latest?.next_service_due ?? "";
      return aDue.localeCompare(bDue);
    });

  const systemsByHome = new Map<string, HomeSystem[]>();
  for (const system of systems) {
    const list = systemsByHome.get(system.home_id) ?? [];
    list.push(system);
    systemsByHome.set(system.home_id, list);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Your homes</h1>
        <p className="mb-6 text-muted">
          Signed in as <span className="text-fg">{user.email}</span>
        </p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        {needsAttention.length > 0 && (
          // Inline style (not a Tailwind class) so this reliably overrides
          // Card's default border color regardless of Tailwind's generated
          // CSS ordering — the shared `cn()` helper doesn't dedupe
          // conflicting utility classes the way `tailwind-merge` would.
          <Card className="mb-6" style={{ borderColor: "var(--danger)" }}>
            <h2 className="mb-3 text-sm font-semibold">Needs attention</h2>
            <ul className="flex flex-col gap-2">
              {needsAttention.map(({ system, latest, status }) => {
                const home = homeById.get(system.home_id);
                const due = latest?.next_service_due;
                return (
                  <li key={system.id}>
                    <Link
                      href={`/dashboard/${system.home_id}/systems/${system.id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-brand border border-border px-3 py-2 no-underline transition-colors hover:border-accent"
                    >
                      <span className="text-sm text-fg">
                        {home?.name ? `${home.name} — ` : ""}
                        {system.name}
                        {due && (
                          <span className="text-muted">
                            {" "}
                            &middot;{" "}
                            {status === "overdue"
                              ? `${Math.abs(daysUntil(due))} day(s) overdue`
                              : `due in ${daysUntil(due)} day(s)`}
                          </span>
                        )}
                      </span>
                      <StatusBadge status={status} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Card>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {homes.map((home) => {
            const homeSystems = systemsByHome.get(home.id) ?? [];
            const statuses = homeSystems.map(
              (s) => getSystemStatus(latestBySystem.get(s.id)?.next_service_due ?? null),
            );
            const overall = worstStatus(statuses);

            return (
              <Link key={home.id} href={`/dashboard/${home.id}`} className="no-underline">
                <Card className="h-full transition-colors hover:border-accent">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <h2 className="text-base font-semibold text-fg">{home.name}</h2>
                    {statuses.length > 0 && <StatusBadge status={overall} />}
                  </div>
                  {home.address && (
                    <p className="mb-2 text-sm text-muted">{home.address}</p>
                  )}
                  <p className="text-xs text-muted">
                    {homeSystems.length}{" "}
                    {homeSystems.length === 1 ? "system" : "systems"} tracked
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">Add a home</h2>
          <form action={addHome} className="flex flex-col gap-3 sm:max-w-sm">
            <div>
              <label htmlFor="name">Home name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Main house, Lake cabin"
              />
            </div>
            <div>
              <label htmlFor="address">Address (optional)</label>
              <input
                id="address"
                name="address"
                type="text"
                maxLength={200}
                placeholder="123 Main St"
              />
            </div>
            <Button type="submit">Add home</Button>
          </form>
        </Card>
      </main>
    </>
  );
}
