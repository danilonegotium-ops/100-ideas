import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GlassPanel } from "@/components/motion/GlassPanel";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient } from "@/lib/supabase/server";
import { getShopById, getUpcomingOpenSlots, groupSlotsByDay } from "@/lib/data";
import { bookSlot } from "@/lib/actions";

/**
 * Public booking page — no login required. See lib/actions.ts's `bookSlot`
 * for why the actual write happens through a service-role Server Action
 * instead of a direct RLS-gated insert from here.
 */
export default async function ShopPublicPage({
  params,
  searchParams,
}: {
  params: { shopId: string };
  searchParams: { error?: string; booked?: string };
}) {
  const supabase = createClient();
  const shop = await getShopById(supabase, params.shopId);
  if (!shop) notFound();

  const slots = await getUpcomingOpenSlots(supabase, shop.id);
  const byDay = groupSlotsByDay(slots);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <GlassPanel glow className="mb-6">
          <h1 className="mb-1 text-2xl font-semibold">{shop.name}</h1>
          <p className="text-muted">{shop.address}</p>
          {shop.description && <p className="mt-2 text-sm text-muted">{shop.description}</p>}
        </GlassPanel>

        {searchParams.booked && (
          <p className="mb-4 text-sm text-accent">
            Termin je zakazan! Ako je email potvrde konfigurisan, poslata vam je poruka.
          </p>
        )}
        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <h2 className="mb-3 text-lg font-semibold">Dostupni termini</h2>
        {byDay.size === 0 ? (
          <EmptyState title="Trenutno nema slobodnih termina." />
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from(byDay.entries()).map(([day, daySlots], i) => (
              <AnimatedCard key={day} index={i}>
                <h3 className="mb-3 font-medium">{day}</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {daySlots.map((slot) => {
                    const time = new Date(slot.starts_at).toLocaleTimeString("sr-RS", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <form
                        key={slot.id}
                        action={bookSlot.bind(null, shop.id, slot.id)}
                        className="flex flex-col gap-2 rounded-brand border border-border p-3"
                      >
                        <span className="text-sm font-medium">
                          {time} · {slot.service_name}
                        </span>
                        <input
                          name="customer_name"
                          placeholder="Vaše ime"
                          required
                          className="text-sm"
                        />
                        <input
                          name="customer_email"
                          type="email"
                          placeholder="Vaš email"
                          required
                          className="text-sm"
                        />
                        <Button type="submit" className="text-sm">
                          Zakaži
                        </Button>
                      </form>
                    );
                  })}
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
