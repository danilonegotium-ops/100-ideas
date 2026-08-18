"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Passwordless (magic link) email auth. Real network calls only happen
 * inside `handleSubmit`, never during render — see the comment on
 * `createClient()` in `lib/supabase/client.ts` for why that matters.
 *
 * `useSearchParams()` is isolated into its own component wrapped in
 * `<Suspense>` per Next.js's App Router requirement — using it directly in
 * the page component would force the whole page out of static prerendering
 * with a build warning.
 */
function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const redirectTarget = new URL(`${window.location.origin}/auth/callback`);
    if (next && next.startsWith("/")) {
      redirectTarget.searchParams.set("next", next);
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTarget.toString(),
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <Card>
      {status === "sent" ? (
        <p className="text-sm text-fg">
          Check <strong>{email}</strong> for a login link. You can close this
          tab.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              disabled={status === "sending"}
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-danger">{errorMessage}</p>
          )}

          <Button type="submit" disabled={status === "sending"}>
            {status === "sending" ? "Sending link…" : "Send magic link"}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Log in</h1>
        <p className="mb-6 text-muted">
          No password — we&apos;ll email you a magic link.
        </p>

        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
