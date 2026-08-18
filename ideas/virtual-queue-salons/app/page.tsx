import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Virtual Queue for Salons</h1>
        <p className="mb-6 text-muted">
          A digital waitlist customers can join from their phone — see your
          live position update in real time instead of waiting inside.
        </p>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-1 text-lg font-semibold">Join the demo queue</h2>
            <p className="mb-4 text-sm text-muted">
              What a customer sees after scanning a shop&apos;s waitlist link.
            </p>
            <Link href="/shop/glow-nail-bar">
              <Button>Join Glow Nail Bar&apos;s queue</Button>
            </Link>
          </Card>

          <Card>
            <h2 className="mb-1 text-lg font-semibold">Staff dashboard</h2>
            <p className="mb-4 text-sm text-muted">
              Call the next customer and manage the live queue.
            </p>
            <Link href="/shop/glow-nail-bar/staff">
              <Button variant="secondary">Open staff dashboard</Button>
            </Link>
          </Card>
        </div>
      </main>
    </>
  );
}
