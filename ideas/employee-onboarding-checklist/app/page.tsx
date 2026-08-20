import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Employee Onboarding Checklist</h1>
        <p className="mb-6 text-muted">
          HR builds a reusable onboarding checklist template, assigns it to a new hire by email,
          and the new hire logs in — no password, no account setup — to see and check off their
          own tasks.
        </p>

        <GlassPanel glow className="mb-6">
          <p className="mb-4 text-sm text-fg">
            Everyone logs in the same way, with a magic link email. HR sees an admin dashboard to
            build templates, assign hires, and track completion across everyone. A new hire who
            logs in with the email HR assigned sees only their own checklist.
          </p>
          {user ? (
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard">
                <Button>Go to HR dashboard</Button>
              </Link>
              <Link href="/my-onboarding">
                <Button variant="secondary">View my onboarding</Button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <Button>Log in to get started</Button>
            </Link>
          )}
        </GlassPanel>

        <Card>
          <p className="text-sm text-muted">
            What&apos;s in this MVP: reusable templates (one task per line), one-click assignment
            to a hire by email, a hire-facing checklist with checkboxes, and an admin view of
            completion progress across active onboardings. See{" "}
            <code className="font-mono">SPEC.md</code> in this idea&apos;s folder for the full
            scope and schema notes.
          </p>
        </Card>
      </main>
    </>
  );
}
