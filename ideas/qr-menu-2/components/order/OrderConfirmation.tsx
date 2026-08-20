"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/Card";
import { formatCents } from "@/lib/money";

export interface OrderConfirmationItem {
  id: string;
  name_snapshot: string;
  price_cents_snapshot: number;
  quantity: number;
}

const easeOutExpo = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutExpo } },
};

/**
 * Presentational-only checkout payoff. Every prop here is data the
 * (Server Component) success page already fetched/verified with Stripe
 * server-side — this component only renders it, it never fetches or writes
 * anything itself.
 */
export function OrderConfirmation({
  restaurantName,
  restaurantSlug,
  tableId,
  orderId,
  paymentStatus,
  items,
  customerNote,
  totalCents,
}: {
  restaurantName: string;
  restaurantSlug: string;
  tableId: string;
  orderId: string;
  paymentStatus: "unpaid" | "paid" | "demo";
  items: OrderConfirmationItem[];
  customerNote: string | null;
  totalCents: number;
}) {
  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
        className="glass glow-accent relative mb-6 overflow-hidden rounded-xl2 border border-border px-6 py-10 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.15 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 text-accent"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.4 }}
          className="text-headline text-fg"
        >
          Order placed
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-1 text-sm text-muted"
        >
          {restaurantName} · Order #{orderId.slice(0, 8)}
        </motion.p>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-6">
        {paymentStatus === "demo" && (
          <motion.div variants={item}>
            <Card className="border-accent">
              <p className="text-sm">
                <strong>Demo mode</strong> — payment isn&apos;t configured yet
                (no <code className="font-mono">STRIPE_SECRET_KEY</code>), so
                no charge was made. Your order was still recorded below,
                exactly as it would be with a real payment.
              </p>
            </Card>
          </motion.div>
        )}

        {paymentStatus === "paid" && (
          <motion.div variants={item}>
            <Card className="border-accent">
              <p className="text-sm">Payment confirmed via Stripe (test mode).</p>
            </Card>
          </motion.div>
        )}

        {paymentStatus === "unpaid" && (
          <motion.div variants={item}>
            <Card>
              <p className="text-sm text-muted">
                We haven&apos;t received payment confirmation yet. If you just
                completed checkout, refresh this page in a few seconds.
              </p>
            </Card>
          </motion.div>
        )}

        <motion.div variants={item}>
          <Card>
            <p className="mb-3 text-sm font-semibold">Order #{orderId.slice(0, 8)}</p>
            <div className="flex flex-col gap-2">
              {items.map((line) => (
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
            {customerNote && <p className="mt-3 text-sm text-muted">Note: {customerNote}</p>}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm font-semibold">
              <span>Total</span>
              <span>{formatCents(totalCents)}</span>
            </div>
          </Card>
        </motion.div>

        <motion.p variants={item}>
          <Link href={`/r/${restaurantSlug}/t/${tableId}`} className="text-sm text-accent">
            &larr; Back to menu
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
