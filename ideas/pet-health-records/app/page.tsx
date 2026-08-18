import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Pet Health Records</h1>
        <p className="mb-6 text-muted">
          A digital vault for your pet&apos;s vaccinations, chip number, and
          medical history — with overdue/upcoming vaccination flags.
        </p>

        <Card className="mb-6">
          <ol className="list-inside list-decimal space-y-2 text-sm text-fg">
            <li>Add a pet — name, species, microchip number.</li>
            <li>
              Log vaccinations and vet visits as they happen, with a
              next-due date for anything recurring.
            </li>
            <li>
              Your dashboard flags anything overdue or due within 30 days.
            </li>
          </ol>
        </Card>

        <Link href="/login">
          <Button>Log in / sign up</Button>
        </Link>
      </main>
    </>
  );
}
