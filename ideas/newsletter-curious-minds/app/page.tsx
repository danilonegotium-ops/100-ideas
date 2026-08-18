import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { SignupForm } from "@/components/SignupForm";
import { issues } from "@/content/issues";

export default function Home() {
  const latest = issues[issues.length - 1];

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          Newsletter for Curious Minds
        </h1>
        <p className="mb-6 text-muted">
          A weekly email with five interesting, genuinely-checked facts
          about science and tech. No fluff, no clickbait — just the kind of
          thing you&apos;d want to tell someone at dinner.
        </p>

        <Card className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-fg">
            Get the next issue
          </h2>
          <SignupForm />
        </Card>

        {latest && (
          <Card className="mb-6">
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">
              Latest issue
            </p>
            <Link href={`/archive/${latest.slug}`} className="no-underline">
              <h2 className="text-base font-semibold text-fg hover:text-accent">
                #{latest.issueNumber}: {latest.title}
              </h2>
            </Link>
            <p className="mt-1 text-sm text-muted">{latest.intro}</p>
          </Card>
        )}

        <Link href="/archive" className="text-sm text-accent underline">
          Browse the full archive →
        </Link>
      </main>
    </>
  );
}
