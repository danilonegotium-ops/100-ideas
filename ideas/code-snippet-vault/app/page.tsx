import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { SnippetVault } from "@/components/SnippetVault";
import { createClient, getUser } from "@/lib/supabase/server";
import type { Snippet } from "@/lib/types";

export default async function Home() {
  const user = await getUser();

  if (!user) {
    return (
      <>
        <Nav />
        <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
          <h1 className="mb-2 text-2xl font-semibold">Code Snippet Vault</h1>
          <p className="mb-6 text-muted">
            A private place to save and organize the pieces of code you
            reuse most — with syntax highlighting, tags, and search.
          </p>
          <Card>
            <p className="mb-4 text-sm text-muted">
              Your snippets are private to your account. Log in with a
              magic link to get started.
            </p>
            <Link href="/login">
              <Button>Log in</Button>
            </Link>
          </Card>
        </main>
      </>
    );
  }

  // Server Component: safe to call createClient() here at request time
  // (see lib/supabase/server.ts) — cookies() makes this route dynamic, so
  // it never runs during `next build`.
  const supabase = createClient();
  const { data, error } = await supabase
    .from("code_snippet_vault_snippets")
    .select("id, title, language, code, tags, created_at, updated_at")
    .order("created_at", { ascending: false });

  const initialSnippets: Snippet[] = error ? [] : (data ?? []);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Code Snippet Vault</h1>
        <p className="mb-6 text-muted">
          Logged in as <strong className="text-fg">{user.email}</strong>.
        </p>
        {error && (
          <Card className="mb-6 border-danger">
            <p className="text-sm text-danger">
              Couldn&apos;t load snippets: {error.message}
            </p>
          </Card>
        )}
        <SnippetVault userId={user.id} initialSnippets={initialSnippets} />
      </main>
    </>
  );
}
