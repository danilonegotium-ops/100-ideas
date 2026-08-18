import type { RoomOption } from "./rooms";

export interface RentReport {
  id: string;
  city: string;
  neighborhood: string;
  rent_eur: number;
  rooms: RoomOption;
  size_m2: number | null;
  note: string | null;
  lat: number;
  lng: number;
  created_at: string;
}

/** Shape of the JSON body POSTed to `/api/reports`. */
export interface RentReportInput {
  city: string;
  neighborhood: string;
  rent_eur: number;
  rooms: string;
  size_m2: number | null;
  note: string | null;
  lat: number;
  lng: number;
}
