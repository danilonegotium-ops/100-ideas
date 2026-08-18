import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient, getUser } from "@/lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("roommate_matcher_profiles")
    .select(
      "display_name, city, area, university, budget_min, budget_max, sleep_schedule, cleanliness, social_style, smoker, pets_ok, bio",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          {profile ? "Edit your profile" : "Create your profile"}
        </h1>
        <p className="mb-6 text-muted">
          This is what other students see, and what compatibility scoring
          is based on when you browse.
        </p>
        <ProfileForm initialProfile={profile} />
      </main>
    </>
  );
}
