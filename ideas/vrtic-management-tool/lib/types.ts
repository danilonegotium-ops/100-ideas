export type Group = {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
};

export type Child = {
  id: string;
  group_id: string;
  full_name: string;
  birth_date: string | null;
  created_at: string;
};

export type ChildContact = {
  id: string;
  child_id: string;
  parent_name: string | null;
  parent_email: string | null;
  created_at: string;
};

export type AttendanceStatus = "present" | "absent" | "sick" | "excused";

export type AttendanceRecord = {
  id: string;
  child_id: string;
  group_id: string;
  attendance_date: string;
  status: AttendanceStatus;
  note: string | null;
  created_at: string;
};

export type DailyMenu = {
  id: string;
  group_id: string;
  menu_date: string;
  breakfast: string | null;
  lunch: string | null;
  snack: string | null;
  created_at: string;
};

export const PLACEHOLDER_KEYS = [
  "sun",
  "balloons",
  "painting",
  "blocks",
  "garden",
  "nap",
  "music",
  "story",
] as const;

export type PlaceholderKey = (typeof PLACEHOLDER_KEYS)[number];

export type PhotoPost = {
  id: string;
  group_id: string;
  caption: string;
  placeholder_key: PlaceholderKey;
  created_at: string;
};
