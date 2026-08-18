import { redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { LetterForm } from "./LetterForm";

type LetterRow = {
  id: string;
  title: string | null;
  deliver_at: string;
  delivered: boolean;
  delivered_at: string | null;
  created_at: string;
};

/**
 * Protected Server Component. Calling `getUser()` (which calls `cookies()`
 * internally) marks this route dynamic, so it's excluded from static
 * generation at build time — no Supabase credentials needed for
 * `next build` to succeed, per `lib/supabase/server.ts`.
 */
export default async function CapsulePage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: letters } = await supabase
    .from("digital_time_capsule_letters")
    .select("id, title, deliver_at, delivered, delivered_at, created_at")
    .order("deliver_at", { ascending: true })
    .returns<LetterRow[]>();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Your time capsule</h1>
        <p className="mb-6 text-muted">
          Signed in as <strong>{user.email}</strong>. We&apos;ll email each
          letter to this address on its delivery date.
        </p>

        <LetterForm />

        <h2 className="mb-3 mt-10 text-lg font-semibold">Your letters</h2>
        {!letters || letters.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">
              No letters yet — write your first one above.
            </p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {letters.map((letter) => (
              <li key={letter.id}>
                <Card className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">
                      {letter.title || "Untitled letter"}
                    </p>
                    <p className="text-sm text-muted">
                      {letter.delivered
                        ? `Delivered ${new Date(
                            letter.delivered_at ?? letter.deliver_at,
                          ).toLocaleDateString()}`
                        : `Arrives ${new Date(
                            letter.deliver_at,
                          ).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={
                      letter.delivered
                        ? "shrink-0 text-sm text-accent"
                        : "shrink-0 text-sm text-muted"
                    }
                  >
                    {letter.delivered ? "Delivered" : "Sealed"}
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
