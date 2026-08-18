export type Size = "small" | "medium" | "large";
export type EnergyLevel = "low" | "medium" | "high";

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
  size: Size | null;
  energy_level: EnergyLevel | null;
  neighborhood: string;
  bio: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface Swipe {
  id: string;
  from_dog_id: string;
  to_dog_id: string;
  direction: "yes" | "no";
  created_at: string;
}
