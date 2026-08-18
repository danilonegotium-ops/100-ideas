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
        <h1 className="mb-2 text-2xl font-semibold">Digitalni Upravnik</h1>
        <p className="mb-6 text-muted">
          Vođenje stambene zgrade na jednom mestu: fond za održavanje,
          glasanje stanara i digitalna oglasna tabla — bez papira i
          WhatsApp grupa.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button>Idi na kontrolnu tablu</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button>Prijavi se kao upravnik</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <h2 className="mb-1 font-semibold">Fond održavanja</h2>
            <p className="text-sm text-muted">
              Praćenje uplata i troškova zgrade sa transparentnim stanjem
              vidljivim svim stanarima.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Glasanje stanara</h2>
            <p className="text-sm text-muted">
              Pokrenite glasanje po pitanju zgrade — svaki stan glasa jednom,
              rezultati se ažuriraju uživo.
            </p>
          </Card>
          <Card>
            <h2 className="mb-1 font-semibold">Oglasna tabla</h2>
            <p className="text-sm text-muted">
              Digitalna zamena za papirna obaveštenja na ulaznim vratima —
              dostupna svima preko linka zgrade.
            </p>
          </Card>
        </div>

        <p className="mt-8 text-sm text-muted">
          Imate link ka oglasnoj tabli vaše zgrade? Otvorite ga direktno —
          prijava nije potrebna za pregled i glasanje.
        </p>
      </main>
    </>
  );
}
