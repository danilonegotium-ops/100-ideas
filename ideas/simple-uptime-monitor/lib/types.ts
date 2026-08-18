export interface Monitor {
  id: string;
  url: string;
  label: string | null;
  last_status: "unknown" | "up" | "down";
  last_checked_at: string | null;
  created_at: string;
}

export interface CheckLogRow {
  id: string;
  monitor_id: string;
  status: "up" | "down";
  status_code: number | null;
  response_ms: number | null;
  checked_at: string;
}
