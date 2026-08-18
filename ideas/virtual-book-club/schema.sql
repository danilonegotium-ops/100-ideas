-- Virtual Book Club — schema.sql
--
-- Run against the shared Supabase project. Tables namespaced
-- `virtual_book_club_*` per the shared nextjs-template convention.
--
-- Seeding note: several FKs into `auth.users` below (`created_by`,
-- `members.user_id`, `proposals.proposed_by`, `votes.user_id`) are
-- NULLABLE, with a paired `*_label` text column. For seed/demo rows this
-- holds a fixed label ("Demo Organizer", "Demo Member A", ...) — done to
-- avoid hand-writing rows into Supabase's internal `auth.users` table
-- (its exact required columns aren't something to guess at without a
-- live project to check against). For rows created through the real app,
-- the uuid column is always `auth.uid()` (enforced by INSERT policies)
-- *and* the app also fills the label with the user's own email at
-- write-time (self-supplied client-side from `supabase.auth.getUser()`,
-- never queried from another user) — there's no separate profiles table
-- in this idea, and `auth.users` isn't queryable by the anon/authenticated
-- role, so this is how co-members see something more useful than a raw
-- uuid. The label is purely cosmetic — every RLS policy keys off the
-- uuid column, never the label.
--
-- Invite flow: there's no separate "invite token" system. Inviting by
-- email just adds a row to `invites`; when that person logs in (via the
-- template's normal magic-link flow — this is app-wide, not
-- club-specific) and visits the club page, an INSERT policy lets them
-- add themselves to `members` *only if* an `invites` row exists matching
-- their JWT's email address for that club. Emails are compared
-- lowercased on both sides to avoid case-mismatch bugs.

create table if not exists virtual_book_club_clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_by_label text,
  current_book_title text,
  current_book_author text,
  next_meeting_at timestamptz,
  meeting_link text,
  created_at timestamptz not null default now()
);

create table if not exists virtual_book_club_members (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references virtual_book_club_clubs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  member_label text,
  joined_at timestamptz not null default now(),
  unique (club_id, user_id)
);

create table if not exists virtual_book_club_invites (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references virtual_book_club_clubs(id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (club_id, email)
);

create table if not exists virtual_book_club_proposals (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references virtual_book_club_clubs(id) on delete cascade,
  title text not null,
  author text,
  proposed_by uuid references auth.users(id) on delete set null,
  proposed_by_label text,
  created_at timestamptz not null default now()
);

create table if not exists virtual_book_club_votes (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references virtual_book_club_proposals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  voter_label text,
  created_at timestamptz not null default now(),
  unique (proposal_id, user_id)
);

create index if not exists virtual_book_club_members_club_idx
  on virtual_book_club_members (club_id);
create index if not exists virtual_book_club_members_user_idx
  on virtual_book_club_members (user_id);
create index if not exists virtual_book_club_invites_club_idx
  on virtual_book_club_invites (club_id);
create index if not exists virtual_book_club_invites_email_idx
  on virtual_book_club_invites (lower(email));
create index if not exists virtual_book_club_proposals_club_idx
  on virtual_book_club_proposals (club_id);
create index if not exists virtual_book_club_votes_proposal_idx
  on virtual_book_club_votes (proposal_id);

-- Row Level Security -----------------------------------------------------

alter table virtual_book_club_clubs enable row level security;
alter table virtual_book_club_members enable row level security;
alter table virtual_book_club_invites enable row level security;
alter table virtual_book_club_proposals enable row level security;
alter table virtual_book_club_votes enable row level security;

-- Clubs are private: visible to members, and to anyone with a pending
-- invite (so they can see the club name before accepting).
create policy virtual_book_club_clubs_select_member_or_invited
  on virtual_book_club_clubs for select
  to authenticated
  using (
    id in (select club_id from virtual_book_club_members where user_id = auth.uid())
    or id in (
      select club_id from virtual_book_club_invites
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  );

create policy virtual_book_club_clubs_insert_own
  on virtual_book_club_clubs for insert
  to authenticated
  with check (created_by = auth.uid());

-- Any current member can update shared club fields (current book, next
-- meeting, link) — no separate "organizer" role in this MVP pass.
create policy virtual_book_club_clubs_update_member
  on virtual_book_club_clubs for update
  to authenticated
  using (id in (select club_id from virtual_book_club_members where user_id = auth.uid()))
  with check (id in (select club_id from virtual_book_club_members where user_id = auth.uid()));

-- Members: visible to co-members. Two ways to become a member:
-- (1) create a club (creator auto-joins, see the app code), or
-- (2) accept a pending invite (insert your own membership row where a
--     matching invite exists for your account's email).
create policy virtual_book_club_members_select_co_members
  on virtual_book_club_members for select
  to authenticated
  using (
    club_id in (select club_id from virtual_book_club_members where user_id = auth.uid())
  );

create policy virtual_book_club_members_insert_creator
  on virtual_book_club_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and (
      club_id in (select id from virtual_book_club_clubs where created_by = auth.uid())
      or club_id in (
        select club_id from virtual_book_club_invites
        where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      )
    )
  );

-- Invites: visible to the club's members (so they can see who's pending)
-- and to the invitee themselves (matched by email).
create policy virtual_book_club_invites_select_member_or_invitee
  on virtual_book_club_invites for select
  to authenticated
  using (
    club_id in (select club_id from virtual_book_club_members where user_id = auth.uid())
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

create policy virtual_book_club_invites_insert_member
  on virtual_book_club_invites for insert
  to authenticated
  with check (
    invited_by = auth.uid()
    and club_id in (select club_id from virtual_book_club_members where user_id = auth.uid())
  );

-- Proposals: visible to members only, insertable by members only.
create policy virtual_book_club_proposals_select_member
  on virtual_book_club_proposals for select
  to authenticated
  using (club_id in (select club_id from virtual_book_club_members where user_id = auth.uid()));

create policy virtual_book_club_proposals_insert_member
  on virtual_book_club_proposals for insert
  to authenticated
  with check (
    proposed_by = auth.uid()
    and club_id in (select club_id from virtual_book_club_members where user_id = auth.uid())
  );

-- Votes: visible to members of the proposal's club. A member can only
-- insert/delete their own vote (toggle upvote).
create policy virtual_book_club_votes_select_member
  on virtual_book_club_votes for select
  to authenticated
  using (
    proposal_id in (
      select p.id from virtual_book_club_proposals p
      join virtual_book_club_members m on m.club_id = p.club_id
      where m.user_id = auth.uid()
    )
  );

create policy virtual_book_club_votes_insert_own
  on virtual_book_club_votes for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and proposal_id in (
      select p.id from virtual_book_club_proposals p
      join virtual_book_club_members m on m.club_id = p.club_id
      where m.user_id = auth.uid()
    )
  );

create policy virtual_book_club_votes_delete_own
  on virtual_book_club_votes for delete
  to authenticated
  using (user_id = auth.uid());

grant select, insert on virtual_book_club_clubs to authenticated;
grant update on virtual_book_club_clubs to authenticated;
grant select, insert on virtual_book_club_members to authenticated;
grant select, insert on virtual_book_club_invites to authenticated;
grant select, insert on virtual_book_club_proposals to authenticated;
grant select, insert, delete on virtual_book_club_votes to authenticated;

-- Seed data: one demo club, a couple of proposals with votes, a current book -

insert into virtual_book_club_clubs (id, created_by, created_by_label, name, current_book_title, current_book_author, next_meeting_at, meeting_link) values
  ('33333333-3333-3333-3333-333333333301', null, 'Demo Organizer', 'The Late Night Chapter Club', 'Klara and the Sun', 'Kazuo Ishiguro', now() + interval '12 days', 'https://meet.example.com/late-night-chapter-club')
on conflict (id) do nothing;

insert into virtual_book_club_members (club_id, user_id, member_label) values
  ('33333333-3333-3333-3333-333333333301', null, 'Demo Organizer'),
  ('33333333-3333-3333-3333-333333333301', null, 'Demo Member A'),
  ('33333333-3333-3333-3333-333333333301', null, 'Demo Member B'),
  ('33333333-3333-3333-3333-333333333301', null, 'Demo Member C')
on conflict do nothing;

insert into virtual_book_club_proposals (id, club_id, title, author, proposed_by, proposed_by_label) values
  ('33333333-3333-3333-3333-333333333311', '33333333-3333-3333-3333-333333333301', 'Tomorrow, and Tomorrow, and Tomorrow', 'Gabrielle Zevin', null, 'Demo Member A'),
  ('33333333-3333-3333-3333-333333333312', '33333333-3333-3333-3333-333333333301', 'The Bee Sting', 'Paul Murray', null, 'Demo Member B')
on conflict (id) do nothing;

insert into virtual_book_club_votes (proposal_id, user_id, voter_label) values
  ('33333333-3333-3333-3333-333333333311', null, 'Demo Organizer'),
  ('33333333-3333-3333-3333-333333333311', null, 'Demo Member A'),
  ('33333333-3333-3333-3333-333333333311', null, 'Demo Member C'),
  ('33333333-3333-3333-3333-333333333312', null, 'Demo Member B')
on conflict do nothing;
