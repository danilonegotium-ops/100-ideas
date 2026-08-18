/**
 * Room-count is a closed set (not free text) so filtering/sorting stays
 * reliable and the API route can validate submissions against it exactly.
 */
export const ROOM_OPTIONS = ["studio", "1", "2", "3", "4", "5+"] as const;

export type RoomOption = (typeof ROOM_OPTIONS)[number];

export function isRoomOption(value: unknown): value is RoomOption {
  return (
    typeof value === "string" &&
    (ROOM_OPTIONS as readonly string[]).includes(value)
  );
}

export function roomLabel(rooms: RoomOption): string {
  return rooms === "studio" ? "Studio" : `${rooms} room${rooms === "1" ? "" : "s"}`;
}
