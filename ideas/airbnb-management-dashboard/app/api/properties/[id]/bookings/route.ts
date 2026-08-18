import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const supabase = createClient();
  const { data: property } = await supabase
    .from("airbnb_management_dashboard_properties")
    .select("id, default_platform_fee_pct, default_cleaning_fee")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!property) {
    return NextResponse.json(
      { error: "Property not found, or it isn't yours." },
      { status: 404 },
    );
  }

  const payload = await request.json().catch(() => null);
  const guestName = typeof payload?.guestName === "string" ? payload.guestName.trim() : "";
  const checkIn = typeof payload?.checkIn === "string" ? payload.checkIn : "";
  const checkOut = typeof payload?.checkOut === "string" ? payload.checkOut : "";
  const grossPayout = Number(payload?.grossPayout);
  const platformFeePct =
    payload?.platformFeePct !== undefined && payload?.platformFeePct !== ""
      ? Number(payload.platformFeePct)
      : Number(property.default_platform_fee_pct);
  const cleaningFee =
    payload?.cleaningFee !== undefined && payload?.cleaningFee !== ""
      ? Number(payload.cleaningFee)
      : Number(property.default_cleaning_fee);
  const otherCosts = Number(payload?.otherCosts ?? 0);
  const notes = typeof payload?.notes === "string" ? payload.notes.trim() : "";

  if (!checkIn || Number.isNaN(new Date(checkIn).getTime())) {
    return NextResponse.json({ error: "Pick a valid check-in date." }, { status: 400 });
  }
  if (!checkOut || Number.isNaN(new Date(checkOut).getTime())) {
    return NextResponse.json({ error: "Pick a valid check-out date." }, { status: 400 });
  }
  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: "Check-out must be after check-in." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(grossPayout) || grossPayout < 0) {
    return NextResponse.json(
      { error: "Enter a valid gross payout." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(platformFeePct) || platformFeePct < 0 || platformFeePct > 100) {
    return NextResponse.json(
      { error: "Platform fee % must be between 0 and 100." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(cleaningFee) || cleaningFee < 0) {
    return NextResponse.json(
      { error: "Cleaning fee must be 0 or more." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(otherCosts) || otherCosts < 0) {
    return NextResponse.json(
      { error: "Other costs must be 0 or more." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("airbnb_management_dashboard_bookings")
    .insert({
      property_id: property.id,
      user_id: user.id,
      guest_name: guestName || null,
      check_in: checkIn,
      check_out: checkOut,
      gross_payout: grossPayout,
      platform_fee_pct: platformFeePct,
      cleaning_fee: cleaningFee,
      other_costs: otherCosts,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save the booking. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ booking: data }, { status: 201 });
}
