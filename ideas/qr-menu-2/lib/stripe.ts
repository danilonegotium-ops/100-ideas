/**
 * Minimal Stripe REST client using plain `fetch`, not the `stripe` npm SDK.
 *
 * Why no SDK dependency: this is the only one of the 5 assigned ideas that
 * needs Stripe, the REST API's `checkout/sessions` shape has been stable
 * for years, and avoiding the SDK means one less dependency whose exact
 * current method signatures would otherwise have to be guessed at without
 * being able to test against a live account yet. All calls are guarded by
 * `isStripeConfigured()` — see app/api/checkout/route.ts for the demo-mode
 * fallback when `STRIPE_SECRET_KEY` isn't set.
 */

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Flattens a nested object into Stripe's `field[sub][sub2]=value` form-encoding. */
function appendFormParams(
  params: URLSearchParams,
  value: unknown,
  keyPath: string,
) {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => appendFormParams(params, item, `${keyPath}[${index}]`));
  } else if (typeof value === "object") {
    Object.entries(value as Record<string, unknown>).forEach(([key, val]) =>
      appendFormParams(params, val, `${keyPath}[${key}]`),
    );
  } else {
    params.append(keyPath, String(value));
  }
}

function toFormBody(fields: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(fields).forEach(([key, value]) => appendFormParams(params, value, key));
  return params;
}

async function stripeRequest(
  path: string,
  method: "GET" | "POST",
  fields?: Record<string, unknown>,
) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  const res = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      ...(fields ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: fields ? toFormBody(fields).toString() : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    const message = data?.error?.message ?? `Stripe request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export interface StripeLineItem {
  name: string;
  unitAmountCents: number;
  quantity: number;
}

export interface StripeCheckoutSession {
  id: string;
  url: string | null;
}

export async function createCheckoutSession(params: {
  lineItems: StripeLineItem[];
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}): Promise<StripeCheckoutSession> {
  return stripeRequest("/checkout/sessions", "POST", {
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: params.metadata,
    line_items: params.lineItems.map((item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "usd",
        unit_amount: item.unitAmountCents,
        product_data: { name: item.name },
      },
    })),
  });
}

export interface StripeCheckoutSessionStatus {
  id: string;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  status: "open" | "complete" | "expired";
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<StripeCheckoutSessionStatus> {
  return stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`, "GET");
}
