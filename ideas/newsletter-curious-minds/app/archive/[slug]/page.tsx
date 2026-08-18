import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { getIssueBySlug, issues } from "@/content/issues";

export function generateStaticParams() {
  return issues.map((issue) => ({ slug: issue.slug }));
}

export default function IssuePage({ params }: { params: { slug: string } }) {
  const issue = getIssueBySlug(params.slug);

  if (!issue) {
    notFound();
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <p className="mb-1 text-xs text-muted">{issue.date}</p>
        <h1 className="mb-2 text-2xl font-semibold">
          #{issue.issueNumber}: {issue.title}
        </h1>
        <p className="mb-6 text-muted">{issue.intro}</p>

        <div className="flex flex-col gap-4">
          {issue.facts.map((fact) => (
            <Card key={fact.title}>
              <h2 className="mb-1 text-sm font-semibold text-fg">
                {fact.title}
              </h2>
              <p className="text-sm text-muted">{fact.body}</p>
            </Card>
          ))}
        </div>

        <Link href="/archive" className="mt-6 inline-block text-sm text-accent underline">
          ← back to the archive
        </Link>
      </main>
    </>
  );
}
