import type { SystemCategory } from "./categories";

export interface Home {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface HomeSystem {
  id: string;
  home_id: string;
  name: string;
  category: SystemCategory | string;
  install_date: string | null;
  notes: string | null;
  created_at: string;
}

export interface ServiceEvent {
  id: string;
  system_id: string;
  service_date: string;
  description: string;
  cost: number | null;
  next_service_due: string | null;
  created_at: string;
}
