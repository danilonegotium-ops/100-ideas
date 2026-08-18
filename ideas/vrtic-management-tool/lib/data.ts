import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AttendanceRecord,
  Child,
  ChildContact,
  DailyMenu,
  Group,
  PhotoPost,
} from "./types";

/**
 * Small, isolated Supabase read functions — each takes an already-created
 * client so they're easy to unit test / review independently of Next.js
 * request plumbing (same pattern as digitalni-upravnik).
 */

export async function getTeacherGroups(
  supabase: SupabaseClient,
  teacherId: string,
): Promise<Group[]> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_groups")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getGroupById(
  supabase: SupabaseClient,
  groupId: string,
): Promise<Group | null> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getChildren(
  supabase: SupabaseClient,
  groupId: string,
): Promise<Child[]> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_children")
    .select("*")
    .eq("group_id", groupId)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getChildContactsByChildIds(
  supabase: SupabaseClient,
  childIds: string[],
): Promise<Map<string, ChildContact>> {
  if (childIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("vrtic_management_tool_child_contacts")
    .select("*")
    .in("child_id", childIds);
  if (error) throw error;
  return new Map((data ?? []).map((c) => [c.child_id as string, c as ChildContact]));
}

/** Groups (with linked child) that the logged-in parent has access to. */
export async function getGroupsForParent(
  supabase: SupabaseClient,
): Promise<{ group: Group; child: Child }[]> {
  const { data: children, error } = await supabase
    .from("vrtic_management_tool_children")
    .select("*");
  if (error) throw error;
  if (!children || children.length === 0) return [];

  const groupIds = Array.from(new Set(children.map((c) => c.group_id as string)));
  const { data: groups, error: groupsError } = await supabase
    .from("vrtic_management_tool_groups")
    .select("*")
    .in("id", groupIds);
  if (groupsError) throw groupsError;

  const groupsById = new Map((groups ?? []).map((g) => [g.id as string, g as Group]));
  return (children as Child[])
    .filter((child) => groupsById.has(child.group_id))
    .map((child) => ({ group: groupsById.get(child.group_id)!, child }));
}

export async function getAttendanceForGroup(
  supabase: SupabaseClient,
  groupId: string,
  sinceDate: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_attendance_records")
    .select("*")
    .eq("group_id", groupId)
    .gte("attendance_date", sinceDate)
    .order("attendance_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAttendanceForChild(
  supabase: SupabaseClient,
  childId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_attendance_records")
    .select("*")
    .eq("child_id", childId)
    .order("attendance_date", { ascending: false })
    .limit(14);
  if (error) throw error;
  return data ?? [];
}

export async function getDailyMenus(
  supabase: SupabaseClient,
  groupId: string,
  limit = 7,
): Promise<DailyMenu[]> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_daily_menus")
    .select("*")
    .eq("group_id", groupId)
    .order("menu_date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getPhotoPosts(
  supabase: SupabaseClient,
  groupId: string,
): Promise<PhotoPost[]> {
  const { data, error } = await supabase
    .from("vrtic_management_tool_photo_posts")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Pure function — builds a childId -> (dateISO -> status) lookup for a grid view. */
export function buildAttendanceGrid(
  records: AttendanceRecord[],
): Map<string, Map<string, AttendanceRecord>> {
  const grid = new Map<string, Map<string, AttendanceRecord>>();
  for (const record of records) {
    if (!grid.has(record.child_id)) grid.set(record.child_id, new Map());
    grid.get(record.child_id)!.set(record.attendance_date, record);
  }
  return grid;
}

/** Pure function — last N calendar dates (ISO, newest last), for a grid header row. */
export function lastNDates(n: number, today: Date = new Date()): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}
