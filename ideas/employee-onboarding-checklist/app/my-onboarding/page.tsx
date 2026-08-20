import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Onboarding, OnboardingTask } from "@/lib/types";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { SignOutButton } from "@/components/SignOutButton";
import { signOut } from "@/app/my-onboarding/actions";
import { EmptyState } from "@/components/motion/EmptyState";

export default async function MyOnboardingPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();

  // `.ilike` (case-insensitive) rather than `.eq`, since the email HR
  // typed in when assigning the onboarding might not match the exact
  // casing of the hire's real login email.
  const { data: onboardingRows, error: onboardingsError } = await supabase
    .from("employee_onboarding_checklist_onboardings")
    .select("*")
    .ilike("hire_email", user.email ?? "")
    .order("started_at", { ascending: false });
  const onboardings = (onboardingRows ?? []) as Onboarding[];

  let tasksByOnboarding: Record<string, OnboardingTask[]> = {};
  if (onboardings.length > 0) {
    const { data: taskRows } = await supabase
      .from("employee_onboarding_checklist_onboarding_tasks")
      .select("*")
      .ilike("hire_email", user.email ?? "")
      .order("sort_order", { ascending: true });
    const rows = (taskRows ?? []) as OnboardingTask[];
    tasksByOnboarding = rows.reduce<Record<string, OnboardingTask[]>>((acc, task) => {
      (acc[task.onboarding_id] ??= []).push(task);
      return acc;
    }, {});
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold">My onboarding</h1>
            <p className="text-sm text-muted">Signed in as {user.email}</p>
          </div>
          <SignOutButton action={signOut} />
        </div>

        {onboardingsError && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">Couldn&apos;t load your onboarding: {onboardingsError.message}</p>
          </Card>
        )}

        {onboardings.length === 0 ? (
          <EmptyState
            title="No onboarding checklist found"
            description={`Ask your HR team to assign one for ${user.email} — once they do, it'll show up here automatically.`}
            action={
              <Link href="/dashboard" className="text-accent">
                Are you HR? Go to the HR dashboard.
              </Link>
            }
          />
        ) : (
          onboardings.map((onboarding, i) => (
            <OnboardingChecklist
              key={onboarding.id}
              onboarding={onboarding}
              tasks={tasksByOnboarding[onboarding.id] ?? []}
              index={i}
            />
          ))
        )}
      </main>
    </>
  );
}
