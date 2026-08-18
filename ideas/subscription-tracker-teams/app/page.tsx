import { Nav } from "@/components/Nav";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionsDashboard } from "@/components/subs/SubscriptionsDashboard";
import type { SubscriptionRow } from "@/lib/subscriptions";

export default async function Home() {
  const supabase = createClient();
  const { data: subscriptions } = await supabase
    .from("subscription_tracker_teams_subscriptions")
    .select("id, tool_name, cost_cents, billing_cycle, owner_name, category, url, last_used_date, notes")
    .order("cost_cents", { ascending: false });

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">Subscription Tracker</h1>
        <p className="mb-6 text-muted">
          Every SaaS tool your team pays for, in one place — with unused
          &quot;zombie&quot; accounts flagged automatically.
        </p>
        <SubscriptionsDashboard initialSubscriptions={(subscriptions ?? []) as SubscriptionRow[]} />
      </main>
    </>
  );
}
