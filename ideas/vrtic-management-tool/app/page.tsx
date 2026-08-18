import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Vrtić Management Tool</h1>
        <p className="mb-6 text-muted">
          Portal za privatne vrtiće: evidencija prisustva, dnevni jelovnik i
          bezbedno deljenje fotografija sa roditeljima.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          {user ? (
            <>
              <Link href="/dashboard">
                <Button>Kontrolna tabla (vaspitač)</Button>
              </Link>
              <Link href="/parent">
                <Button variant="secondary">Pregled za roditelje</Button>
              </Link>
            </>
          ) : (
            <Link href="/login">
              <Button>Prijavi se</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="mb-1 font-semibold">Evidencija prisustva</h2>
            <p className="text-sm text-muted">
              Vaspitač beleži prisustvo svakog deteta po danu, roditelj vidi
              samo svoje dete.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Dnevni jelovnik</h2>
            <p className="text-sm text-muted">
              Doručak, ručak i užina za grupu, vidljivo svim roditeljima
              grupe.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Deljenje sa roditeljima</h2>
            <p className="text-sm text-muted">
              Objave iz dana u vrtiću, dostupne samo prijavljenim roditeljima
              te grupe — ne javno na internetu.
            </p>
          </Card>
        </div>

        <p className="mt-8 text-sm text-muted">
          Roditelji: prijavite se istim emailom koji je vaspitač uneo kao
          kontakt vašeg deteta da biste videli grupu.
        </p>
      </main>
    </>
  );
}
