export interface Profile {
  id: string;
  owner_id: string;
  name: string;
  sports: string[];
  city: string;
  created_at: string;
}

export interface Listing {
  id: string;
  owner_id: string;
  profile_id: string;
  sport: string;
  city: string;
  day_time: string;
  location_description: string;
  status: "open" | "closed";
  created_at: string;
}

export interface Interest {
  id: string;
  listing_id: string;
  owner_id: string;
  profile_id: string;
  created_at: string;
}
