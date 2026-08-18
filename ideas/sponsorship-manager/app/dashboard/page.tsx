import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Deal } from "@/lib/types";
import { AddDealForm } from "@/components/AddDealForm";
import { KanbanBoard } from "@/components/KanbanBoard";
import { SignOutButton } from "@/components/SignOutButton";

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
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted">Total deals</p>
            <p className="mt-1 text-xl font-semibold">{deals.length}</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted">In progress value</p>
            <p className="mt-1 text-xl font-semibold">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(activeValue)}
            </p>
            <p className="text-xs text-muted">negotiating + signed</p>
          </Card>
          <Card>
            <p className="text-xs uppercase tracking-wide text-muted">Paid to date</p>
            <p className="mt-1 text-xl font-semibold">
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(paidValue)}
            </p>
          </Card>
        </div>

        <Card className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Add a deal</h2>
          <AddDealForm />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">Pipeline</h2>
        {deals.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No deals yet — add your first one above.</p>
          </Card>
        ) : (
          <KanbanBoard deals={deals} />
        )}
      </main>
    </>
  );
}
