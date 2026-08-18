import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient, getUser } from "@/lib/supabase/server";
import { CreateRestaurantForm } from "@/components/admin/CreateRestaurantForm";

export default async function AdminHome() {
  const user = await getUser();
  if (!user) redirect("/login?next=/admin");

  const supabase = createClient();
  const { data: restaurant } = await supabase
    .from("qr_menu_2_restaurants")
    .select("slug")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (restaurant) redirect(`/admin/${restaurant.slug}`);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Restaurant admin</h1>
        <CreateRestaurantForm />
      </main>
    </>
  );
}
