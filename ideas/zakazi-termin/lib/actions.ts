"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/serviceRoleClient";
import { generateSlotsForDay } from "@/lib/slots";
import { sendEmail } from "@/lib/email/sendEmail";

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createShop(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !address) redirect("/dashboard?error=Naziv i adresa su obavezni.");

  const { data, error } = await supabase
    .from("zakazi_termin_shops")
    .insert({ owner_id: user.id, name, address, description: description || null })
    .select("id")
    .single();

  if (error || !data) redirect("/dashboard?error=Greška pri kreiranju salona.");

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}

/**
 * Owner-facing: generates a run of back-to-back slots for one day in one
 * submission (e.g. "09:00-17:00, 30-minute slots"). Uses the pure
 * `generateSlotsForDay` for the actual math, then does a single batch
 * insert gated by the normal owner-only RLS policy on `slots`.
 */
export async function addSlotsForDay(shopId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const date = String(formData.get("date") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const durationMinutes = Number(formData.get("duration_minutes") ?? "30");
  const serviceName = String(formData.get("service_name") ?? "").trim();

  if (!date || !startTime || !endTime || !serviceName) {
    redirect(`/dashboard/${shopId}?error=Sva polja su obavezna.`);
  }

  let slots: ReturnType<typeof generateSlotsForDay>;
  try {
    slots = generateSlotsForDay({
      dateISO: date,
      startTime,
      endTime,
      durationMinutes,
      serviceName,
    });
  } catch {
    redirect(`/dashboard/${shopId}?error=Neispravno vreme.`);
  }

  if (slots.length === 0) {
    redirect(`/dashboard/${shopId}?error=Nema termina u zadatom opsegu.`);
  }

  const { error } = await supabase
    .from("zakazi_termin_slots")
    .insert(slots.map((slot) => ({ ...slot, shop_id: shopId })));

  if (error) redirect(`/dashboard/${shopId}?error=Greška pri dodavanju termina.`);

  revalidatePath(`/dashboard/${shopId}`);
  revalidatePath(`/s/${shopId}`);
}

/**
 * Public — no login required. Runs as the SERVICE ROLE (bypasses RLS) so
 * it can atomically check "is this slot still open" and, if so, insert the
 * booking AND flip the slot to 'booked' in one pass. This is the one place
 * in this idea's code that touches the service-role client — see the
 * comment in lib/supabase/serviceRoleClient.ts for why that's safe here
 * (narrow, validated, server-only) rather than a broad RLS hole.
 */
export async function bookSlot(
  shopId: string,
  slotId: string,
  formData: FormData,
): Promise<void> {
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "").trim();

  if (!customerName || !customerEmail) {
    redirect(`/s/${shopId}?error=Ime i email su obavezni.`);
  }

  const service = createServiceRoleClient();

  const { data: slot, error: slotError } = await service
    .from("zakazi_termin_slots")
    .select("id, status, starts_at, ends_at, service_name")
    .eq("id", slotId)
    .eq("shop_id", shopId)
    .maybeSingle();

  if (slotError || !slot) {
    redirect(`/s/${shopId}?error=Termin nije pronađen.`);
  }
  if (slot.status !== "open") {
    redirect(`/s/${shopId}?error=Ovaj termin je upravo zauzet, izaberite drugi.`);
  }

  const { error: bookingError } = await service.from("zakazi_termin_bookings").insert({
    slot_id: slotId,
    shop_id: shopId,
    customer_name: customerName,
    customer_email: customerEmail,
  });

  if (bookingError) {
    // Most likely the partial unique index caught a race (someone else
    // booked this slot a moment ago) — the slot's status may not have
    // flipped yet in that interleaving, so this check is what actually
    // protects against double-booking.
    redirect(`/s/${shopId}?error=Ovaj termin je upravo zauzet, izaberite drugi.`);
  }

  await service.from("zakazi_termin_slots").update({ status: "booked" }).eq("id", slotId);

  const { data: shop } = await service
    .from("zakazi_termin_shops")
    .select("name")
    .eq("id", shopId)
    .maybeSingle();

  await sendEmail({
    to: customerEmail,
    subject: `Potvrda termina — ${shop?.name ?? "Zakazi Termin"}`,
    html: `<p>Zdravo ${customerName},</p><p>Vaš termin (${slot.service_name}) je zakazan za ${new Date(slot.starts_at).toLocaleString("sr-RS")}.</p><p>Vidimo se!</p>`,
  });

  revalidatePath(`/s/${shopId}`);
  revalidatePath(`/dashboard/${shopId}`);
  redirect(`/s/${shopId}?booked=1`);
}

/**
 * Owner-initiated cancellation — runs as the normal authenticated user
 * (not service role), gated by the regular owner-only RLS policies on
 * both tables. Two sequential updates, not a single transaction — an
 * acceptable weekend-MVP tradeoff for a low-stakes admin action (see
 * SPEC.md).
 */
export async function cancelBooking(shopId: string, bookingId: string, slotId: string) {
  const { supabase } = await requireUser();

  await supabase
    .from("zakazi_termin_bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);

  await supabase.from("zakazi_termin_slots").update({ status: "open" }).eq("id", slotId);

  revalidatePath(`/dashboard/${shopId}`);
  revalidatePath(`/s/${shopId}`);
}
