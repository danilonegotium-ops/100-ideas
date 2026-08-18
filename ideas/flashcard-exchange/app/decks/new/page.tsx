import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getUser } from "@/lib/supabase/server";
import { NewDeckForm } from "@/components/NewDeckForm";

export default async function NewDeckPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?next=/decks/new");
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Create a deck</h1>
        <p className="mb-6 text-muted">
          Give it a title, subject, and add as many cards as you want.
          You&apos;ll be able to come back and edit it later since it&apos;s
          tied to your account.
        </p>
        <NewDeckForm />
      </main>
    </>
  );
}
