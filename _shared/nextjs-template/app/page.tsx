import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          Template — replace this page
        </h1>
        <p className="mb-6 text-muted">
          This is the shared Next.js + Supabase starter, not a real idea.
          Copy it into <code className="font-mono">ideas/&lt;slug&gt;/</code>{" "}
          and build the actual product here.
        </p>
        <Card>
          <p className="text-sm text-muted">
            Nothing to see yet. Replace this page with your idea&apos;s real
            UI, and see <code className="font-mono">README.md</code> in this
            folder for setup steps: Supabase env vars, table naming, the
            magic-link login flow, and how to add an AI API route.
          </p>
        </Card>
      </main>
    </>
  );
}
