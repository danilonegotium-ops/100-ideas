import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Quiz } from "@/components/Quiz";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { getUser } from "@/lib/supabase/server";
import { getLessonBySlug, LESSONS } from "@/lib/lessons";
import { saveProgress } from "@/lib/actions";

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const lesson = getLessonBySlug(params.slug);
  if (!lesson) notFound();

  const user = await getUser();
  const index = LESSONS.findIndex((l) => l.slug === lesson.slug);
  const next = LESSONS[index + 1];

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GlassPanel glow className="mb-6">
          <p className="mb-1 text-sm text-muted">
            Lekcija {index + 1} od {LESSONS.length} · {lesson.titleEn}
          </p>
          <h1 className="mb-2 text-2xl font-semibold">{lesson.title}</h1>
          <p className="text-muted">{lesson.description}</p>
        </GlassPanel>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Rečnik</h2>
          <Card>
            <dl className="grid gap-2 sm:grid-cols-2">
              {lesson.vocab.map((item) => (
                <div key={item.sr} className="flex justify-between gap-3 text-sm">
                  <dt className="font-medium">{item.sr}</dt>
                  <dd className="text-muted">{item.en}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Dijalog</h2>
          <Card>
            <div className="flex flex-col gap-3">
              {lesson.dialogue.map((line, i) => (
                <div key={i}>
                  <p className="text-sm">
                    <span className="font-medium">{line.speaker}:</span> {line.sr}
                  </p>
                  <p className="text-xs text-muted">{line.en}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">Proveri znanje</h2>
          <Quiz
            lessonSlug={lesson.slug}
            questions={lesson.quiz}
            isLoggedIn={Boolean(user)}
            saveProgressAction={saveProgress}
          />
        </section>

        <div className="flex justify-between text-sm">
          <Link href="/" className="text-muted hover:text-fg">
            &larr; Sve lekcije
          </Link>
          {next && (
            <Link href={`/lessons/${next.slug}`} className="text-accent hover:text-accent-strong">
              Sledeća: {next.title} &rarr;
            </Link>
          )}
        </div>
      </main>
    </>
  );
}

export function generateStaticParams() {
  return LESSONS.map((lesson) => ({ slug: lesson.slug }));
}
