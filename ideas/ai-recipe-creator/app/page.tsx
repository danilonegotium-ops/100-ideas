import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { RecipeForm } from "@/components/RecipeForm";
import { isConfigured } from "@/lib/gemini";

export default function Home() {
  const configured = isConfigured();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">AI Recipe Creator</h1>
        <p className="mb-6 text-muted">
          Type in a few ingredients you have on hand, and we&apos;ll generate
          a full recipe — title, ingredient list (with reasonable pantry
          staples added), and step-by-step instructions.
        </p>

        {!configured && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              AI isn&apos;t configured yet on this deployment (no
              GOOGLE_AI_API_KEY set). The form below is fully browsable, but
              generating a recipe won&apos;t work until a key is added.
            </p>
          </Card>
        )}

        <Card>
          <RecipeForm />
        </Card>
      </main>
    </>
  );
}
