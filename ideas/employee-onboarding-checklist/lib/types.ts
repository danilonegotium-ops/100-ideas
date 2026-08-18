export type Template = {
  id: string;
  name: string;
  created_at: string;
};

export type TemplateTask = {
  id: string;
  template_id: string;
  title: string;
  sort_order: number;
};

export type Onboarding = {
  id: string;
  template_id: string | null;
  hire_name: string;
  hire_email: string;
  started_at: string;
  created_at: string;
};

export type OnboardingTask = {
  id: string;
  onboarding_id: string;
  title: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
};

export type ActionResult = { ok: true } | { ok: false; error: string };

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate + (isoDate.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
