import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Onboarding, OnboardingTask, Template, TemplateTask } from "@/lib/types";
import { CreateTemplateForm } from "@/components/CreateTemplateForm";
import { TemplateList } from "@/components/TemplateList";
import { AssignOnboardingForm } from "@/components/AssignOnboardingForm";
import { OnboardingProgressList } from "@/components/OnboardingProgressList";
import { SignOutButton } from "@/components/SignOutButton";
import { signOut } from "@/app/dashboard/actions";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();

  const { data: templateRows, error: templatesError } = await supabase
    .from("employee_onboarding_checklist_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const templates = (templateRows ?? []) as Template[];

  const templateIds = templates.map((template) => template.id);
  let taskCountByTemplate: Record<string, number> = {};
  if (templateIds.length > 0) {
    const { data: templateTaskRows } = await supabase
      .from("employee_onboarding_checklist_template_tasks")
      .select("template_id")
      .in("template_id", templateIds);
    const rows = (templateTaskRows ?? []) as Pick<TemplateTask, "template_id">[];
    taskCountByTemplate = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.template_id] = (acc[row.template_id] ?? 0) + 1;
      return acc;
    }, {});
  }

  const { data: onboardingRows, error: onboardingsError } = await supabase
    .from("employee_onboarding_checklist_onboardings")
    .select("*")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });
  const onboardings = (onboardingRows ?? []) as Onboarding[];

  let tasksByOnboarding: Record<string, OnboardingTask[]> = {};
  if (onboardings.length > 0) {
    const { data: onboardingTaskRows } = await supabase
      .from("employee_onboarding_checklist_onboarding_tasks")
      .select("*")
      .eq("owner_id", user.id)
      .order("sort_order", { ascending: true });
    const rows = (onboardingTaskRows ?? []) as OnboardingTask[];
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
            <h1 className="mb-2 text-2xl font-semibold">HR dashboard</h1>
            <p className="text-sm text-muted">
              Signed in as {user.email} &middot;{" "}
              <Link href="/my-onboarding" className="text-accent">
                view as a new hire
              </Link>
            </p>
          </div>
          <SignOutButton action={signOut} />
        </div>

        {(templatesError || onboardingsError) && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              {templatesError?.message || onboardingsError?.message}
            </p>
          </Card>
        )}

        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Create onboarding template</h2>
          <CreateTemplateForm />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">Templates</h2>
        {templates.length === 0 ? (
          <Card className="mb-8">
            <p className="text-sm text-muted">No templates yet — create one above.</p>
          </Card>
        ) : (
          <div className="mb-8">
            <TemplateList templates={templates} taskCountByTemplate={taskCountByTemplate} />
          </div>
        )}

        <Card className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Assign a new hire</h2>
          <AssignOnboardingForm templates={templates} />
        </Card>

        <h2 className="mb-3 text-lg font-semibold">Active onboardings</h2>
        {onboardings.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No onboardings assigned yet.</p>
          </Card>
        ) : (
          <OnboardingProgressList onboardings={onboardings} tasksByOnboarding={tasksByOnboarding} />
        )}
      </main>
    </>
  );
}
