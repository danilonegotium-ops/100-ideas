import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/server";
import {
  calculateFundBalance,
  getBuildingById,
  getFundTransactions,
  getNotices,
  getUnits,
  getVoteTalliesForBuilding,
} from "@/lib/data";
import { castVote } from "@/lib/actions";

const currency = new Intl.NumberFormat("sr-RS", {
  style: "currency",
  currency: "RSD",
  maximumFractionDigits: 0,
});

/**
 * Public digital notice board — no login required. Anyone with this link
 * (shared by the building manager) can read notices, the fund balance, and
 * cast one vote per unit on open votes. See schema.sql for the RLS
 * policies that make this safe (public SELECT on non-PII tables, a
 * unique-per-unit constraint + "still open" check on vote inserts).
 */
export default async function PublicBoardPage({
  params,
  searchParams,
}: {
  params: { buildingId: string };
  searchParams: { error?: string; voted?: string };
}) {
  const supabase = createClient();
  const building = await getBuildingById(supabase, params.buildingId);
  if (!building) notFound();

  const [units, transactions, notices, votes] = await Promise.all([
    getUnits(supabase, building.id),
    getFundTransactions(supabase, building.id),
    getNotices(supabase, building.id),
    getVoteTalliesForBuilding(supabase, building.id),
  ]);
  const balance = calculateFundBalance(transactions);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">{building.name}</h1>
        <p className="mb-6 text-muted">{building.address} · digitalna oglasna tabla</p>

        {searchParams.voted && (
          <p className="mb-4 text-sm text-accent">Vaš glas je zabeležen. Hvala!</p>
        )}
        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Obaveštenja</h2>
          {notices.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">Trenutno nema obaveštenja.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {notices.map((notice) => (
                <Card key={notice.id}>
                  <div className="mb-1 flex items-center gap-2">
                    {notice.pinned && <span className="text-xs text-accent">Zakačeno</span>}
                    <h3 className="font-medium">{notice.title}</h3>
                  </div>
                  <p className="text-sm text-muted">{notice.body}</p>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            Fond održavanja — stanje: {currency.format(balance)}
          </h2>
          <Card>
            {transactions.length === 0 ? (
              <p className="text-sm text-muted">Još nema transakcija.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.slice(0, 10).map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-2 border-b border-border pb-2 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <span>{tx.description}</span>
                      <span className="ml-2 text-muted">{tx.occurred_on}</span>
                    </div>
                    <span className={Number(tx.amount) < 0 ? "text-danger" : "text-accent"}>
                      {currency.format(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Glasanja</h2>
          {votes.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">Trenutno nema glasanja.</p>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {votes.map(({ vote, options, totalResponses, isOpen }) => (
                <Card key={vote.id}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h3 className="font-medium">{vote.question}</h3>
                    <span className={`text-xs ${isOpen ? "text-accent" : "text-muted"}`}>
                      {isOpen
                        ? `otvoreno do ${new Date(vote.closes_at).toLocaleDateString("sr-RS")}`
                        : "zatvoreno"}
                    </span>
                  </div>
                  {vote.description && (
                    <p className="mb-3 text-sm text-muted">{vote.description}</p>
                  )}

                  <div className="mb-3 flex flex-col gap-1 text-sm">
                    {options.map((option) => {
                      const pct = totalResponses
                        ? Math.round((option.count / totalResponses) * 100)
                        : 0;
                      return (
                        <div key={option.id} className="flex items-center justify-between">
                          <span>{option.label}</span>
                          <span className="text-muted">
                            {option.count} ({pct}%)
                          </span>
                        </div>
                      );
                    })}
                    <span className="text-xs text-muted">
                      {totalResponses} od {units.length} stanova glasalo
                    </span>
                  </div>

                  {isOpen && units.length > 0 && (
                    <form
                      action={castVote.bind(null, building.id, vote.id)}
                      className="grid gap-2 border-t border-border pt-3 sm:grid-cols-3"
                    >
                      <div>
                        <label htmlFor={`unit-${vote.id}`}>Vaš stan</label>
                        <select id={`unit-${vote.id}`} name="unit_id" required defaultValue="">
                          <option value="" disabled>
                            Izaberite stan
                          </option>
                          {units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`option-${vote.id}`}>Vaš glas</label>
                        <select id={`option-${vote.id}`} name="option_id" required defaultValue="">
                          <option value="" disabled>
                            Izaberite opciju
                          </option>
                          {options.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <Button type="submit" className="w-full">
                          Glasaj
                        </Button>
                      </div>
                    </form>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
