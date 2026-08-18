import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { getUser } from "@/lib/supabase/server";

export default async function Home() {
  const user = await getUser();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Micro-SaaS for Gyms</h1>
        <p className="mb-6 text-muted">
          A simple member check-in and subscription tracker for small boutique fitness studios —
          no bloated all-in-one gym software required.
        </p>

        <Card className="mb-6">
          <p className="mb-4 text-sm text-fg">
            Keep a member list with subscription status and expiry, check members in with a
            quick name search, and see at a glance how many members are active, checked in
            today, or about to expire.
          </p>
          <Link href={user ? "/dashboard" : "/login"}>
            <Button>{user ? "Go to your dashboard" : "Log in to get started"}</Button>
          </Link>
        </Card>

        <Card>
          <p className="text-sm text-muted">
            What&apos;s in this MVP: member list with plan + expiry, manual check-in log,
            renew/cancel/reactivate per member, and a dashboard of active / checked-in-today /
            expiring-soon counts. See <code className="font-mono">SPEC.md</code> in this
            idea&apos;s folder for the full scope and schema notes.
          </p>
        </Card>
      </main>
    </>
  );
}
