import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { issues } from "@/content/issues";

export default function ArchivePage() {
  const sorted = [...issues].sort((a, b) => b.issueNumber - a.issueNumber);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Archive</h1>
        <p className="mb-6 text-muted">Every past issue, in full.</p>

        <div className="flex flex-col gap-3">
          {sorted.map((issue) => (
            <Link key={issue.slug} href={`/archive/${issue.slug}`} className="no-underline">
              <Card className="transition-colors hover:border-accent">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-fg">
                    #{issue.issueNumber}: {issue.title}
                  </h2>
                  <span className="whitespace-nowrap text-xs text-muted">
                    {issue.date}
                  </span>
                </div>
                <p className="text-sm text-muted">{issue.intro}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
