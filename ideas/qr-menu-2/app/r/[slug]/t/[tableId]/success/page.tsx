import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { isStripeConfigured, retrieveCheckoutSession } from "@/lib/stripe";
import { OrderConfirmation } from "@/components/order/OrderConfirmation";

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
        <OrderConfirmation
          restaurantName={restaurant.name}
          restaurantSlug={params.slug}
          tableId={params.tableId}
          orderId={order.id}
          paymentStatus={order.payment_status}
          items={order.order_items}
          customerNote={order.customer_note}
          totalCents={order.total_cents}
        />
      </main>
    </>
  );
}
