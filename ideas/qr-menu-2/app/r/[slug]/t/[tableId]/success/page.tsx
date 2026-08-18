import { notFound } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { formatCents } from "@/lib/money";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { isStripeConfigured, retrieveCheckoutSession } from "@/lib/stripe";

interface OrderItemRow {
  id: string;
  name_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
}

interface OrderRow {
  id: string;
  status: string;
  payment_status: "unpaid" | "paid" | "demo";
  total_cents: number;
  customer_note: string | null;
  order_items: OrderItemRow[];
}

/**
 * Order confirmation. If `session_id` is present (real Stripe flow), this
 * verifies payment directly with Stripe's API server-side — the query
 * param alone is never trusted — before marking the order paid. Reads/writes
 * use the service-role admin client since orders have no public RLS policy.
 */
export default async function OrderSuccessPage({
  params,
  searchParams,
}: {
  params: { slug: string; tableId: string };
  searchParams: { order_id?: string; session_id?: string };
}) {
  const orderId = searchParams.order_id;
  if (!orderId) notFound();

  const admin = getAdminClient();

  if (searchParams.session_id && isStripeConfigured()) {
    try {
      const session = await retrieveCheckoutSession(searchParams.session_id);
      if (session.payment_status === "paid") {
        await admin
          .from("qr_menu_2_orders")
          .update({ payment_status: "paid", status: "preparing" })
          .eq("id", orderId)
          .eq("stripe_checkout_session_id", session.id);
      }
    } catch {
      // Non-fatal — the order below just shows whatever payment_status it
      // already has. A human can check the Stripe dashboard if this
      // verification call itself failed (e.g. network blip).
    }
  }

  const [{ data: restaurant }, { data: order }] = await Promise.all([
    admin
      .from("qr_menu_2_restaurants")
      .select("name, slug")
      .eq("slug", params.slug)
      .maybeSingle(),
    admin
      .from("qr_menu_2_orders")
      .select("id, status, payment_status, total_cents, customer_note, order_items:qr_menu_2_order_items(id, name_snapshot, price_cents_snapshot, quantity)")
      .eq("id", orderId)
      .maybeSingle<OrderRow>(),
  ]);

  if (!restaurant || !order) notFound();

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-1 text-2xl font-semibold">Order placed</h1>
        <p className="mb-6 text-sm text-muted">{restaurant.name}</p>

        {order.payment_status === "demo" && (
          <Card className="mb-6 border-accent">
            <p className="text-sm">
              <strong>Demo mode</strong> — payment isn&apos;t configured yet
              (no <code className="font-mono">STRIPE_SECRET_KEY</code>), so
              no charge was made. Your order was still recorded below,
              exactly as it would be with a real payment.
            </p>
          </Card>
        )}

        {order.payment_status === "paid" && (
          <Card className="mb-6 border-accent">
            <p className="text-sm">Payment confirmed via Stripe (test mode).</p>
          </Card>
        )}

        {order.payment_status === "unpaid" && (
          <Card className="mb-6">
            <p className="text-sm text-muted">
              We haven&apos;t received payment confirmation yet. If you just
              completed checkout, refresh this page in a few seconds.
            </p>
          </Card>
        )}

        <Card>
          <p className="mb-3 text-sm font-semibold">Order #{order.id.slice(0, 8)}</p>
          <div className="flex flex-col gap-2">
            {order.order_items.map((line) => (
              <div key={line.id} className="flex items-center justify-between text-sm">
                <span>
                  {line.quantity} × {line.name_snapshot}
                </span>
                <span className="font-mono">
                  {formatCents(line.price_cents_snapshot * line.quantity)}
                </span>
              </div>
            ))}
          </div>
          {order.customer_note && (
            <p className="mt-3 text-sm text-muted">Note: {order.customer_note}</p>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
            <span>Total</span>
            <span>{formatCents(order.total_cents)}</span>
          </div>
        </Card>

        <p className="mt-6">
          <Link href={`/r/${params.slug}/t/${params.tableId}`} className="text-sm text-accent">
            &larr; Back to menu
          </Link>
        </p>
      </main>
    </>
  );
}
