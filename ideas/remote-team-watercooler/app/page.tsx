import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          Remote Team Watercooler
        </h1>
        <p className="mb-6 text-muted">
          Randomly pairs your remote teammates for a 10-minute video chat
          every week — the hallway conversation you don&apos;t get working
          from home.
        </p>

        <Card className="mb-6">
          <ol className="list-inside list-decimal space-y-2 text-sm text-fg">
            <li>Add your team members (name + email).</li>
            <li>
              Click &ldquo;run pairing&rdquo; — everyone gets randomly paired
              up for the week (odd numbers get a group of three), and we try
              not to repeat last week&apos;s pairs.
            </li>
            <li>
              Each person gets a personal link showing who they&apos;re
              paired with this week, where they can drop a meeting link
              (Google Meet, Zoom, whatever you use).
            </li>
          </ol>
        </Card>

        <div className="flex gap-3">
          <Link href="/login">
            <Button>Log in / sign up</Button>
          </Link>
        </div>
      </main>
    </>
  );
}
