import { NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

const CITIES = ["Belgrade", "Novi Sad"];
const SLEEP_SCHEDULES = ["early_bird", "night_owl", "flexible"];
const CLEANLINESS_LEVELS = ["very_clean", "average", "messy"];
const SOCIAL_STYLES = ["quiet", "social", "mixed"];
const MAX_BIO_LENGTH = 1000;

/** Creates or updates the signed-in user's own profile (one row per user). */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Log in first." }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    displayName,
    city,
    area,
    university,
    budgetMin,
    budgetMax,
    sleepSchedule,
    cleanliness,
    socialStyle,
    smoker,
    petsOk,
    bio,
  } = payload as Record<string, unknown>;

  const trimmedName = typeof displayName === "string" ? displayName.trim() : "";
  if (!trimmedName) {
    return NextResponse.json({ error: "Enter a display name." }, { status: 400 });
  }
  if (typeof city !== "string" || !CITIES.includes(city)) {
    return NextResponse.json({ error: "Pick Belgrade or Novi Sad." }, { status: 400 });
  }
  const min = Number(budgetMin);
  const max = Number(budgetMax);
  if (!Number.isFinite(min) || min <= 0) {
    return NextResponse.json({ error: "Enter a valid minimum budget." }, { status: 400 });
  }
  if (!Number.isFinite(max) || max < min) {
    return NextResponse.json(
      { error: "Maximum budget must be at least the minimum." },
      { status: 400 },
    );
  }
  if (typeof sleepSchedule !== "string" || !SLEEP_SCHEDULES.includes(sleepSchedule)) {
    return NextResponse.json({ error: "Pick a valid sleep schedule." }, { status: 400 });
  }
  if (typeof cleanliness !== "string" || !CLEANLINESS_LEVELS.includes(cleanliness)) {
    return NextResponse.json({ error: "Pick a valid cleanliness level." }, { status: 400 });
  }
  if (typeof socialStyle !== "string" || !SOCIAL_STYLES.includes(socialStyle)) {
    return NextResponse.json({ error: "Pick a valid social style." }, { status: 400 });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("roommate_matcher_profiles")
    .upsert(
      {
        user_id: user.id,
        display_name: trimmedName,
        city,
        area: typeof area === "string" && area.trim() ? area.trim().slice(0, 200) : null,
        university:
          typeof university === "string" && university.trim()
            ? university.trim().slice(0, 200)
            : null,
        budget_min: Math.round(min),
        budget_max: Math.round(max),
        sleep_schedule: sleepSchedule,
        cleanliness,
        social_style: socialStyle,
        smoker: Boolean(smoker),
        pets_ok: Boolean(petsOk),
        bio: typeof bio === "string" && bio.trim() ? bio.trim().slice(0, MAX_BIO_LENGTH) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Couldn't save your profile. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ profile: data });
}
