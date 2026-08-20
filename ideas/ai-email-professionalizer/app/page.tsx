import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { EmailForm } from "@/components/EmailForm";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { isConfigured } from "@/lib/gemini";

export default function Home() {
  const configured = isConfigured();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">
          AI Email Professionalizer
        </h1>
        <p className="mb-6 text-muted">
          Paste an angry, emotional, or too-casual email draft, and
          we&apos;ll rewrite it as a polite, professional version that keeps
          your core message intact.
        </p>

        {!configured && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              AI isn&apos;t configured yet on this deployment (no
              GOOGLE_AI_API_KEY set). The form below is fully browsable, but
              rewriting won&apos;t work until a key is added.
            </p>
          </Card>
        )}

        <GlassPanel glow>
          <EmailForm />
        </GlassPanel>
      </main>
    </>
  );
}
