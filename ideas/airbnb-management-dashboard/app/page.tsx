import { redirect } from "next/navigation";
import Link from "next/link";
import { Nav } from "@/components/Nav";
import { Card } from "@/components/Card";
import { createClient, getUser } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/money";
import { NewPropertyForm } from "./NewPropertyForm";

type PropertyRow = { id: string; name: string; address: string | null };
type BookingSummaryRow = { property_id: string; gross_payout: number; net_profit: number };

export default async function Home() {
  const user = await getUser();
  if (!user) redirect("/login");

  const supabase = createClient();
  const { data: properties } = await supabase
    .from("airbnb_management_dashboard_properties")
    .select("id, name, address")
    .order("created_at", { ascending: true })
    .returns<PropertyRow[]>();

  const { data: bookings } = await supabase
    .from("airbnb_management_dashboard_bookings")
    .select("property_id, gross_payout, net_profit")
    .returns<BookingSummaryRow[]>();

  const totalsByProperty = new Map<string, { gross: number; net: number; count: number }>();
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
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-site flex-1 px-5 py-8">
        <h1 className="mb-2 text-2xl font-semibold">Your properties</h1>
        <p className="mb-6 text-muted">
          Track true profit after platform fees, cleaning, and other costs
          — all time, per property.
        </p>

        <div className="mb-8">
          <NewPropertyForm />
        </div>

        {!properties || properties.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">No properties yet — add one above.</p>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {properties.map((property) => {
              const totals = totalsByProperty.get(property.id) ?? {
                gross: 0,
                net: 0,
                count: 0,
              };
              return (
                <li key={property.id}>
                  <Link href={`/properties/${property.id}`}>
                    <Card className="transition-colors hover:border-accent">
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
                    </Card>
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
