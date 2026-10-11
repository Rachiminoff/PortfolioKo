-- PortfolioKo Games masterlist
-- Run this in Supabase Dashboard -> SQL Editor before importing game_masterlist_import.csv.
-- Safe to run more than once; this creates the table if it does not already exist.

create table if not exists public.game_masterlist (
  igdb_id bigint primary key,
  game_name text not null,
  cover_url text,
  cover_checked_at timestamptz,
  game_release_date date,
  igdb_edition_id bigint,
  game_edition_name text,
  platform text,
  game_type text,
  status text,
  completion text,
  ownership text,
  acquisition text,
  state text,
  format text,
  digital_service text,
  subscription text,
  playtime numeric,
  times_completed integer,
  completion_date date,
  completion_date_type text,
  progress_notes text,
  borrowed_from text,
  returned_to_owner text,
  lent_to text,
  lent_out text,
  condition text,
  region text,
  collection_notes text,
  amount_paid numeric,
  acquisition_date date,
  acquisition_source text,
  additional_cost numeric,
  game_condition text,
  manual_condition text,
  box_condition text,
  manual_progress numeric,
  acquisition_notes text,
  rating_score numeric(4,2),
  rating_gameplay numeric(4,2),
  rating_sound numeric(4,2),
  rating_story numeric(4,2),
  rating_visual numeric(4,2),
  rating_accessibility numeric(4,2),
  tags text,
  date_added timestamptz,
  last_updated timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_masterlist_ratings_range check (
    (rating_score is null or rating_score between 0 and 10) and
    (rating_gameplay is null or rating_gameplay between 0 and 10) and
    (rating_sound is null or rating_sound between 0 and 10) and
    (rating_story is null or rating_story between 0 and 10) and
    (rating_visual is null or rating_visual between 0 and 10) and
    (rating_accessibility is null or rating_accessibility between 0 and 10)
  ),
  constraint game_masterlist_manual_progress_range check (
    manual_progress is null or manual_progress between 0 and 100
  )
);

create index if not exists game_masterlist_name_idx on public.game_masterlist (game_name);
create index if not exists game_masterlist_platform_idx on public.game_masterlist (platform);
create index if not exists game_masterlist_status_idx on public.game_masterlist (status);
create index if not exists game_masterlist_completion_idx on public.game_masterlist (completion);

alter table public.game_masterlist enable row level security;

-- The portfolio can read the collection, but browser clients cannot change it.
drop policy if exists "game masterlist read access" on public.game_masterlist;
create policy "game masterlist read access"
  on public.game_masterlist for select to anon, authenticated using (true);

revoke insert, update, delete, truncate, references, trigger on public.game_masterlist from anon, authenticated, public;
grant select on public.game_masterlist to anon, authenticated;

-- Manage/import records manually in Supabase Studio. Do not add public write policies.
