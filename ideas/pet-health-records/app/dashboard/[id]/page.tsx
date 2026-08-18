import { notFound, redirect } from "next/navigation";
import { getUser, createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { PetDetailClient } from "./PetDetailClient";

export default async function PetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: pet } = await supabase
    .from("pet_health_records_pets")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!pet) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          {pet.name} <span className="text-muted">({pet.species})</span>
        </h1>
        <p className="mb-6 text-muted">
          {pet.chip_number ? `Chip: ${pet.chip_number}` : "No chip number on file"}
        </p>
        <PetDetailClient petId={pet.id} />
      </main>
    </>
  );
}
