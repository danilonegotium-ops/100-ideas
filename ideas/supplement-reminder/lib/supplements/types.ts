export interface Supplement {
  id: string;
  owner_id: string;
  name: string;
  dose: string;
  schedule_time: string; // "HH:MM:SS" (Postgres `time`)
  pills_per_dose: number;
  pills_remaining: number;
  low_stock_threshold_doses: number;
  created_at: string;
}

export interface SupplementLog {
  id: string;
  owner_id: string;
  supplement_id: string;
  taken_at: string;
  taken_date: string; // "YYYY-MM-DD"
}
