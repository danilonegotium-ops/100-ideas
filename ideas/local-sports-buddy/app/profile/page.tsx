import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Your profile</h1>
        <p className="mb-6 text-muted">Logged in as {user.email}</p>
        <ProfileClient />
      </main>
    </>
  );
}
