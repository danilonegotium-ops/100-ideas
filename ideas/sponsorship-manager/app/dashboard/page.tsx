import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Deal } from "@/lib/types";
import { AddDealForm } from "@/components/AddDealForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SignOutButton } from "@/components/SignOutButton";
import { StatTile } from "@/components/motion/StatTile";
import { EmptyState } from "@/components/motion/EmptyState";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: dealRows, error: dealsError } = await supabase
    .from("sponsorship_manager_deals")
    .select("*")
    .order("created_at", { ascending: false });

  const deals = (dealRows ?? []) as Deal[];
  const activeValue = deals
    .filter((deal) => deal.stage === "signed" || deal.stage === "negotiating")
    .reduce((sum, deal) => sum + (deal.deal_value ?? 0), 0);
  const paidValue = deals.filter((deal) => deal.stage === "paid").reduce((sum, deal) => sum + (deal.deal_value ?? 0), 0);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">Sponsorship pipeline</h1>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <SignOutButton />
        </div>

        {dealsError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">Couldn&apos;t load deals: {dealsError.message}</p>
          </Card>
        )}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile label="Total deals" value={deals.length} />
          <StatTile
            label="In progress value"
            value={activeValue}
            prefix="$"
            decimals={2}
            trend="negotiating + signed"
          />
          <StatTile label="Paid to date" value={paidValue} prefix="$" decimals={2} trendTone="positive" />
        </div>

        <Card className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Add a deal</h2>
          <AddDealForm />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">Pipeline</h2>
        {deals.length === 0 ? (
          <EmptyState
            title="No deals yet"
            description="Add your first sponsor deal above to start tracking it through the pipeline."
          />
        ) : (
          <KanbanBoard deals={deals} />
        )}
      </main>
    </>
  );
}
