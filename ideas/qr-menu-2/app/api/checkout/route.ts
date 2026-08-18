import { NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabaseAdmin";
import { createCheckoutSession, isStripeConfigured } from "@/lib/stripe";

interface CartLine {
  menuItemId: string;
  quantity: number;
}

interface CheckoutRequestBody {
  restaurantSlug?: string;
  tableId?: string;
  note?: string;
  items?: CartLine[];
}

/**
 * Places an order for a table and — if `STRIPE_SECRET_KEY` is configured —
 * starts a real Stripe Checkout Session (test mode) for it. Prices are
 * always re-read from `qr_menu_2_menu_items` here, never trusted from the
 * client, so a tampered cart can't change what gets charged/recorded.
 *
 * Writes go through the service-role admin client (see
 * lib/supabaseAdmin.ts) because `orders`/`order_items` have no public RLS
 * write policy — only the restaurant owner can read them back, and only
 * this route can write them.
 */
export async function POST(request: Request) {
  let body: CheckoutRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { restaurantSlug, tableId, items, note } = body;

  if (
    !restaurantSlug ||
    !tableId ||
    !Array.isArray(items) ||
    items.length === 0 ||
    items.some((line) => !line || typeof line.menuItemId !== "string")
  ) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }

  const admin = getAdminClient();

  const { data: restaurant } = await admin
    .from("qr_menu_2_restaurants")
    .select("id, slug, name")
    .eq("slug", restaurantSlug)
    .maybeSingle();

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const { data: table } = await admin
    .from("qr_menu_2_tables")
    .select("id, label")
    .eq("id", tableId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();

  if (!table) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  const menuItemIds = items.map((line) => line.menuItemId);
  const { data: menuItems } = await admin
    .from("qr_menu_2_menu_items")
    .select("id, name, price_cents, is_available")
    .eq("restaurant_id", restaurant.id)
    .in("id", menuItemIds);

  const lineItems = items
    .map((line) => {
      const menuItem = menuItems?.find((item) => item.id === line.menuItemId);
      const quantity = Number(line.quantity);
      if (!menuItem || !menuItem.is_available || !Number.isFinite(quantity) || quantity < 1) {
        return null;
      }
      return {
        menuItemId: menuItem.id,
        name: menuItem.name,
        priceCents: menuItem.price_cents,
        quantity: Math.floor(quantity),
      };
    })
    .filter((line): line is { menuItemId: string; name: string; priceCents: number; quantity: number } =>
      line !== null,
    );

  if (lineItems.length === 0) {
    return NextResponse.json(
      { error: "No valid items in cart — they may have sold out." },
      { status: 400 },
    );
  }

  const totalCents = lineItems.reduce((sum, line) => sum + line.priceCents * line.quantity, 0);
  const demoMode = !isStripeConfigured();

  const { data: order, error: orderError } = await admin
    .from("qr_menu_2_orders")
    .insert({
      restaurant_id: restaurant.id,
      table_id: table.id,
      total_cents: totalCents,
      customer_note: typeof note === "string" ? note.slice(0, 500) : null,
      payment_status: demoMode ? "demo" : "unpaid",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const { error: itemsError } = await admin.from("qr_menu_2_order_items").insert(
    lineItems.map((line) => ({
      order_id: order.id,
      menu_item_id: line.menuItemId,
      name_snapshot: line.name,
      price_cents_snapshot: line.priceCents,
      quantity: line.quantity,
    })),
  );

  if (itemsError) {
    return NextResponse.json({ error: "Failed to save order items" }, { status: 500 });
  }

  if (demoMode) {
    return NextResponse.json({ demo: true, orderId: order.id });
  }

  const origin = new URL(request.url).origin;

  try {
    const session = await createCheckoutSession({
      lineItems: lineItems.map((line) => ({
        name: line.name,
        unitAmountCents: line.priceCents,
        quantity: line.quantity,
      })),
      successUrl: `${origin}/r/${restaurant.slug}/t/${table.id}/success?order_id=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/r/${restaurant.slug}/t/${table.id}?cancelled=1`,
      metadata: { order_id: order.id, restaurant_slug: restaurant.slug },
    });

    await admin
      .from("qr_menu_2_orders")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ checkoutUrl: session.url, orderId: order.id });
  } catch {
    return NextResponse.json({ error: "Stripe checkout failed to start" }, { status: 502 });
  }
}
