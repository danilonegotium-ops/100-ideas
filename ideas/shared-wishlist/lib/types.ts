export interface Wishlist {
  id: string;
  title: string;
  created_at: string;
}

export interface Item {
  id: string;
  wishlist_id: string;
  name: string;
  url: string | null;
  price: number | null;
  notes: string | null;
  created_at: string;
}

/**
 * Item as shown to the wishlist OWNER: `is_claimed` comes from the
 * boolean-only `shared_wishlist_claim_statuses` RPC (see schema.sql) and
 * never carries claimant identity — the owner's queries never even touch
 * the raw claims table. See ManageWishlist.tsx.
 */
export interface OwnerItemView extends Item {
  is_claimed: boolean;
}

/**
 * Item as shown to a non-owner visitor on the public share page: may carry
 * the claimant's name/note directly, because RLS only hides claim rows
 * from the wishlist's owner (see schema.sql's
 * shared_wishlist_claims_select_not_owner policy) — anyone else, including
 * anonymous visitors, can see who claimed what. See ClaimWishlist.tsx.
 */
export interface PublicItemView extends Item {
  is_claimed: boolean;
  claimant_name: string | null;
  claimant_note: string | null;
}

/**
 * Shape returned by the `shared_wishlist_claim_statuses(p_wishlist_id)` RPC
 * (see schema.sql's `returns table(item_id uuid, is_claimed boolean)`).
 * The Supabase client isn't generated against a typed Database schema in
 * this project (see docs/PLAN.md — no `Database` generic is threaded
 * through `lib/supabase/*`), so `.rpc()`'s inferred return type doesn't
 * always resolve cleanly under `strict`; asserting it explicitly here
 * against the function's actual SQL signature is more reliable than
 * fighting the generic inference.
 */
export interface ClaimStatusRow {
  item_id: string;
  is_claimed: boolean;
}
