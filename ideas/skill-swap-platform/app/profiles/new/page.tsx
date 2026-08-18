import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { createClient, getUser } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";

export default async function NewProfilePage() {
  const user = await getUser();

  if (!user) {
    redirect("/login?next=/profiles/new");
  }

  const supabase = createClient();
  const { data: existing } = await supabase
    .from("skill_swap_platform_profiles")
    .select("display_name, bio, skills_teach, skills_learn")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          {existing ? "Edit your profile" : "Create your profile"}
        </h1>
        <p className="mb-6 text-muted">
          List what you can teach and what you&apos;re hoping to learn.
          Other members will find you by searching for the skills you
          teach.
        </p>
        <ProfileForm
          initial={
            existing
              ? {
                  display_name: existing.display_name,
                  bio: existing.bio ?? "",
                  skills_teach: existing.skills_teach ?? [],
                  skills_learn: existing.skills_learn ?? [],
                }
              : undefined
          }
        />
      </main>
    </>
  );
}
