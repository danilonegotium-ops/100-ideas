import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function Home() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">QR Menu 2.0</h1>
        <p className="mb-6 text-muted">
          A digital menu customers can actually order and pay from — not
          just a PDF behind a QR code. Build a menu, print a QR code per
          table, and let guests browse, add to cart, and check out from
          their own phone.
        </p>

        <div className="flex flex-col gap-4">
          <Card>
            <h2 className="mb-1 text-lg font-semibold">For restaurants</h2>
            <p className="mb-4 text-sm text-muted">
              Sign in to build your menu and generate QR codes for your
              tables.
            </p>
            <Link href="/admin">
              <Button>Go to restaurant admin</Button>
            </Link>
          </Card>

          <Card>
            <h2 className="mb-1 text-lg font-semibold">See it in action</h2>
            <p className="mb-4 text-sm text-muted">
              Try the seeded demo restaurant — this is what a customer sees
              after scanning the QR code at their table.
            </p>
            <Link href="/r/demo-bistro/t/11111111-1111-1111-1111-1111111111d1">
              <Button variant="secondary">Open demo menu (Table 1)</Button>
            </Link>
          </Card>
        </div>
      </main>
    </>
  );
}
