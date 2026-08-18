import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getUser } from "@/lib/supabase/server";
import { NewListingForm } from "./NewListingForm";

export default async function NewListingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Post a listing</h1>
        <p className="mb-6 text-muted">
          Say what show or festival you&apos;re going to and let people
          looking for a buddy find you.
        </p>
        <NewListingForm />
      </main>
    </>
  );
}
