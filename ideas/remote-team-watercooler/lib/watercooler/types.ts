export interface Member {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  share_token: string;
  active: boolean;
  created_at: string;
}

export interface PairingWeek {
  id: string;
  owner_id: string;
  week_start: string;
  created_at: string;
}

export interface Pairing {
  id: string;
  owner_id: string;
  week_id: string;
  member_ids: string[];
  meeting_link: string;
  created_at: string;
}
