import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { StatusBadge } from "@/components/StatusBadge";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import { addServiceEvent, deleteServiceEvent, deleteSystem } from "../../../actions";
import { getSystemStatus } from "@/lib/status";
import type { Home, HomeSystem, ServiceEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

function money(cost: number | null): string {
  if (cost === null) return "";
  return ` · €${cost.toFixed(2)}`;
}

export default async function SystemDetailPage({
  params,
  searchParams,
}: {
  params: { homeId: string; systemId: string };
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) {
    redirect(
      `/login?next=/dashboard/${params.homeId}/systems/${params.systemId}`,
    );
  }

  const supabase = createClient();

  const { data: home } = await supabase
    .from("home_maintenance_log_homes")
    .select("*")
    .eq("id", params.homeId)
    .maybeSingle();
  if (!home) notFound();
  const typedHome = home as Home;

  const { data: system } = await supabase
    .from("home_maintenance_log_systems")
    .select("*")
    .eq("id", params.systemId)
    .maybeSingle();
  if (!system) notFound();
  const typedSystem = system as HomeSystem;

  // The system genuinely belongs to a different home than the one in the
  // URL (still the same user, since RLS already scoped both fetches to
  // them) — self-heal to the correct URL rather than 404ing.
  if (typedSystem.home_id !== typedHome.id) {
    redirect(`/dashboard/${typedSystem.home_id}/systems/${typedSystem.id}`);
  }

  const { data: eventsData } = await supabase
    .from("home_maintenance_log_service_events")
    .select("*")
    .eq("system_id", typedSystem.id)
    .order("service_date", { ascending: false });
  const events = (eventsData ?? []) as ServiceEvent[];

  const latest = events[0] ?? null;
  const status = getSystemStatus(latest?.next_service_due ?? null);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <Link
          href={`/dashboard/${typedHome.id}`}
          className="mb-4 inline-block text-sm text-muted no-underline hover:text-fg"
        >
          &larr; {typedHome.name}
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">{typedSystem.name}</h1>
            <p className="text-muted">
              {typedSystem.category}
              {typedSystem.install_date && ` · installed ${typedSystem.install_date}`}
            </p>
          </div>
          <StatusBadge status={status} />
        </div>

        {typedSystem.notes && (
          <Card className="mb-6">
            <p className="text-sm text-muted">{typedSystem.notes}</p>
          </Card>
        )}

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <h2 className="mb-3 text-sm font-semibold">Service history</h2>
        <div className="mb-6 flex flex-col gap-3">
          {events.length === 0 && (
            <EmptyState
              title="No service events logged yet"
              description="Add the first one below."
            />
          )}

          {events.map((event, i) => (
            <AnimatedCard key={event.id} index={i}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-fg">
                    {event.service_date}
                    {money(event.cost)}
                  </p>
                  <p className="text-sm text-muted">{event.description}</p>
                  {event.next_service_due && (
                    <p className="mt-1 text-xs text-muted">
                      Next due: {event.next_service_due}
                    </p>
                  )}
                </div>
                <form action={deleteServiceEvent}>
                  <input type="hidden" name="homeId" value={typedHome.id} />
                  <input type="hidden" name="systemId" value={typedSystem.id} />
                  <input type="hidden" name="eventId" value={event.id} />
                  <Button variant="secondary" type="submit">
                    Delete
                  </Button>
                </form>
              </div>
            </AnimatedCard>
          ))}
        </div>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold">Log a service event</h2>
          <form
            action={addServiceEvent}
            className="flex flex-col gap-3 sm:max-w-sm"
          >
            <input type="hidden" name="homeId" value={typedHome.id} />
            <input type="hidden" name="systemId" value={typedSystem.id} />
            <div>
              <label htmlFor="service_date">Service date</label>
              <input
                id="service_date"
                name="service_date"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div>
              <label htmlFor="description">What was done</label>
              <textarea
                id="description"
                name="description"
                rows={2}
                required
                maxLength={1000}
                placeholder="e.g. Annual boiler inspection and filter replacement"
              />
            </div>
            <div>
              <label htmlFor="cost">Cost in EUR (optional)</label>
              <input
                id="cost"
                name="cost"
                type="number"
                min={0}
                max={1000000}
                step="0.01"
                placeholder="120.00"
              />
            </div>
            <div>
              <label htmlFor="next_service_due">Next service due (optional)</label>
              <input id="next_service_due" name="next_service_due" type="date" />
            </div>
            <Button type="submit">Log service</Button>
          </form>
        </Card>

        <form action={deleteSystem}>
          <input type="hidden" name="homeId" value={typedHome.id} />
          <input type="hidden" name="systemId" value={typedSystem.id} />
          <Button variant="danger" type="submit">
            Delete this system
          </Button>
        </form>
      </main>
    </>
  );
}
