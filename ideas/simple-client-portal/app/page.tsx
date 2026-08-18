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
        <h1 className="mb-2 text-2xl font-semibold">Simple Client Portal</h1>
        <p className="mb-6 text-muted">
          Mesto gde frilenseri dele fajlove i napredak projekta sa klijentima
          — bez komplikovanog alata poput Jire.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button>Idi na projekte</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Prijavi se</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="mb-1 font-semibold">Projekti</h2>
            <p className="text-sm text-muted">
              Kreirajte projekat i pozovite klijenta emailom — bez lozinke,
              samo magic link prijava.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Objave o napretku</h2>
            <p className="text-sm text-muted">
              Delite kratke update-e koje klijent vidi odmah nakon prijave.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Deljenje fajlova</h2>
            <p className="text-sm text-muted">
              Otpremite fajl, klijent ga preuzima preko bezbednog,
              vremenski ograničenog linka.
            </p>
          </Card>
        </div>

        <p className="mt-8 text-sm text-muted">
          Pozvani ste na projekat? Prijavite se istim emailom na koji ste
          pozvani, i projekat će se pojaviti na vašoj listi.
        </p>
      </main>
    </>
  );
}
