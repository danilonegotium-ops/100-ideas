import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { JournalClient } from "./JournalClient";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Your journal</h1>
        <p className="mb-6 text-muted">Logged in as {user.email}</p>
        <JournalClient />
      </main>
    </>
  );
}
