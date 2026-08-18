import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { getProgressForUser, progressBySlug } from "@/lib/data";
import { LESSONS } from "@/lib/lessons";

export default async function ProgressPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const rows = await getProgressForUser(supabase, user.id);
  const bySlug = progressBySlug(rows);
  const completedCount = rows.length;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Vaš napredak</h1>
        <p className="mb-6 text-muted">
          {completedCount} od {LESSONS.length} lekcija završeno.
        </p>

        <div className="grid gap-3">
          {LESSONS.map((lesson, index) => {
            const done = bySlug.get(lesson.slug);
            return (
              <Link key={lesson.slug} href={`/lessons/${lesson.slug}`}>
                <Card className="flex items-center justify-between gap-3 transition-colors hover:border-accent">
                  <div>
                    <span className="text-sm text-muted">Lekcija {index + 1}</span>
                    <h2 className="font-medium">{lesson.title}</h2>
                  </div>
                  {done ? (
                    <span className="text-sm text-accent">
                      {done.score}/{done.total}
                    </span>
                  ) : (
                    <span className="text-sm text-muted">nije rađeno</span>
                  )}
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
