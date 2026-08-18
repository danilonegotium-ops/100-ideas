import Link from "next/link";
import { Nav } from "@/components/Nav";
import { SubmitForm } from "@/components/SubmitForm";

export default function SubmitPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <Link
          href="/"
          className="mb-4 inline-block text-sm text-muted no-underline hover:text-fg"
        >
          &larr; back to the map
        </Link>

        <h1 className="mb-2 text-2xl font-semibold">Report your rent</h1>
        <p className="mb-6 text-muted">
          No account, no name, no email. Just the numbers — it takes under a
          minute.
        </p>

        <SubmitForm />
      </main>
    </>
  );
}
