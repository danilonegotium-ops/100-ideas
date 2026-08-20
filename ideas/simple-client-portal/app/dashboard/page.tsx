import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import { getProjectsForUser } from "@/lib/data";
import { createProject } from "@/lib/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const allProjects = await getProjectsForUser(supabase);
  const owned = allProjects.filter((p) => p.freelancer_id === user.id);
  const shared = allProjects.filter((p) => p.freelancer_id !== user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Projekti</h1>
        <p className="mb-6 text-muted">
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Vaši projekti</h2>
          {owned.length === 0 ? (
            <EmptyState className="mb-3" title="Još uvek nemate nijedan projekat." />
          ) : (
            <div className="mb-3 grid gap-3">
              {owned.map((project, i) => (
                <Link key={project.id} href={`/dashboard/${project.id}`}>
                  <AnimatedCard index={i} className="transition-colors hover:border-accent">
                    <h3 className="font-semibold">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted">{project.description}</p>
                    )}
                  </AnimatedCard>
                </Link>
              ))}
            </div>
          )}
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Novi projekat</h3>
            <form action={createProject} className="flex flex-col gap-3">
              <div>
                <label htmlFor="name">Naziv projekta</label>
                <input id="name" name="name" required placeholder="npr. Redizajn sajta" />
              </div>
              <div>
                <label htmlFor="description">Opis (opciono)</label>
                <textarea id="description" name="description" rows={2} />
              </div>
              <Button type="submit">Kreiraj projekat</Button>
            </form>
          </Card>
        </section>

        {shared.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-semibold">Podeljeno sa vama</h2>
            <div className="grid gap-3">
              {shared.map((project, i) => (
                <Link key={project.id} href={`/dashboard/${project.id}`}>
                  <AnimatedCard index={i} className="transition-colors hover:border-accent">
                    <h3 className="font-semibold">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted">{project.description}</p>
                    )}
                  </AnimatedCard>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}
