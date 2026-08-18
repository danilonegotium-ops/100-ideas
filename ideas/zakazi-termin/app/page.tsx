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
        <h1 className="mb-2 text-2xl font-semibold">Zakazi Termin</h1>
        <p className="mb-6 text-muted">
          Jednostavan sistem zakazivanja za frizerske i beauty salone.
          Vlasnik otvara termine, mušterija zakazuje bez naloga, salon vidi
          kalendar rezervacija.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button>Kontrolna tabla salona</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Prijavi se kao vlasnik salona</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="mb-1 font-semibold">Otvorite termine</h2>
            <p className="text-sm text-muted">
              Generišite termine za dan u par klikova — vreme početka, kraja
              i trajanje jednog termina.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Mušterije zakazuju odmah</h2>
            <p className="text-sm text-muted">
              Bez naloga i lozinke — samo ime i email na javnoj stranici
              salona.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Email potvrda</h2>
            <p className="text-sm text-muted">
              Mušterija dobija potvrdu na email odmah nakon zakazivanja
              (umesto SMS-a — vidi SPEC.md za detalje).
            </p>
          </Card>
        </div>

        <p className="mt-8 text-sm text-muted">
          Imate link ka salonu? Otvorite ga direktno da zakažete termin.
        </p>
      </main>
    </>
  );
}
