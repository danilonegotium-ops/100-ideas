import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Supplement Reminder</h1>
        <p className="mb-6 text-muted">
          Track what to take and when, mark doses off as you take them, and
          get warned before you run out.
        </p>

        <Card className="mb-6">
          <ol className="list-inside list-decimal space-y-2 text-sm text-fg">
            <li>Add your supplements — dose, time of day, pills on hand.</li>
            <li>
              Each day, tap &ldquo;taken&rdquo; as you go — it counts down
              your stock automatically.
            </li>
            <li>
              Get a low-stock warning before you&apos;re down to your last
              few doses.
            </li>
          </ol>
        </Card>

        <Link href="/login">
          <Button>Log in / sign up</Button>
        </Link>
      </main>
    </>
  );
}
