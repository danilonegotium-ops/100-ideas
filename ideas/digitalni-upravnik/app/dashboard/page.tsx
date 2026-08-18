import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";
import { getManagerBuildings } from "@/lib/data";
import { createBuilding } from "@/lib/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const buildings = await getManagerBuildings(supabase, user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Vaše zgrade</h1>
        <p className="mb-6 text-muted">
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        {buildings.length === 0 ? (
          <Card className="mb-6">
            <p className="text-sm text-muted">
              Još uvek nemate nijednu zgradu. Dodajte prvu ispod.
            </p>
          </Card>
        ) : (
          <div className="mb-6 grid gap-3">
            {buildings.map((building) => (
              <Link key={building.id} href={`/dashboard/${building.id}`}>
                <Card className="transition-colors hover:border-accent">
                  <h2 className="font-semibold">{building.name}</h2>
                  <p className="text-sm text-muted">{building.address}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card>
          <h2 className="mb-3 font-semibold">Dodaj novu zgradu</h2>
          <form action={createBuilding} className="flex flex-col gap-3">
            <div>
              <label htmlFor="name">Naziv zgrade</label>
              <input id="name" name="name" required placeholder="npr. Bulevar Oslobođenja 45" />
            </div>
            <div>
              <label htmlFor="address">Adresa</label>
              <input id="address" name="address" required placeholder="Ulica i broj, grad" />
            </div>
            <Button type="submit">Kreiraj zgradu</Button>
          </form>
        </Card>
      </main>
    </>
  );
}
