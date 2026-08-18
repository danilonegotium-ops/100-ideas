import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Mood Journal with AI</h1>
        <p className="mb-6 text-muted">
          Write a short journal entry each day. AI tags the mood it detects,
          and once you have a few entries, the dashboard surfaces simple
          patterns — like whether you tend to feel better on days you
          mention exercise or getting outside.
        </p>
        <Card className="mb-6">
          <p className="text-sm text-muted">
            Log in with your email (no password — we send a magic link) to
            start journaling.
          </p>
        </Card>
        <Link href="/login">
          <Button>Log in / sign up</Button>
        </Link>
      </main>
    </>
  );
}
