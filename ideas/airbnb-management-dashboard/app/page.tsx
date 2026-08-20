import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { StatTile } from "@/components/motion/StatTile";
import { AnimatedCard } from "@/components/motion/AnimatedCard";
import { GradientMesh } from "@/components/motion/GradientMesh";
import { EmptyState } from "@/components/motion/EmptyState";
import AmbientRevenueOrb from "@/components/three/AmbientRevenueOrb";
import { createClient, getUser } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { NewPropertyForm } from "./NewPropertyForm";

type PropertyRow = { id: string; name: string; address: string | null };
type BookingSummaryRow = {
  property_id: string;
  gross_payout: number;
  net_profit: number;
  check_in: string;
  nights: number;
};

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: properties } = await supabase
    .from("airbnb_management_dashboard_properties")
    .select("id, name, address")
    .order("created_at", { ascending: true })
    .returns<PropertyRow[]>();

  // Same table/columns as before, plus check_in + nights (both already exist
  // on the row — nights is a generated column) so the bento-grid metrics
  // below (occupancy, avg nightly rate, upcoming bookings) can be computed
  // from real data instead of only the gross/net totals the old page used.
  const { data: bookings } = await supabase
    .from("airbnb_management_dashboard_bookings")
    .select("property_id, gross_payout, net_profit, check_in, nights")
    .returns<BookingSummaryRow[]>();

  const totalsByProperty = new Map<string, { gross: number; net: number; count: number }>();
  let totalGross = 0;
  let totalNet = 0;
  let totalNights = 0;
  let nightsTrailingYear = 0;
  let upcomingCount = 0;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yearAgo = new Date(today);
  yearAgo.setDate(yearAgo.getDate() - 365);
  const yearAgoStr = yearAgo.toISOString().slice(0, 10);

  for (const booking of bookings ?? []) {
    const existing = totalsByProperty.get(booking.property_id) ?? {
      gross: 0,
      net: 0,
      count: 0,
    };
    existing.gross += Number(booking.gross_payout);
    existing.net += Number(booking.net_profit);
    existing.count += 1;
    totalsByProperty.set(booking.property_id, existing);

    totalGross += Number(booking.gross_payout);
    totalNet += Number(booking.net_profit);
    totalNights += Number(booking.nights);
    if (booking.check_in >= yearAgoStr) nightsTrailingYear += Number(booking.nights);
    if (booking.check_in > todayStr) upcomingCount += 1;
  }

  const propertiesCount = properties?.length ?? 0;
  const totalBookings = bookings?.length ?? 0;
  const avgNightlyRate = totalNights > 0 ? totalGross / totalNights : 0;
  const occupancyRate =
    propertiesCount > 0 ? Math.min((nightsTrailingYear / (365 * propertiesCount)) * 100, 100) : 0;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site-wide flex-1 px-5 py-8">
        <section className="relative mb-10 overflow-hidden rounded-xl2 border border-border bg-surface/40 px-6 py-10 sm:px-10">
          <GradientMesh animate />
          <AmbientRevenueOrb />
          <div className="relative">
            <h1 className="text-display text-fg">Dashboard</h1>
            <p className="mt-3 max-w-xl text-muted">
              Track true profit after platform fees, cleaning, and other
              costs — across every property, updated live.
            </p>
          </div>
        </section>

        {/* Bento grid — asymmetric tile sizing so net revenue (the number
            hosts care about most) reads as visually largest, occupancy and
            gross revenue as the next tier, and per-booking detail stats as
            the smallest tiles. Every number here comes from the same
            bookings/properties query above — this only changes how it's
            presented. */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[150px]">
          <StatTile
            className="flex flex-col justify-center sm:col-span-2 lg:col-span-2 lg:row-span-2"
            label="Net revenue (all time)"
            value={totalNet}
            prefix="€"
            decimals={0}
            trend="After platform fees, cleaning & other costs"
            trendTone="positive"
          />
          <StatTile
            className="flex flex-col justify-center sm:col-span-2 lg:col-span-2"
            label="Occupancy (trailing 12 months)"
            value={occupancyRate}
            suffix="%"
            decimals={1}
            trend={`${nightsTrailingYear} nights booked across ${propertiesCount} propert${propertiesCount === 1 ? "y" : "ies"}`}
          />
          <StatTile
            className="flex flex-col justify-center"
            label="Avg nightly rate"
            value={avgNightlyRate}
            prefix="€"
            decimals={0}
          />
          <StatTile
            className="flex flex-col justify-center"
            label="Upcoming bookings"
            value={upcomingCount}
            decimals={0}
          />
          <StatTile
            className="flex flex-col justify-center sm:col-span-2 lg:col-span-2"
            label="Gross revenue (all time)"
            value={totalGross}
            prefix="€"
            decimals={0}
          />
          <StatTile
            className="flex flex-col justify-center sm:col-span-2 lg:col-span-2"
            label="Total bookings"
            value={totalBookings}
            decimals={0}
            trend={`${propertiesCount} propert${propertiesCount === 1 ? "y" : "ies"} managed`}
          />
        </div>

        <div className="mb-8">
          <NewPropertyForm />
        </div>

        <h2 className="mb-3 text-title text-fg">Properties</h2>
        {!properties || properties.length === 0 ? (
          <EmptyState
            title="No properties yet"
            description="Add your first property above to start tracking bookings and profit."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {properties.map((property, i) => {
              const totals = totalsByProperty.get(property.id) ?? {
                gross: 0,
                net: 0,
                count: 0,
              };
              return (
                <li key={property.id}>
                  <Link href={`/properties/${property.id}`}>
                    <AnimatedCard index={i} className="transition-colors hover:border-accent">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium">{property.name}</p>
                          {property.address && (
                            <p className="text-sm text-muted">{property.address}</p>
                          )}
                          <p className="mt-1 text-sm text-muted">
                            {totals.count} booking{totals.count === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm text-muted">
                            Gross {formatMoney(totals.gross)}
                          </p>
                          <p className="text-lg font-semibold text-accent">
                            Net {formatMoney(totals.net)}
                          </p>
                        </div>
                      </div>
                    </AnimatedCard>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
