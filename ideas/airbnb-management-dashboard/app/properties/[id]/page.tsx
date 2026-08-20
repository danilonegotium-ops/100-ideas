import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Button } from "@/components/Button";
import { StatTile } from "@/components/motion/StatTile";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { EmptyState } from "@/components/motion/EmptyState";
import { createClient, getUser } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { NewBookingForm } from "./NewBookingForm";

type Property = {
  id: string;
  name: string;
  address: string | null;
  default_platform_fee_pct: number;
  default_cleaning_fee: number;
};

type Booking = {
  id: string;
  guest_name: string | null;
  check_in: string;
  check_out: string;
  nights: number;
  gross_payout: number;
  platform_fee_pct: number;
  cleaning_fee: number;
  other_costs: number;
  net_profit: number;
  notes: string | null;
};

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: property } = await supabase
    .from("airbnb_management_dashboard_properties")
    .select("id, name, address, default_platform_fee_pct, default_cleaning_fee")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle<Property>();

  if (!property) notFound();

  let query = supabase
    .from("airbnb_management_dashboard_bookings")
    .select(
      "id, guest_name, check_in, check_out, nights, gross_payout, platform_fee_pct, cleaning_fee, other_costs, net_profit, notes",
    )
    .eq("property_id", property.id)
    .order("check_in", { ascending: false });

  if (searchParams.from) query = query.gte("check_in", searchParams.from);
  if (searchParams.to) query = query.lte("check_in", searchParams.to);

  const { data: bookings } = await query.returns<Booking[]>();

  const totals = (bookings ?? []).reduce(
    (acc, b) => ({
      gross: acc.gross + Number(b.gross_payout),
      cleaningAndOther: acc.cleaningAndOther + Number(b.cleaning_fee) + Number(b.other_costs),
      fees: acc.fees + (Number(b.gross_payout) * Number(b.platform_fee_pct)) / 100,
      net: acc.net + Number(b.net_profit),
    }),
    { gross: 0, cleaningAndOther: 0, fees: 0, net: 0 },
  );

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site-wide flex-1 px-5 py-8">
        <section className="relative mb-8 overflow-hidden rounded-xl2 border border-border bg-surface/40 px-6 py-8 sm:px-8">
          <GradientMesh />
          <div className="relative">
            <Link href="/" className="mb-4 inline-block text-sm text-muted hover:text-fg">
              &larr; all properties
            </Link>
            <h1 className="text-headline text-fg">{property.name}</h1>
            {property.address && <p className="mt-1 text-muted">{property.address}</p>}

            <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
              <div className="w-40">
                <label htmlFor="from">From (check-in)</label>
                <input id="from" name="from" type="date" defaultValue={searchParams.from} />
              </div>
              <div className="w-40">
                <label htmlFor="to">To (check-in)</label>
                <input id="to" name="to" type="date" defaultValue={searchParams.to} />
              </div>
              <Button type="submit" variant="secondary">
                Filter
              </Button>
              {(searchParams.from || searchParams.to) && (
                <Link
                  href={`/properties/${property.id}`}
                  className="text-sm text-muted hover:text-fg"
                >
                  Clear
                </Link>
              )}
            </form>
          </div>
        </section>

        {/* Same totals reduce() as before, just rendered via StatTile — net
            profit gets the widest tile since it's the number that matters
            most, mirroring the home page's bento pattern at a smaller
            scale. */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatTile
            className="flex flex-col justify-center sm:col-span-2"
            label="Net profit"
            value={totals.net}
            prefix="€"
            decimals={0}
            trendTone="positive"
          />
          <StatTile
            className="flex flex-col justify-center"
            label="Gross"
            value={totals.gross}
            prefix="€"
            decimals={0}
          />
          <StatTile
            className="flex flex-col justify-center"
            label="Platform fees"
            value={totals.fees}
            prefix="€"
            decimals={0}
          />
          <StatTile
            className="flex flex-col justify-center sm:col-span-2"
            label="Cleaning + other costs"
            value={totals.cleaningAndOther}
            prefix="€"
            decimals={0}
          />
        </div>

        <div className="mb-8">
          <NewBookingForm
            propertyId={property.id}
            defaultPlatformFeePct={property.default_platform_fee_pct}
            defaultCleaningFee={property.default_cleaning_fee}
          />
        </div>

        <h2 className="mb-3 text-title text-fg">Bookings</h2>
        {!bookings || bookings.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            description="Add a booking above to start tracking profit for this property."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {bookings.map((booking, i) => (
              <li key={booking.id}>
                <AnimatedCard index={i}>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium">{booking.guest_name || "Guest"}</p>
                      <p className="text-sm text-muted">
                        {booking.check_in} → {booking.check_out} ({booking.nights} night
                        {booking.nights === 1 ? "" : "s"})
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Gross {formatMoney(booking.gross_payout)} · Fee{" "}
                        {booking.platform_fee_pct}% · Cleaning{" "}
                        {formatMoney(booking.cleaning_fee)}
                        {Number(booking.other_costs) > 0 &&
                          ` · Other ${formatMoney(booking.other_costs)}`}
                      </p>
                      {booking.notes && (
                        <p className="mt-1 text-sm text-muted">{booking.notes}</p>
                      )}
                    </div>
                    <p className="shrink-0 text-lg font-semibold text-accent">
                      {formatMoney(booking.net_profit)}
                    </p>
                  </div>
                </AnimatedCard>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
