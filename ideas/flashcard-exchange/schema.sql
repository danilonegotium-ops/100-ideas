-- Flashcard Exchange — schema.sql
--
-- Run this against the shared Supabase project (SQL editor or migration
-- runner) once it exists. Table names are namespaced `flashcard_exchange_*`
-- per docs/PLAN.md / _shared/nextjs-template/README.md's shared-project
-- convention.
--
-- Seeding note: `owner_id` on decks is a NULLABLE foreign key into
-- `auth.users`. We deliberately never hand-write rows into `auth.users`
-- (that's Supabase-internal and its exact required columns aren't something
-- to guess at without a live project to check against). Real decks created
-- through the app always have `owner_id = auth.uid()` (enforced by the
-- INSERT policy below, which requires it to be non-null and match the
-- caller). Seed/demo decks below use `owner_id = NULL` plus a plain-text
-- `owner_label` for display ("Demo deck") — this lets us ship realistic
-- demo content without inventing fake auth users.

create table if not exists flashcard_exchange_decks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  owner_label text,
  title text not null,
  subject text not null,
  exam_tag text,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists flashcard_exchange_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references flashcard_exchange_decks(id) on delete cascade,
  front text not null,
  back text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists flashcard_exchange_decks_subject_idx
  on flashcard_exchange_decks (subject);
create index if not exists flashcard_exchange_cards_deck_id_idx
  on flashcard_exchange_cards (deck_id);

-- Row Level Security -----------------------------------------------------

alter table flashcard_exchange_decks enable row level security;
alter table flashcard_exchange_cards enable row level security;

-- Decks: anyone (including anon) can browse. Only a logged-in user can
-- create a deck, and only as themselves. Only the owner can edit/delete
-- their own deck (seed decks have owner_id null, so nobody can edit/delete
-- them through the app — intentional, they're fixed demo content).
create policy flashcard_exchange_decks_select_all
  on flashcard_exchange_decks for select
  using (true);

create policy flashcard_exchange_decks_insert_own
  on flashcard_exchange_decks for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy flashcard_exchange_decks_update_own
  on flashcard_exchange_decks for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy flashcard_exchange_decks_delete_own
  on flashcard_exchange_decks for delete
  to authenticated
  using (owner_id = auth.uid());

-- Cards: readable by anyone (needed to browse/study a public deck). Only
-- insertable/editable/deletable by the parent deck's owner.
create policy flashcard_exchange_cards_select_all
  on flashcard_exchange_cards for select
  using (true);

create policy flashcard_exchange_cards_insert_own_deck
  on flashcard_exchange_cards for insert
  to authenticated
  with check (
    exists (
      select 1 from flashcard_exchange_decks d
      where d.id = deck_id and d.owner_id = auth.uid()
    )
  );

create policy flashcard_exchange_cards_update_own_deck
  on flashcard_exchange_cards for update
  to authenticated
  using (
    exists (
      select 1 from flashcard_exchange_decks d
      where d.id = deck_id and d.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from flashcard_exchange_decks d
      where d.id = deck_id and d.owner_id = auth.uid()
    )
  );

create policy flashcard_exchange_cards_delete_own_deck
  on flashcard_exchange_cards for delete
  to authenticated
  using (
    exists (
      select 1 from flashcard_exchange_decks d
      where d.id = deck_id and d.owner_id = auth.uid()
    )
  );

-- Supabase's public schema grants table-level access to `anon`/`authenticated`
-- by default and lets RLS do the real gating, but we grant explicitly here
-- so this schema is self-contained and not dependent on project defaults.
grant select on flashcard_exchange_decks to anon, authenticated;
grant insert, update, delete on flashcard_exchange_decks to authenticated;
grant select on flashcard_exchange_cards to anon, authenticated;
grant insert, update, delete on flashcard_exchange_cards to authenticated;

-- Seed data ----------------------------------------------------------------

insert into flashcard_exchange_decks (id, owner_id, owner_label, title, subject, exam_tag, description) values
  ('11111111-1111-1111-1111-111111111101', null, 'Demo deck', 'Organic Chemistry: Functional Groups', 'Chemistry', 'Orgo I Midterm', 'Names, structures, and quick identifiers for the functional groups that show up most on intro organic chemistry exams.'),
  ('11111111-1111-1111-1111-111111111102', null, 'Demo deck', 'Spanish Verb Conjugations — Present Tense', 'Spanish', 'Spanish 101', 'Regular -ar/-er/-ir verb endings plus the most common irregulars (ser, estar, ir, tener).'),
  ('11111111-1111-1111-1111-111111111103', null, 'Demo deck', 'US History: Causes of the Civil War', 'History', 'AP US History', 'Key events, legislation, and turning points leading up to 1861.'),
  ('11111111-1111-1111-1111-111111111104', null, 'Demo deck', 'Data Structures Big-O Cheat Sheet', 'Computer Science', 'CS 201 Final', 'Average and worst-case time complexity for common operations on arrays, linked lists, hash maps, and trees.')
on conflict (id) do nothing;

insert into flashcard_exchange_cards (deck_id, front, back, position) values
  ('11111111-1111-1111-1111-111111111101', 'What functional group is -OH?', 'Hydroxyl group — found in alcohols.', 0),
  ('11111111-1111-1111-1111-111111111101', 'What functional group is -COOH?', 'Carboxyl group — found in carboxylic acids.', 1),
  ('11111111-1111-1111-1111-111111111101', 'What functional group is C=O (mid-chain)?', 'Carbonyl group — found in ketones (aldehydes if at the end of the chain).', 2),
  ('11111111-1111-1111-1111-111111111101', 'What functional group is -NH2?', 'Amine group.', 3),
  ('11111111-1111-1111-1111-111111111101', 'What functional group is -O- between two carbons?', 'Ether group.', 4),

  ('11111111-1111-1111-1111-111111111102', 'yo (hablar)', 'hablo', 0),
  ('11111111-1111-1111-1111-111111111102', 'tú (comer)', 'comes', 1),
  ('11111111-1111-1111-1111-111111111102', 'él/ella (vivir)', 'vive', 2),
  ('11111111-1111-1111-1111-111111111102', 'yo (ser)', 'soy', 3),
  ('11111111-1111-1111-1111-111111111102', 'nosotros (estar)', 'estamos', 4),
  ('11111111-1111-1111-1111-111111111102', 'ellos (tener)', 'tienen', 5),

  ('11111111-1111-1111-1111-111111111103', 'What was the Missouri Compromise (1820)?', 'Admitted Missouri as a slave state and Maine as a free state, banning slavery north of the 36°30′ parallel in the rest of the Louisiana Purchase territory.', 0),
  ('11111111-1111-1111-1111-111111111103', 'What did the Kansas-Nebraska Act (1854) do?', 'Let settlers in those territories decide slavery by popular sovereignty, effectively repealing the Missouri Compromise line and triggering violence known as "Bleeding Kansas."', 1),
  ('11111111-1111-1111-1111-111111111103', 'What was the Dred Scott decision (1857)?', 'The Supreme Court ruled that Black Americans could not be citizens and that Congress could not ban slavery in the territories.', 2),
  ('11111111-1111-1111-1111-111111111103', 'What event triggered South Carolina''s secession?', 'The election of Abraham Lincoln in November 1860.', 3),

  ('11111111-1111-1111-1111-111111111104', 'Array — access by index', 'O(1)', 0),
  ('11111111-1111-1111-1111-111111111104', 'Array — search (unsorted)', 'O(n)', 1),
  ('11111111-1111-1111-1111-111111111104', 'Singly linked list — insert at head', 'O(1)', 2),
  ('11111111-1111-1111-1111-111111111104', 'Hash map — average lookup', 'O(1)', 3),
  ('11111111-1111-1111-1111-111111111104', 'Hash map — worst-case lookup', 'O(n) (all keys collide into one bucket)', 4),
  ('11111111-1111-1111-1111-111111111104', 'Balanced binary search tree — search', 'O(log n)', 5)
on conflict do nothing;
