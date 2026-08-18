-- Financial Literacy for Teens — schema.sql
--
-- Run against the shared Supabase project. Tables namespaced
-- `financial_literacy_teens_*` per the shared nextjs-template convention.
--
-- Unlike the other Wave 3 ideas this pass, seed data here is the lesson
-- curriculum itself (public, non-sensitive content), NOT fake user
-- progress or leaderboard rows — the task is explicit that the
-- leaderboard should start empty and only reflect real logged-in users.
-- So `lessons` and `quiz_questions` are seeded below; `progress` and
-- `profiles` are not, and both have real (non-nullable) foreign keys into
-- `auth.users` since there's no seed workaround needed for them.

create table if not exists financial_literacy_teens_lessons (
  id text primary key, -- short slug, e.g. 'saving'
  title text not null,
  summary text not null,
  content text not null, -- plain-text body, rendered as paragraphs
  order_index integer not null,
  points_available integer not null default 100
);

create table if not exists financial_literacy_teens_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id text not null references financial_literacy_teens_lessons(id) on delete cascade,
  question text not null,
  options text[] not null, -- always exactly 4 choices in this MVP
  correct_index integer not null check (correct_index >= 0 and correct_index < 4),
  order_index integer not null,
  unique (lesson_id, order_index)
);

-- One row per user per lesson (retaking a lesson updates the same row —
-- see the `unique` constraint and the app's `upsert` call).
create table if not exists financial_literacy_teens_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id text not null references financial_literacy_teens_lessons(id) on delete cascade,
  score integer not null,
  total_questions integer not null,
  points_earned integer not null,
  badge text not null check (badge in ('bronze', 'silver', 'gold')),
  completed_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- Small profile just so the leaderboard can show something friendlier
-- than a raw email — teens choose their own display name (a first name
-- or initials), never derived from their email automatically.
create table if not exists financial_literacy_teens_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Learner',
  created_at timestamptz not null default now()
);

create index if not exists financial_literacy_teens_quiz_questions_lesson_idx
  on financial_literacy_teens_quiz_questions (lesson_id);
create index if not exists financial_literacy_teens_progress_user_idx
  on financial_literacy_teens_progress (user_id);

-- A view instead of ad-hoc client-side aggregation for the leaderboard —
-- Supabase's JS client doesn't have a clean GROUP BY helper, so the sum
-- happens here. `security_invoker = on` makes the view run with the
-- privileges/RLS of the querying role (current Postgres/Supabase best
-- practice for views over RLS-protected tables) rather than the view
-- owner's — meaningful mainly if the underlying tables' policies are
-- tightened later, since both tables are public-select right now anyway.
create or replace view financial_literacy_teens_leaderboard
  with (security_invoker = on) as
  select
    p.user_id,
    coalesce(pr.display_name, 'Learner') as display_name,
    sum(p.points_earned)::int as total_points,
    count(*)::int as lessons_completed
  from financial_literacy_teens_progress p
  left join financial_literacy_teens_profiles pr on pr.user_id = p.user_id
  group by p.user_id, pr.display_name;

-- Row Level Security -----------------------------------------------------

alter table financial_literacy_teens_lessons enable row level security;
alter table financial_literacy_teens_quiz_questions enable row level security;
alter table financial_literacy_teens_progress enable row level security;
alter table financial_literacy_teens_profiles enable row level security;

-- Curriculum content is public, read-only through the app (no UI to
-- create/edit lessons in this pass — they're seeded below).
create policy financial_literacy_teens_lessons_select_all
  on financial_literacy_teens_lessons for select
  using (true);

create policy financial_literacy_teens_quiz_questions_select_all
  on financial_literacy_teens_quiz_questions for select
  using (true);

-- Progress and points aren't sensitive for a demo learning app, and the
-- leaderboard needs to read totals across all users, so select is public.
-- Writes are restricted to your own rows.
create policy financial_literacy_teens_progress_select_all
  on financial_literacy_teens_progress for select
  using (true);

create policy financial_literacy_teens_progress_insert_own
  on financial_literacy_teens_progress for insert
  to authenticated
  with check (user_id = auth.uid());

create policy financial_literacy_teens_progress_update_own
  on financial_literacy_teens_progress for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy financial_literacy_teens_profiles_select_all
  on financial_literacy_teens_profiles for select
  using (true);

create policy financial_literacy_teens_profiles_insert_own
  on financial_literacy_teens_profiles for insert
  to authenticated
  with check (user_id = auth.uid());

create policy financial_literacy_teens_profiles_update_own
  on financial_literacy_teens_profiles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select on financial_literacy_teens_lessons to anon, authenticated;
grant select on financial_literacy_teens_quiz_questions to anon, authenticated;
grant select on financial_literacy_teens_progress to anon, authenticated;
grant insert, update on financial_literacy_teens_progress to authenticated;
grant select on financial_literacy_teens_profiles to anon, authenticated;
grant insert, update on financial_literacy_teens_profiles to authenticated;
grant select on financial_literacy_teens_leaderboard to anon, authenticated;

-- Seed data: the 6-lesson curriculum ---------------------------------------

insert into financial_literacy_teens_lessons (id, title, summary, content, order_index, points_available) values
  ('saving', 'Saving 101', 'Why saving even a little, early, matters more than you think.', 'Saving is just spending less than you earn and setting the rest aside for later. It sounds simple, but the habit matters more than the amount — someone who saves $20 a month starting at 16 builds a much stronger habit (and a much bigger cushion) than someone who waits until they''re "making real money" to start.

A good starting goal is an emergency fund: 3-6 months of essential expenses, kept somewhere easy to access (not invested), so a surprise cost — a phone repair, a bus fare hike, a medical copay — doesn''t wreck your plans or force you to borrow.

A simple rule many people use: pay yourself first. When money comes in, move a set amount to savings immediately, before you spend on anything else. That way saving isn''t "whatever''s left over" — it''s the first thing that happens.', 1, 100),

  ('budgeting', 'Budgeting basics', 'How to make a simple plan for where your money goes.', 'A budget is just a plan for your money before you spend it, instead of wondering where it went after. A common, simple starting framework is the 50/30/20 split: roughly 50% of income toward needs (things you can''t really skip), 30% toward wants (things that are nice but optional), and 20% toward savings or paying down debt.

For a teen with irregular income (allowance, part-time work, gifts), the exact split matters less than the habit of tracking: write down what comes in and what goes out for a month, even roughly. Most people are surprised by at least one category once they actually look.

Budgeting isn''t about restriction for its own sake — it''s about making sure your money goes where you actually want it to go, on purpose, instead of by accident.', 2, 100),

  ('compound-interest', 'Compound interest', 'The single most powerful force in personal finance — and why starting early matters so much.', 'Compound interest means you earn interest not just on the money you originally saved or invested, but on the interest it already earned. Over short periods the difference from simple interest is small; over decades, it becomes enormous.

Classic example: if you invest $1,000 at a 7% average annual return and never add another cent, it roughly doubles every 10 years (a handy shortcut called the "Rule of 72": 72 divided by the interest rate gives you the approximate years to double). After 30 years, that original $1,000 could grow to around $7,600 — not from adding more money, just from time and growth compounding on itself.

This is why starting at 16 instead of 26 can matter more than how much you start with. A decade of extra compounding time is hard to make up for later, even with much larger contributions.', 3, 100),

  ('investing-basics', 'Basic investing', 'The difference between saving and investing, and the core idea of risk vs. return.', 'Saving means keeping money safe and accessible — a savings account, for example — usually earning a small, steady amount of interest with very low risk of losing the original amount. Investing means putting money into something (like stocks, bonds, or a fund) that can grow significantly more over time, but whose value can also go down, sometimes a lot, in the short term.

A stock is a small ownership share in a company. A bond is essentially a loan you make to a company or government, which pays you back with interest. A fund (like an index fund) pools money from many investors to buy a wide mix of stocks or bonds at once, which spreads out risk — if one company does badly, it doesn''t sink your whole investment.

The general trade-off: investments with higher potential growth usually come with higher potential short-term losses. That''s why investing tends to make more sense for money you won''t need for years (so you can ride out ups and downs), while money you''ll need soon is safer kept in savings.', 4, 100),

  ('credit', 'Understanding credit', 'What a credit score is, why it matters, and how debt actually works.', 'Credit means borrowing money now with a promise to pay it back later, usually with interest — the extra cost of borrowing. A credit score is a number (in the US, typically 300-850) that summarizes how reliably you''ve repaid debts in the past; lenders, landlords, and sometimes employers use it to decide whether to trust you with a loan, an apartment, or a bill.

The biggest factors in a credit score are usually: paying bills on time (the single biggest factor), how much of your available credit you''re using (lower is better), and how long you''ve had credit accounts open.

Debt itself isn''t automatically bad — a mortgage or student loan can be a reasonable tool. The danger is high-interest debt (like credit card balances carried month to month), where interest can compound against you the same way it compounds for you when you''re saving, just in the opposite direction.', 5, 100),

  ('taxes', 'Taxes, simply', 'What taxes are for, and the basics of how income tax works.', 'Taxes are money collected by governments to pay for shared things — roads, schools, defense, public services — that would be hard for any one person to pay for alone. Most people''s first experience with taxes is income tax: a percentage of what you earn, paid to the government.

In the US, income tax is progressive: it''s divided into brackets, and you pay a higher percentage only on the portion of income within each higher bracket, not your whole income at once. So earning more never means your take-home pay after tax goes down overall.

If you have a part-time job, you''ll likely fill out a form (in the US, a W-4) so your employer withholds an estimated amount of tax from each paycheck automatically. At year''s end, if too much was withheld, you get a refund; if too little, you owe the difference. A refund isn''t free money from the government — it''s your own money that was over-withheld, paid back to you.', 6, 100)
on conflict (id) do nothing;

insert into financial_literacy_teens_quiz_questions (lesson_id, question, options, correct_index, order_index) values
  ('saving', 'What is an emergency fund typically meant to cover?', array['A vacation', '3-6 months of essential expenses', 'A new phone every year', 'Stock market losses'], 1, 1),
  ('saving', '"Pay yourself first" means:', array['Buy something for yourself before paying bills', 'Move money to savings before spending on anything else', 'Only save what''s left at the end of the month', 'Pay off all debt before saving anything'], 1, 2),
  ('saving', 'Which matters more for building a saving habit long-term?', array['The exact dollar amount you start with', 'Consistency, even with small amounts', 'Only saving when you have "extra" money', 'Waiting until you have a full-time job'], 1, 3),

  ('budgeting', 'In the 50/30/20 rule, what does the 20% typically represent?', array['Wants', 'Needs', 'Savings or debt paydown', 'Taxes'], 2, 1),
  ('budgeting', 'What is the main purpose of tracking income and spending for a month?', array['To feel guilty about purchases', 'To see where money is actually going', 'To qualify for a loan', 'It has no real purpose'], 1, 2),
  ('budgeting', 'A budget is best described as:', array['A punishment for overspending', 'A plan for your money, made in advance', 'Something only adults need', 'A fixed rule that never changes'], 1, 3),

  ('compound-interest', 'Compound interest means you earn interest on:', array['Only your original deposit', 'Your original deposit plus previously earned interest', 'Only money you add after the first year', 'Nothing — it''s the same as simple interest'], 1, 1),
  ('compound-interest', 'The "Rule of 72" estimates:', array['Your tax bracket', 'How many years it takes an investment to double', 'The maximum interest rate a bank can charge', 'How much to save each month'], 1, 2),
  ('compound-interest', 'Why does starting to invest early matter so much?', array['Early investors get a discount', 'More time means more compounding growth', 'It''s required by law after age 18', 'Interest rates are higher for younger people'], 1, 3),

  ('investing-basics', 'Which is generally true about investing compared to saving?', array['Investing has no risk at all', 'Investing offers potentially higher growth but more short-term risk', 'Saving always earns more than investing', 'There is no real difference'], 1, 1),
  ('investing-basics', 'What is a bond, in simple terms?', array['A share of ownership in a company', 'A loan you make that gets repaid with interest', 'A type of savings account', 'A government tax refund'], 1, 2),
  ('investing-basics', 'Why might someone choose a fund (like an index fund) over a single stock?', array['Funds guarantee profit', 'Funds spread risk across many investments at once', 'Funds have no fees', 'Funds are only for retirees'], 1, 3),

  ('credit', 'What is generally the single biggest factor in a credit score?', array['Your age', 'Paying bills on time', 'How many credit cards you own', 'Your job title'], 1, 1),
  ('credit', 'What does a credit score typically help a lender decide?', array['Your favorite bank', 'How reliably you''ve repaid debts in the past', 'Your income tax bracket', 'Your credit card''s color'], 1, 2),
  ('credit', 'What makes credit card debt especially risky?', array['It has no interest', 'High interest can compound against you if carried month to month', 'It always improves your credit score', 'Banks forgive it after a year'], 1, 3),

  ('taxes', 'What is income tax generally used to pay for?', array['Only the president''s salary', 'Shared public services like roads and schools', 'Bank profits', 'Nothing — it''s optional'], 1, 1),
  ('taxes', 'In a progressive tax system, higher tax rates apply to:', array['Your entire income at once', 'Only the portion of income within each higher bracket', 'Only people under 18', 'Only investment income'], 1, 2),
  ('taxes', 'A tax refund is best understood as:', array['Free money from the government', 'Your own money that was over-withheld, paid back to you', 'A reward for filing early', 'A loan you now owe back'], 1, 3)
on conflict (lesson_id, order_index) do nothing;
