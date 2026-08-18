import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { DashboardClient } from "./DashboardClient";

/**
 * Server Component — `getUser()` reads cookies (via `next/headers`), which
 * marks this route dynamic, so it's skipped at `next build` time and only
 * ever rendered at request time (see lib/supabase/server.ts).
 */
export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Team dashboard</h1>
        <p className="mb-6 text-muted">Logged in as {user.email}</p>
        <DashboardClient />
      </main>
    </>
  );
}
