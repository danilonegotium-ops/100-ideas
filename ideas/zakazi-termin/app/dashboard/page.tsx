import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import { getOwnerShops } from "@/lib/data";
import { createShop } from "@/lib/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const shops = await getOwnerShops(supabase, user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Vaši saloni</h1>
        <p className="mb-6 text-muted">
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        {shops.length === 0 ? (
          <EmptyState className="mb-6" title="Još uvek nemate nijedan salon." />
        ) : (
          <div className="mb-6 grid gap-3">
            {shops.map((shop, i) => (
              <Link key={shop.id} href={`/dashboard/${shop.id}`}>
                <AnimatedCard index={i} className="transition-colors hover:border-accent">
                  <h2 className="font-semibold">{shop.name}</h2>
                  <p className="text-sm text-muted">{shop.address}</p>
                </AnimatedCard>
              </Link>
            ))}
          </div>
        )}

        <Card>
          <h2 className="mb-3 font-semibold">Dodaj novi salon</h2>
          <form action={createShop} className="flex flex-col gap-3">
            <div>
              <label htmlFor="name">Naziv salona</label>
              <input id="name" name="name" required placeholder="npr. Frizerski salon Stil" />
            </div>
            <div>
              <label htmlFor="address">Adresa</label>
              <input id="address" name="address" required placeholder="Ulica i broj, grad" />
            </div>
            <div>
              <label htmlFor="description">Opis (opciono)</label>
              <textarea id="description" name="description" rows={2} />
            </div>
            <Button type="submit">Kreiraj salon</Button>
          </form>
        </Card>
      </main>
    </>
  );
}
