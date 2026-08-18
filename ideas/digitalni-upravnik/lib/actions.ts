"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Actions — each one is a small isolated function that opens its own
 * request-scoped Supabase client, does one write, and revalidates the page
 * that needs the fresh data. Authorization is enforced twice: once here
 * (redirect/404 if the caller obviously shouldn't be here) and again by the
 * database via the RLS policies in schema.sql (the real source of truth —
 * these UI-level checks are just for a better error experience).
 */

async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createBuilding(formData: FormData) {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (!name || !address) redirect("/dashboard?error=Ime i adresa su obavezni.");

  const { data, error } = await supabase
    .from("digitalni_upravnik_buildings")
    .insert({ manager_id: user.id, name, address })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/dashboard?error=Greška pri kreiranju zgrade.");
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/${data.id}`);
}

export async function addUnit(buildingId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const label = String(formData.get("label") ?? "").trim();
  const floorRaw = String(formData.get("floor") ?? "").trim();
  const feeRaw = String(formData.get("monthly_fee") ?? "").trim();
  const ownerName = String(formData.get("owner_name") ?? "").trim();
  const tenantName = String(formData.get("tenant_name") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();

  if (!label) redirect(`/dashboard/${buildingId}?error=Oznaka stana je obavezna.`);

  const floor = floorRaw ? Number(floorRaw) : null;
  const monthlyFee = feeRaw ? Number(feeRaw) : 0;

  const { data: unit, error } = await supabase
    .from("digitalni_upravnik_units")
    .insert({ building_id: buildingId, label, floor, monthly_fee: monthlyFee })
    .select("id")
    .single();

  if (error || !unit) {
    redirect(`/dashboard/${buildingId}?error=Greška pri dodavanju stana (proverite da li ste upravnik ove zgrade).`);
  }

  if (ownerName || tenantName || contactEmail) {
    await supabase.from("digitalni_upravnik_unit_contacts").insert({
      unit_id: unit.id,
      owner_name: ownerName || null,
      tenant_name: tenantName || null,
      contact_email: contactEmail || null,
    });
  }

  revalidatePath(`/dashboard/${buildingId}`);
  revalidatePath(`/b/${buildingId}`);
}

export async function addFundTransaction(buildingId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const occurredOn = String(formData.get("occurred_on") ?? "").trim();

  if (!description || !amountRaw) {
    redirect(`/dashboard/${buildingId}?error=Opis i iznos su obavezni.`);
  }

  const amount = Number(amountRaw);
  if (Number.isNaN(amount)) {
    redirect(`/dashboard/${buildingId}?error=Iznos mora biti broj.`);
  }

  const { error } = await supabase.from("digitalni_upravnik_fund_transactions").insert({
    building_id: buildingId,
    description,
    amount,
    occurred_on: occurredOn || new Date().toISOString().slice(0, 10),
  });

  if (error) {
    redirect(`/dashboard/${buildingId}?error=Greška pri unosu transakcije.`);
  }

  revalidatePath(`/dashboard/${buildingId}`);
  revalidatePath(`/b/${buildingId}`);
}

export async function addNotice(buildingId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const pinned = formData.get("pinned") === "on";

  if (!title || !body) {
    redirect(`/dashboard/${buildingId}?error=Naslov i tekst obaveštenja su obavezni.`);
  }

  const { error } = await supabase.from("digitalni_upravnik_notices").insert({
    building_id: buildingId,
    title,
    body,
    pinned,
  });

  if (error) {
    redirect(`/dashboard/${buildingId}?error=Greška pri objavljivanju obaveštenja.`);
  }

  revalidatePath(`/dashboard/${buildingId}`);
  revalidatePath(`/b/${buildingId}`);
}

export async function createVote(buildingId: string, formData: FormData) {
  const { supabase } = await requireUser();

  const question = String(formData.get("question") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const daysOpenRaw = String(formData.get("days_open") ?? "7").trim();
  const daysOpen = Number(daysOpenRaw) || 7;

  const options = [
    formData.get("option_1"),
    formData.get("option_2"),
    formData.get("option_3"),
    formData.get("option_4"),
  ]
    .map((o) => String(o ?? "").trim())
    .filter((o) => o.length > 0);

  if (!question || options.length < 2) {
    redirect(`/dashboard/${buildingId}?error=Pitanje i bar dve opcije su obavezni.`);
  }

  const closesAt = new Date(Date.now() + daysOpen * 24 * 60 * 60 * 1000).toISOString();

  const { data: vote, error } = await supabase
    .from("digitalni_upravnik_votes")
    .insert({
      building_id: buildingId,
      question,
      description: description || null,
      closes_at: closesAt,
    })
    .select("id")
    .single();

  if (error || !vote) {
    redirect(`/dashboard/${buildingId}?error=Greška pri kreiranju glasanja.`);
  }

  const optionRows = options.map((label, index) => ({
    vote_id: vote.id,
    label,
    position: index,
  }));
  await supabase.from("digitalni_upravnik_vote_options").insert(optionRows);

  revalidatePath(`/dashboard/${buildingId}`);
  revalidatePath(`/b/${buildingId}`);
}

/**
 * Public — no login required. Any visitor with the board link can cast one
 * vote per unit. The database is the real gate (unique(vote_id, unit_id) +
 * the "vote still open" RLS check on insert); this action just surfaces a
 * friendlier error message.
 */
export async function castVote(buildingId: string, voteId: string, formData: FormData) {
  const supabase = createClient();

  const unitId = String(formData.get("unit_id") ?? "");
  const optionId = String(formData.get("option_id") ?? "");

  if (!unitId || !optionId) {
    redirect(`/b/${buildingId}?error=Izaberite stan i opciju.`);
  }

  const { error } = await supabase.from("digitalni_upravnik_vote_responses").insert({
    vote_id: voteId,
    option_id: optionId,
    unit_id: unitId,
  });

  if (error) {
    // Most likely cause: this unit already voted (unique constraint), or
    // the vote has closed since the page loaded.
    redirect(`/b/${buildingId}?error=Ovaj stan je već glasao ili je glasanje zatvoreno.`);
  }

  revalidatePath(`/b/${buildingId}`);
  redirect(`/b/${buildingId}?voted=1`);
}
