import type { SupabaseClient } from "@supabase/supabase-js";
import type { Booking, Shop, Slot } from "./types";

/**
 * Small, isolated Supabase read functions — each takes an already-created
 * client so they're easy to unit test / review independently of Next.js
 * request plumbing (same pattern as the other Wave 3 ideas in this batch).
 */

export async function getOwnerShops(
  supabase: SupabaseClient,
  ownerId: string,
): Promise<Shop[]> {
  const { data, error } = await supabase
    .from("zakazi_termin_shops")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getShopById(
  supabase: SupabaseClient,
  shopId: string,
): Promise<Shop | null> {
  const { data, error } = await supabase
    .from("zakazi_termin_shops")
    .select("*")
    .eq("id", shopId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getUpcomingOpenSlots(
  supabase: SupabaseClient,
  shopId: string,
): Promise<Slot[]> {
  const { data, error } = await supabase
    .from("zakazi_termin_slots")
    .select("*")
    .eq("shop_id", shopId)
    .eq("status", "open")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAllUpcomingSlots(
  supabase: SupabaseClient,
  shopId: string,
): Promise<Slot[]> {
  const { data, error } = await supabase
    .from("zakazi_termin_slots")
    .select("*")
    .eq("shop_id", shopId)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getBookingsForShop(
  supabase: SupabaseClient,
  shopId: string,
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("zakazi_termin_bookings")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Pure function — groups slots by their calendar day (YYYY-MM-DD, local ISO date part). */
export function groupSlotsByDay<T extends { starts_at: string }>(slots: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const slot of slots) {
    const day = slot.starts_at.slice(0, 10);
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(slot);
  }
  return grouped;
}

/** Pure function — builds a slotId -> booking lookup for the owner calendar view. */
export function bookingsBySlotId(bookings: Booking[]): Map<string, Booking> {
  return new Map(
    bookings.filter((b) => b.status === "confirmed").map((b) => [b.slot_id, b]),
  );
}
