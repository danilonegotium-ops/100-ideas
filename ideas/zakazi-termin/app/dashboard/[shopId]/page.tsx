import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { createClient, getUser } from "@/lib/supabase/server";
import {
  bookingsBySlotId,
  getAllUpcomingSlots,
  getBookingsForShop,
  getShopById,
  groupSlotsByDay,
} from "@/lib/data";
import { addSlotsForDay, cancelBooking } from "@/lib/actions";

export default async function ShopDashboardPage({
  params,
  searchParams,
}: {
  params: { shopId: string };
  searchParams: { error?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const shop = await getShopById(supabase, params.shopId);
  if (!shop || shop.owner_id !== user.id) notFound();

  const [slots, bookings] = await Promise.all([
    getAllUpcomingSlots(supabase, shop.id),
    getBookingsForShop(supabase, shop.id),
  ]);
  const byDay = groupSlotsByDay(slots);
  const bookingBySlot = bookingsBySlotId(bookings);
  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="mb-1 text-2xl font-semibold">{shop.name}</h1>
            <p className="text-muted">{shop.address}</p>
          </div>
          <Link href={`/s/${shop.id}`} target="_blank">
            <Button variant="secondary">Otvori javnu stranicu salona &rarr;</Button>
          </Link>
        </div>

        {searchParams.error && (
          <p className="mb-4 text-sm text-danger">{searchParams.error}</p>
        )}

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">
            Kalendar termina ({confirmedBookings.length} rezervisano)
          </h2>
          <div className="mb-3 flex flex-col gap-3">
            {byDay.size === 0 ? (
              <Card>
                <p className="text-sm text-muted">Još nema otvorenih termina.</p>
              </Card>
            ) : (
              Array.from(byDay.entries()).map(([day, daySlots]) => (
                <Card key={day}>
                  <h3 className="mb-2 font-medium">{day}</h3>
                  <div className="flex flex-col gap-1 text-sm">
                    {daySlots.map((slot) => {
                      const booking = bookingBySlot.get(slot.id);
                      const time = new Date(slot.starts_at).toLocaleTimeString("sr-RS", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                      return (
                        <div
                          key={slot.id}
                          className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1 last:border-0 last:pb-0"
                        >
                          <span>
                            {time} · {slot.service_name}
                          </span>
                          {booking ? (
                            <span className="flex items-center gap-2">
                              <span className="text-accent">
                                {booking.customer_name} ({booking.customer_email})
                              </span>
                              <form action={cancelBooking.bind(null, shop.id, booking.id, slot.id)}>
                                <Button variant="danger" type="submit" className="!px-2 !py-1 text-xs">
                                  Otkaži
                                </Button>
                              </form>
                            </span>
                          ) : (
                            <span className="text-muted">
                              {slot.status === "cancelled" ? "otkazano" : "slobodno"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              ))
            )}
          </div>
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-muted">Otvori termine za dan</h3>
            <form
              action={addSlotsForDay.bind(null, shop.id)}
              className="grid gap-3 sm:grid-cols-2"
            >
              <div>
                <label htmlFor="date">Datum</label>
                <input id="date" name="date" type="date" required />
              </div>
              <div>
                <label htmlFor="service_name">Usluga</label>
                <input id="service_name" name="service_name" required placeholder="npr. Šišanje" />
              </div>
              <div>
                <label htmlFor="start_time">Početak radnog vremena</label>
                <input id="start_time" name="start_time" type="time" defaultValue="09:00" required />
              </div>
              <div>
                <label htmlFor="end_time">Kraj radnog vremena</label>
                <input id="end_time" name="end_time" type="time" defaultValue="17:00" required />
              </div>
              <div>
                <label htmlFor="duration_minutes">Trajanje termina (minuti)</label>
                <input
                  id="duration_minutes"
                  name="duration_minutes"
                  type="number"
                  min={5}
                  defaultValue={30}
                  required
                />
              </div>
              <div className="flex items-end">
                <Button type="submit">Generiši termine</Button>
              </div>
            </form>
          </Card>
        </section>
      </main>
    </>
  );
}
