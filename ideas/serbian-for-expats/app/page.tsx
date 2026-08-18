import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";
import { getProgressForUser, progressBySlug } from "@/lib/data";
import { LESSONS } from "@/lib/lessons";

export default async function Home() {
  const user = await getUser();
  let progress = new Map<string, { score: number; total: number }>();

  if (user) {
    const supabase = createClient();
    const rows = await getProgressForUser(supabase, user.id);
    progress = progressBySlug(rows);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Serbian for Expats</h1>
        <p className="mb-6 text-muted">
          Osam kratkih lekcija za svakodnevni srpski u Beogradu i Novom Sadu —
          pozdravi, brojevi, hrana, snalaženje, porodica, vreme, kupovina i
          korisne fraze. Svaka lekcija ima kviz od 5 pitanja.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          {user ? (
            <Link href="/progress">
              <Button variant="secondary">Vaš napredak</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button variant="secondary">Prijavite se da sačuvate napredak</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LESSONS.map((lesson, index) => {
            const done = progress.get(lesson.slug);
            return (
              <Link key={lesson.slug} href={`/lessons/${lesson.slug}`}>
                <Card className="h-full transition-colors hover:border-accent">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h2 className="font-semibold">
                      {index + 1}. {lesson.title}
                    </h2>
                    {done && (
                      <span className="text-xs text-accent">
                        {done.score}/{done.total}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted">{lesson.description}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
