import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { ResumeForm } from "@/components/ResumeForm";
import { isConfigured } from "@/lib/gemini";

export default function Home() {
  const configured = isConfigured();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GlassPanel glow className="mb-6">
          <h1 className="mb-2 text-headline text-fg">AI Resume Optimizer</h1>
          <p className="text-muted">
            Paste a job description and your resume text. We&apos;ll identify
            important keywords from the job description that are missing from
            your resume, with suggestions on where to naturally add them.
          </p>
        </GlassPanel>

        {!configured && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              AI isn&apos;t configured yet on this deployment (no
              GOOGLE_AI_API_KEY set). The form below is fully browsable, but
              analyzing won&apos;t work until a key is added.
            </p>
          </Card>
        )}

        <Card>
          <ResumeForm />
        </Card>
      </main>
    </>
  );
}
