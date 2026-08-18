import { isRoomOption } from "./rooms";
import type { RentReportInput } from "./types";

/**
 * Sanity-check bounds used to reject wildly implausible submissions before
 * they ever reach the database. These are deliberate, generous product
 * guardrails picked by judgment (not sourced from a live rent index) —
 * wide enough to admit any genuine report, narrow enough to block obvious
 * spam/typos (e.g. "5" or "999999" EUR/month). The DB's own CHECK
 * constraints in `schema.sql` use a looser upper bound as a second,
 * independent backstop in case this file's logic is ever bypassed.
 */
export const MIN_RENT_EUR = 30;
export const MAX_RENT_EUR = 5000;
export const MAX_SIZE_M2 = 1000;
export const MAX_CITY_LENGTH = 100;
export const MAX_NEIGHBORHOOD_LENGTH = 100;
export const MAX_NOTE_LENGTH = 500;

/**
 * Rough bounding box around Serbia (with margin) — this idea is scoped to
 * Serbia for the MVP (matches the seed data and the rest of this sprint's
 * Serbia focus, e.g. `solar-panel-roi-calculator`'s RS-specific constants).
 * Loosening this to other countries later is a one-line change here.
 */
export const SERBIA_BOUNDS = {
  minLat: 40,
  maxLat: 47,
  minLng: 18,
  maxLng: 24,
};

/**
 * Rounds a coordinate to 2 decimal places (~1.1km grid) before it's ever
 * stored — a technical enforcement of the idea's own "neighborhood-level
 * pin, not an exact address" framing, not just a UI suggestion. Applied
 * server-side so it can't be bypassed by calling the API directly.
 */
export function roundCoordinate(value: number): number {
  return Math.round(value * 100) / 100;
}

export type ValidationResult =
  | { ok: true; value: RentReportInput }
  | { ok: false; error: string };

/**
 * Validates + normalizes an untyped JSON body into a clean
 * `RentReportInput`. Pure function (no I/O), so it's safe to unit-test
 * without a server or database.
 */
export function validateReportInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Invalid request body." };
  }
  const input = body as Record<string, unknown>;

  const city = typeof input.city === "string" ? input.city.trim() : "";
  if (!city) return { ok: false, error: "City is required." };
  if (city.length > MAX_CITY_LENGTH) return { ok: false, error: "City name is too long." };

  const neighborhood =
    typeof input.neighborhood === "string" ? input.neighborhood.trim() : "";
  if (!neighborhood) return { ok: false, error: "Neighborhood is required." };
  if (neighborhood.length > MAX_NEIGHBORHOOD_LENGTH) {
    return { ok: false, error: "Neighborhood name is too long." };
  }

  const rentEur = typeof input.rent_eur === "number" ? input.rent_eur : NaN;
  if (!Number.isFinite(rentEur)) {
    return { ok: false, error: "Monthly rent must be a number." };
  }
  if (rentEur < MIN_RENT_EUR || rentEur > MAX_RENT_EUR) {
    return {
      ok: false,
      error: `Monthly rent must be between €${MIN_RENT_EUR} and €${MAX_RENT_EUR}.`,
    };
  }

  const rooms = typeof input.rooms === "string" ? input.rooms : "";
  if (!isRoomOption(rooms)) {
    return { ok: false, error: "Choose a valid number of rooms." };
  }

  let sizeM2: number | null = null;
  if (input.size_m2 !== null && input.size_m2 !== undefined && input.size_m2 !== "") {
    const parsed = typeof input.size_m2 === "number" ? input.size_m2 : NaN;
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_SIZE_M2) {
      return { ok: false, error: "Size (m²) must be a realistic positive number." };
    }
    sizeM2 = parsed;
  }

  let note: string | null = null;
  if (typeof input.note === "string" && input.note.trim()) {
    const trimmed = input.note.trim();
    if (trimmed.length > MAX_NOTE_LENGTH) {
      return { ok: false, error: "Note is too long (max 500 characters)." };
    }
    note = trimmed;
  }

  const lat = typeof input.lat === "number" ? input.lat : NaN;
  const lng = typeof input.lng === "number" ? input.lng : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ok: false, error: "Pick a location on the map." };
  }
  if (
    lat < SERBIA_BOUNDS.minLat ||
    lat > SERBIA_BOUNDS.maxLat ||
    lng < SERBIA_BOUNDS.minLng ||
    lng > SERBIA_BOUNDS.maxLng
  ) {
    return { ok: false, error: "Please pick a location within Serbia." };
  }

  return {
    ok: true,
    value: {
      city,
      neighborhood,
      rent_eur: rentEur,
      rooms,
      size_m2: sizeM2,
      note,
      lat: roundCoordinate(lat),
      lng: roundCoordinate(lng),
    },
  };
}
