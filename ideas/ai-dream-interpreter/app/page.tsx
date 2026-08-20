import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { DreamForm } from "@/components/DreamForm";
import { isConfigured } from "@/lib/gemini";

export default function Home() {
  const configured = isConfigured();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GlassPanel glow className="mb-6">
          <h1 className="mb-2 text-headline text-fg">AI Dream Interpreter</h1>
          <p className="text-muted">
            Describe a dream and get a fun, imaginative interpretation.
          </p>
        </GlassPanel>

        <Card className="mb-6 border-accent">
          <p className="text-sm">
            <strong>For entertainment purposes only.</strong> This is not
            professional psychological, medical, or mental health advice.
            If something is genuinely troubling you, please talk to a real
            professional or someone you trust.
          </p>
        </Card>

        {!configured && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              AI isn&apos;t configured yet on this deployment (no
              GOOGLE_AI_API_KEY set). The form below is fully browsable, but
              interpreting a dream won&apos;t work until a key is added.
            </p>
          </Card>
        )}

        <Card>
          <DreamForm />
        </Card>
      </main>
    </>
  );
}
