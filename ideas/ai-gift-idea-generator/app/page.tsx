import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { GiftForm } from "@/components/GiftForm";
import { isConfigured } from "@/lib/gemini";

export default function Home() {
  const configured = isConfigured();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">AI Gift Idea Generator</h1>
        <p className="mb-6 text-muted">
          Tell us about your friend&apos;s interests and your budget, and
          we&apos;ll suggest 5 unique gift ideas with a reason each.
        </p>

        {!configured && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              AI isn&apos;t configured yet on this deployment (no
              GOOGLE_AI_API_KEY set). The form below is fully browsable, but
              generating ideas won&apos;t work until a key is added.
            </p>
          </Card>
        )}

        <Card>
          <GiftForm />
        </Card>
      </main>
    </>
  );
}
