import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { StatTile } from "@/components/motion/StatTile";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  calculateFundBalance,
  getBuildingById,
  getFundTransactions,
  getNotices,
  getUnitContactsByUnitIds,
  getUnits,
  getVoteTalliesForBuilding,
} from "@/lib/data";
import { addFundTransaction, addNotice, addUnit, createVote } from "@/lib/actions";

const currency = new Intl.NumberFormat("sr-RS", {
  style: "currency",
  currency: "RSD",
  maximumFractionDigits: 0,
});

export default async function BuildingDashboardPage({
  params,
  searchParams,
}: {
  params: { buildingId: string };
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const building = await getBuildingById(supabase, params.buildingId);
  if (!building || building.manager_id !== user.id) notFound();

  const [units, transactions, notices, votes] = await Promise.all([
    getUnits(supabase, building.id),
    getFundTransactions(supabase, building.id),
    getNotices(supabase, building.id),
    getVoteTalliesForBuilding(supabase, building.id),
  ]);
  const contacts = await getUnitContactsByUnitIds(
    supabase,
    units.map((u) => u.id),
  );
  const balance = calculateFundBalance(transactions);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GlassPanel glow className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">{building.name}</h1>
            <p className="text-muted">{building.address}</p>
          </div>
          <Link href={`/b/${building.id}`} target="_blank">
            <Button variant="secondary">Otvori javnu oglasnu tablu &rarr;</Button>
          </Link>
        </GlassPanel>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            Stanovi ({units.length})
          </h2>
          <Card className="mb-3">
            {units.length === 0 ? (
              <EmptyState title="Još nema dodatih stanova." />
            ) : (
              <div className="flex flex-col gap-2">
                {units.map((unit) => {
                  const contact = contacts.get(unit.id);
                  return (
                    <div
                      key={unit.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <span className="font-medium">{unit.label}</span>
                        {unit.floor !== null && (
                          <span className="text-sm text-muted"> · sprat {unit.floor}</span>
                        )}
                        {contact?.tenant_name && (
                          <span className="text-sm text-muted"> · {contact.tenant_name}</span>
                        )}
                      </div>
                      <span className="text-sm text-muted">
                        {currency.format(unit.monthly_fee)}/mes.
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Dodaj stan</h3>
            <form
              action={addUnit.bind(null, building.id)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="label">Oznaka stana</label>
                <input id="label" name="label" required placeholder="npr. Stan 13" />
              </div>
              <div>
                <label htmlFor="floor">Sprat</label>
                <input id="floor" name="floor" type="number" placeholder="npr. 3" />
              </div>
              <div>
                <label htmlFor="monthly_fee">Mesečna članarina (RSD)</label>
                <input id="monthly_fee" name="monthly_fee" type="number" step="0.01" placeholder="2500" />
              </div>
              <div>
                <label htmlFor="tenant_name">Ime stanara</label>
                <input id="tenant_name" name="tenant_name" placeholder="opciono" />
              </div>
              <div>
                <label htmlFor="owner_name">Ime vlasnika</label>
                <input id="owner_name" name="owner_name" placeholder="opciono" />
              </div>
              <div>
                <label htmlFor="contact_email">Kontakt email</label>
                <input id="contact_email" name="contact_email" type="email" placeholder="opciono" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Dodaj stan</Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Fond održavanja</h2>
          <StatTile
            label="Trenutno stanje"
            value={balance}
            suffix=" RSD"
            locale="sr-RS"
            className="mb-3"
          />
          <Card className="mb-3">
            {transactions.length === 0 ? (
              <EmptyState title="Još nema transakcija." />
            ) : (
              <div className="flex flex-col gap-2">
                {transactions.map((tx) => (
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
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Unesi transakciju</h3>
            <form
              action={addFundTransaction.bind(null, building.id)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label htmlFor="description">Opis</label>
                <input id="description" name="description" required placeholder="npr. Popravka lifta" />
              </div>
              <div>
                <label htmlFor="amount">Iznos (RSD, negativan za trošak)</label>
                <input id="amount" name="amount" type="number" step="0.01" required placeholder="-12500" />
              </div>
              <div>
                <label htmlFor="occurred_on">Datum</label>
                <input id="occurred_on" name="occurred_on" type="date" />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Dodaj transakciju</Button>
              </div>
            </form>
          </Card>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Glasanja</h2>
          <div className="mb-3 flex flex-col gap-3">
            {votes.length === 0 && (
              <EmptyState title="Još nema pokrenutih glasanja." />
            )}
            {votes.map(({ vote, options, totalResponses, isOpen }, i) => (
              <AnimatedCard key={vote.id} index={i}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-medium">{vote.question}</h3>
                  <span className={`text-xs ${isOpen ? "text-accent" : "text-muted"}`}>
                    {isOpen ? "otvoreno" : "zatvoreno"}
                  </span>
                </div>
                {vote.description && (
                  <p className="mb-2 text-sm text-muted">{vote.description}</p>
                )}
                <div className="flex flex-col gap-1 text-sm">
                  {options.map((option) => {
                    const pct = totalResponses
                      ? Math.round((option.count / totalResponses) * 100)
                      : 0;
                    return (
                      <div key={option.id} className="flex items-center justify-between">
                        <span>{option.label}</span>
                        <span className="text-muted">
                          {option.count} glasova ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </AnimatedCard>
            ))}
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Pokreni novo glasanje</h3>
            <form
              action={createVote.bind(null, building.id)}
              className="grid gap-3"
            >
              <div>
                <label htmlFor="question">Pitanje</label>
                <input id="question" name="question" required placeholder="npr. Da li da postavimo kamere?" />
              </div>
              <div>
                <label htmlFor="description">Opis (opciono)</label>
                <textarea id="description" name="description" rows={2} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="option_1">Opcija 1</label>
                  <input id="option_1" name="option_1" required placeholder="Za" />
                </div>
                <div>
                  <label htmlFor="option_2">Opcija 2</label>
                  <input id="option_2" name="option_2" required placeholder="Protiv" />
                </div>
                <div>
                  <label htmlFor="option_3">Opcija 3 (opciono)</label>
                  <input id="option_3" name="option_3" />
                </div>
                <div>
                  <label htmlFor="option_4">Opcija 4 (opciono)</label>
                  <input id="option_4" name="option_4" />
                </div>
              </div>
              <div>
                <label htmlFor="days_open">Trajanje glasanja (dana)</label>
                <input id="days_open" name="days_open" type="number" defaultValue={7} min={1} />
              </div>
              <div>
                <Button type="submit">Pokreni glasanje</Button>
              </div>
            </form>
          </Card>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Oglasna tabla</h2>
          <div className="mb-3 flex flex-col gap-3">
            {notices.length === 0 && (
              <EmptyState title="Još nema objavljenih obaveštenja." />
            )}
            {notices.map((notice, i) => (
              <AnimatedCard key={notice.id} index={i}>
                <div className="mb-1 flex items-center gap-2">
                  {notice.pinned && <span className="text-xs text-accent">Zakačeno</span>}
                  <h3 className="font-medium">{notice.title}</h3>
                </div>
                <p className="text-sm text-muted">{notice.body}</p>
              </AnimatedCard>
            ))}
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Objavi obaveštenje</h3>
            <form action={addNotice.bind(null, building.id)} className="flex flex-col gap-3">
              <div>
                <label htmlFor="title">Naslov</label>
                <input id="title" name="title" required />
              </div>
              <div>
                <label htmlFor="body">Tekst</label>
                <textarea id="body" name="body" rows={3} required />
              </div>
              <label className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" name="pinned" className="w-auto" />
                Zakači na vrh
              </label>
              <div>
                <Button type="submit">Objavi</Button>
              </div>
            </form>
          </Card>
        </section>
      </main>
    </>
  );
}
