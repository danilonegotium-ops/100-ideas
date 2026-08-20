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
        <h1 className="mb-2 text-2xl font-semibold">Sponsorship Manager</h1>
        <p className="mb-6 text-muted">
          A lightweight CRM for YouTubers and podcasters to manage brand deals and outreach —
          track sponsors through a simple pipeline instead of a spreadsheet.
        </p>

        <GlassPanel glow className="mb-6">
          <p className="mb-4 text-sm text-fg">
            Add a sponsor contact, track the deal through prospecting → negotiating → signed →
            paid (or declined), jot notes and next actions, and see your whole pipeline as a
            kanban board.
          </p>
          <Link href={user ? "/dashboard" : "/login"}>
            <Button>{user ? "Go to your pipeline" : "Log in to get started"}</Button>
          </Link>
        </GlassPanel>

        <Card>
          <p className="text-sm text-muted">
            What&apos;s in this MVP: deal tracking with contact info, a 5-stage kanban pipeline,
            editable notes/next-action per deal, and value totals by stage. See{" "}
            <code className="font-mono">SPEC.md</code> in this idea&apos;s folder for the full
            scope and schema notes.
          </p>
        </Card>
      </main>
    </>
  );
}
