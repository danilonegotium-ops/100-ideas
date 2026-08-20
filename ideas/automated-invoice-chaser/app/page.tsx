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
        <h1 className="mb-2 text-2xl font-semibold">Automated Invoice Chaser</h1>
        <p className="mb-6 text-muted">
          Track invoices, spot the overdue ones at a glance, and send a payment reminder in one
          click — no accounting software connection required.
        </p>

        <GlassPanel glow className="mb-6">
          <p className="mb-4 text-sm text-fg">
            Add invoices manually as you issue them. Anything past its due date is flagged
            automatically. When it&apos;s time to nudge a client, hit &ldquo;Send reminder&rdquo; —
            it emails them via Resend if configured, or logs exactly what would have been sent so
            you can still copy/paste it yourself.
          </p>
          <Link href={user ? "/invoices" : "/login"}>
            <Button>{user ? "Go to your invoices" : "Log in to get started"}</Button>
          </Link>
        </GlassPanel>

        <Card>
          <p className="text-sm text-muted">
            What&apos;s in this MVP: manual invoice entry (client, amount, due date), automatic
            overdue flagging, a reminder log per invoice, and a dashboard of outstanding / overdue
            / paid totals. See <code className="font-mono">SPEC.md</code> in this idea&apos;s
            folder for the full scope and schema notes.
          </p>
        </Card>
      </main>
    </>
  );
}
