export type Shop = {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  description: string | null;
  created_at: string;
};

export type SlotStatus = "open" | "booked" | "cancelled";

export type Slot = {
  id: string;
  shop_id: string;
  starts_at: string;
  ends_at: string;
  service_name: string;
  status: SlotStatus;
  created_at: string;
};

export type BookingStatus = "confirmed" | "cancelled";

export type Booking = {
  id: string;
  slot_id: string;
  shop_id: string;
  customer_name: string;
  customer_email: string;
  status: BookingStatus;
  reminder_sent_at: string | null;
  created_at: string;
};
