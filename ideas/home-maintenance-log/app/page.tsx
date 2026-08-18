import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";

const FEATURES = [
  {
    title: "Track every system",
    body: "Boiler, AC, water heater, roof, appliances — log what you have and when it was installed.",
  },
  {
    title: "Log every service call",
    body: "Date, what was done, what it cost, and when it's due again.",
  },
  {
    title: "Never miss a due date",
    body: "Your dashboard flags anything overdue or due soon the moment you log in.",
  },
];

/**
 * Static marketing page — deliberately has no Supabase/auth calls so it
 * stays fully prerendered at build time (`next build` works with no env
 * vars). Protected pages live under `/dashboard` and check auth there.
 */
export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Home Maintenance Log</h1>
        <p className="mb-6 text-muted">
          A digital service book for your house. Track when the boiler, AC,
          water heater, and everything else was last serviced — and know
          exactly what&apos;s due next.
        </p>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link
            href="/login?next=/dashboard"
            className="inline-block rounded-brand bg-accent px-4 py-2 text-sm font-semibold text-[#062b1c] transition-colors hover:bg-accent-strong"
          >
            Get started — it&apos;s free
          </Link>
          <Link
            href="/login?next=/dashboard"
            className="inline-flex items-center rounded-brand border border-border px-4 py-2 text-sm font-semibold text-fg transition-colors hover:border-accent"
          >
            Log in
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title}>
              <h2 className="mb-1 text-sm font-semibold">{feature.title}</h2>
              <p className="text-sm text-muted">{feature.body}</p>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-xs text-muted">
          No password needed — we email you a one-time magic link to sign in.
          Your homes and service history are private to your account.
        </p>
      </main>
    </>
  );
}
