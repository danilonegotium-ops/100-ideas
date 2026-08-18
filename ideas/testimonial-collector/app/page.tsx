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
        <h1 className="mb-2 text-2xl font-semibold">Testimonial Collector</h1>
        <p className="mb-6 text-muted">
          Collect video and text testimonials from customers via a shareable link, review them,
          and embed the approved ones on any website.
        </p>

        <Card className="mb-6">
          <p className="mb-4 text-sm text-fg">
            Create a collection to get a public link like <code className="font-mono">/c/your-business</code>.
            Share it anywhere — no login required for customers to submit. Review submissions in
            your dashboard, approve the good ones, and pull them into your own site via a simple
            JSON embed endpoint.
          </p>
          <Link href={user ? "/dashboard" : "/login"}>
            <Button>{user ? "Go to your dashboard" : "Log in to get started"}</Button>
          </Link>
        </Card>

        <Card>
          <p className="text-sm text-muted">
            What&apos;s in this MVP: public no-auth submission page (text + optional video upload),
            a moderation dashboard, and a public embed JSON endpoint. See{" "}
            <code className="font-mono">SPEC.md</code> in this idea&apos;s folder for the full
            scope, schema, and Storage bucket setup notes.
          </p>
        </Card>
      </main>
    </>
  );
}
