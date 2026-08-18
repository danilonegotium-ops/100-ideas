/**
 * Curated list of common home system/appliance categories. Kept as a fixed
 * enum (rather than free text) so the dashboard can group/filter reliably
 * and so seed data + validation stay in sync. "Other" is the escape hatch
 * for anything not covered.
 */
export const SYSTEM_CATEGORIES = [
  "HVAC / Furnace",
  "Air Conditioning",
  "Water Heater",
  "Boiler",
  "Roof",
  "Gutters",
  "Chimney / Fireplace",
  "Plumbing",
  "Electrical Panel",
  "Water Softener",
  "Sump Pump",
  "Septic System",
  "Refrigerator",
  "Washer / Dryer",
  "Dishwasher",
  "Garage Door",
  "Pool / Spa",
  "Smoke & CO Detectors",
  "Other",
] as const;

export type SystemCategory = (typeof SYSTEM_CATEGORIES)[number];

export function isSystemCategory(value: unknown): value is SystemCategory {
  return (
    typeof value === "string" &&
    (SYSTEM_CATEGORIES as readonly string[]).includes(value)
  );
}
