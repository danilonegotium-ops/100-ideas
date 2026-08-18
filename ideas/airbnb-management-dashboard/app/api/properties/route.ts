import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const address = typeof payload?.address === "string" ? payload.address.trim() : "";
  const defaultPlatformFeePct = Number(payload?.defaultPlatformFeePct ?? 3);
  const defaultCleaningFee = Number(payload?.defaultCleaningFee ?? 0);

  if (!name) {
    return NextResponse.json({ error: "Give the property a name." }, { status: 400 });
  }
  if (
    !Number.isFinite(defaultPlatformFeePct) ||
    defaultPlatformFeePct < 0 ||
    defaultPlatformFeePct > 100
  ) {
    return NextResponse.json(
      { error: "Platform fee % must be between 0 and 100." },
      { status: 400 },
    );
  }
  if (!Number.isFinite(defaultCleaningFee) || defaultCleaningFee < 0) {
    return NextResponse.json(
      { error: "Cleaning fee must be 0 or more." },
      { status: 400 },
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("airbnb_management_dashboard_properties")
    .insert({
      user_id: user.id,
      name,
      address: address || null,
      default_platform_fee_pct: defaultPlatformFeePct,
      default_cleaning_fee: defaultCleaningFee,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save the property. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ property: data }, { status: 201 });
}
