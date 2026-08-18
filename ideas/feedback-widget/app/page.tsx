import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Feedback Widget</h1>
        <p className="mb-6 text-muted">
          An embeddable &ldquo;Was this helpful?&rdquo; button for any
          website — one line of code, no framework required.
        </p>

        <Card className="mb-6">
          <ol className="list-inside list-decimal space-y-2 text-sm text-fg">
            <li>Create a widget and write your question.</li>
            <li>Copy the one-line &lt;script&gt; snippet onto any page.</li>
            <li>Watch yes/no responses roll in on your dashboard.</li>
          </ol>
        </Card>

        <Link href="/login">
          <Button>Log in / sign up</Button>
        </Link>
      </main>
    </>
  );
}
