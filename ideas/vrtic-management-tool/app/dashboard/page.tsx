import Link from "next/link";
import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";
import { getTeacherGroups } from "@/lib/data";
import { createGroup } from "@/lib/actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const groups = await getTeacherGroups(supabase, user.id);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Vaše grupe</h1>
        <p className="mb-6 text-muted">
          Prijavljeni ste kao <strong>{user.email}</strong>.
        </p>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        {groups.length === 0 ? (
          <Card className="mb-6">
            <p className="text-sm text-muted">Još uvek nemate nijednu grupu.</p>
          </Card>
        ) : (
          <div className="mb-6 grid gap-3">
            {groups.map((group) => (
              <Link key={group.id} href={`/dashboard/${group.id}`}>
                <Card className="transition-colors hover:border-accent">
                  <h2 className="font-semibold">{group.name}</h2>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Card>
          <h2 className="mb-3 font-semibold">Dodaj novu grupu</h2>
          <form action={createGroup} className="flex flex-col gap-3">
            <div>
              <label htmlFor="name">Naziv grupe</label>
              <input id="name" name="name" required placeholder="npr. Sunčeva grupa" />
            </div>
            <Button type="submit">Kreiraj grupu</Button>
          </form>
        </Card>
      </main>
    </>
  );
}
