"use client";

import { FormEvent, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Passwordless (magic link) email auth — same as the shared template, with
 * one addition: forwards an optional `?next=` (e.g. `/studio`) through to
 * `app/auth/callback/route.ts`, which already validates it's a safe
 * same-origin relative path before redirecting. Lets `/studio` send
 * logged-out visitors here and land them back on `/studio` after they
 * click the magic link, instead of always landing on `/`.
 */
function LoginForm() {
  const searchParams = useSearchParams();
  const rawNext = searchParams.get("next");
  const next = rawNext && /^\/(?!\/|\\)/.test(rawNext) ? rawNext : null;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    const supabase = createClient();
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (next) callbackUrl.searchParams.set("next", next);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
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
