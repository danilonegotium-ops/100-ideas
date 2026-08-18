import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 py-8 px-5">
        <h1 className="mb-2 text-2xl font-semibold">Your supplements</h1>
        <p className="mb-6 text-muted">Logged in as {user.email}</p>
        <DashboardClient />
      </main>
    </>
  );
}
