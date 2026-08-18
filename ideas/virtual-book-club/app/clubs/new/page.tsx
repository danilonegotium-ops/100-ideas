import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getUser } from "@/lib/supabase/server";
import { NewClubForm } from "@/components/NewClubForm";

export default async function NewClubPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login?next=/clubs/new");
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Create a club</h1>
        <p className="mb-6 text-muted">
          You&apos;ll be added as the first member and can invite others by
          email from the club page.
        </p>
        <NewClubForm />
      </main>
    </>
  );
}
