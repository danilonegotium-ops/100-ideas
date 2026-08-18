export type Building = {
  id: string;
  manager_id: string;
  name: string;
  address: string;
  created_at: string;
};

export type Unit = {
  id: string;
  building_id: string;
  label: string;
  floor: number | null;
  monthly_fee: number;
  created_at: string;
};

export type UnitContact = {
  id: string;
  unit_id: string;
  owner_name: string | null;
  tenant_name: string | null;
  contact_email: string | null;
  created_at: string;
};

export type FundTransaction = {
  id: string;
  building_id: string;
  occurred_on: string;
  description: string;
  amount: number;
  created_at: string;
};

export type Notice = {
  id: string;
  building_id: string;
  title: string;
  body: string;
  pinned: boolean;
  created_at: string;
};

export type Vote = {
  id: string;
  building_id: string;
  question: string;
  description: string | null;
  closes_at: string;
  created_at: string;
};

export type VoteOption = {
  id: string;
  vote_id: string;
  label: string;
  position: number;
};

export type VoteResponse = {
  id: string;
  vote_id: string;
  option_id: string;
  unit_id: string;
  created_at: string;
};
