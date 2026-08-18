-- Automated Invoice Chaser — schema.sql
--
-- Run this in the shared Supabase project's SQL editor once the project
-- exists. Table names are namespaced `automated_invoice_chaser_*` per the
-- multi-tenant-table convention in docs/PLAN.md (one shared Supabase
-- project for every Wave 3+ idea).
--
-- Data model: single-tenant-per-user. Each authenticated user (a business
-- owner/freelancer) manages their own list of invoices; `user_id` scopes
-- every row via Row Level Security so one user never sees another user's
-- invoices. There is no separate "clients" table for this MVP — client
-- name/email are stored directly on the invoice row, since the idea only
-- needs "who to remind", not a full CRM (Sponsorship Manager already
-- covers relationship-tracking elsewhere in this sprint).
--
-- "Overdue" is NOT a stored status — it's derived at query/render time
-- from `status = 'pending' AND due_date < current_date`. This avoids
-- needing a cron job to flip stored statuses and can never drift out of
-- sync with the calendar.

create table if not exists automated_invoice_chaser_invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  client_name text not null,
  client_email text not null,
  amount numeric(10, 2) not null check (amount > 0),
  currency text not null default 'USD',
  issue_date date not null default current_date,
  due_date date not null,
  -- 'pending' covers both "not yet due" and "overdue" — overdue is derived,
  -- see comment above. 'paid' / 'void' are terminal states.
  status text not null default 'pending' check (status in ('pending', 'paid', 'void')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automated_invoice_chaser_invoices_user_id_idx
  on automated_invoice_chaser_invoices (user_id);

create index if not exists automated_invoice_chaser_invoices_due_date_idx
  on automated_invoice_chaser_invoices (due_date);

-- One row per reminder attempt (successful or not), so the UI can show a
-- "last reminded on <date>" trail per invoice and avoid double-sends in a
-- single click.
create table if not exists automated_invoice_chaser_reminders (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references automated_invoice_chaser_invoices (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  sent_at timestamptz not null default now(),
  channel text not null default 'email',
  -- 'sent'   = actually dispatched via Resend (RESEND_API_KEY was set and the API call succeeded)
  -- 'logged' = RESEND_API_KEY was not set, so we only recorded what *would* have been sent
  -- 'failed' = RESEND_API_KEY was set but the Resend API call errored
  delivery_status text not null default 'logged' check (delivery_status in ('sent', 'logged', 'failed')),
  message_preview text not null
);

create index if not exists automated_invoice_chaser_reminders_invoice_id_idx
  on automated_invoice_chaser_reminders (invoice_id);

-- Keep updated_at current on every UPDATE.
create or replace function automated_invoice_chaser_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists automated_invoice_chaser_invoices_set_updated_at on automated_invoice_chaser_invoices;
create trigger automated_invoice_chaser_invoices_set_updated_at
  before update on automated_invoice_chaser_invoices
  for each row execute function automated_invoice_chaser_set_updated_at();

-- Row Level Security --------------------------------------------------

alter table automated_invoice_chaser_invoices enable row level security;
alter table automated_invoice_chaser_reminders enable row level security;

create policy "invoices_select_own" on automated_invoice_chaser_invoices
  for select using (auth.uid() = user_id);

create policy "invoices_insert_own" on automated_invoice_chaser_invoices
  for insert with check (auth.uid() = user_id);

create policy "invoices_update_own" on automated_invoice_chaser_invoices
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "invoices_delete_own" on automated_invoice_chaser_invoices
  for delete using (auth.uid() = user_id);

create policy "reminders_select_own" on automated_invoice_chaser_reminders
  for select using (auth.uid() = user_id);

create policy "reminders_insert_own" on automated_invoice_chaser_reminders
  for insert with check (auth.uid() = user_id);

-- No update/delete policy on reminders on purpose — it's an append-only
-- audit trail of what was sent/logged.
