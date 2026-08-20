import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import { addSystem, deleteHome } from "../actions";
import { getSystemStatus, latestEventBySystem } from "@/lib/status";
import { SYSTEM_CATEGORIES } from "@/lib/categories";
import type { Home, HomeSystem, ServiceEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function HomeDetailPage({
  params,
  searchParams,
}: {
  params: { homeId: string };
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect(`/login?next=/dashboard/${params.homeId}`);

  const supabase = createClient();

  const { data: home } = await supabase
    .from("home_maintenance_log_homes")
    .select("*")
    .eq("id", params.homeId)
    .maybeSingle();

  // RLS already restricts rows to the current user, so a `null` result here
  // means either the home doesn't exist or isn't owned by this user —
  // either way, a 404 is the right (and non-leaky) response.
  if (!home) notFound();
  const typedHome = home as Home;

  const { data: systemsData } = await supabase
    .from("home_maintenance_log_systems")
    .select("*")
    .eq("home_id", params.homeId)
    .order("created_at", { ascending: true });
  const systems = (systemsData ?? []) as HomeSystem[];

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

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <Link href="/dashboard" className="mb-4 inline-block text-sm text-muted no-underline hover:text-fg">
          &larr; all homes
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">{typedHome.name}</h1>
            {typedHome.address && <p className="text-muted">{typedHome.address}</p>}
          </div>
          <form action={deleteHome}>
            <input type="hidden" name="homeId" value={typedHome.id} />
            <Button variant="danger" type="submit">
              Delete home
            </Button>
          </form>
        </div>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <div className="mb-6 flex flex-col gap-3">
          {systems.length === 0 && (
            <EmptyState
              title="No systems yet"
              description="Add your boiler, AC, water heater, or any appliance below to start tracking service history."
            />
          )}

          {systems.map((system, i) => {
            const latest = latestBySystem.get(system.id);
            const status = getSystemStatus(latest?.next_service_due ?? null);
            return (
              <Link
                key={system.id}
                href={`/dashboard/${typedHome.id}/systems/${system.id}`}
                className="no-underline"
              >
                <AnimatedCard index={i} className="transition-colors hover:border-accent">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="text-base font-semibold text-fg">{system.name}</h2>
                      <p className="text-xs text-muted">{system.category}</p>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                  <p className="mt-2 text-sm text-muted">
                    {latest
                      ? `Last serviced ${latest.service_date}${
                          latest.next_service_due
                            ? ` · next due ${latest.next_service_due}`
                            : ""
                        }`
                      : "Never serviced yet"}
                  </p>
                </AnimatedCard>
              </Link>
            );
          })}
        </div>

        <Card>
          <h2 className="mb-3 text-sm font-semibold">Add a system</h2>
          <form action={addSystem} className="flex flex-col gap-3 sm:max-w-sm">
            <input type="hidden" name="homeId" value={typedHome.id} />
            <div>
              <label htmlFor="name">Name</label>
              <input
                id="name"
                name="name"
                type="text"
                required
                maxLength={100}
                placeholder="e.g. Basement furnace"
              />
            </div>
            <div>
              <label htmlFor="category">Category</label>
              <select id="category" name="category" required defaultValue="">
                <option value="" disabled>
                  Choose a category
                </option>
                {SYSTEM_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="install_date">Install date (optional)</label>
              <input id="install_date" name="install_date" type="date" />
            </div>
            <div>
              <label htmlFor="notes">Notes (optional)</label>
              <textarea id="notes" name="notes" rows={2} maxLength={1000} />
            </div>
            <Button type="submit">Add system</Button>
          </form>
        </Card>
      </main>
    </>
  );
}
