-- PortfolioKo Movies masterlist
-- Safe to run more than once. Existing manga/game tables are untouched.
-- Import Letterboxd's watchlist.csv into movie_masterlist_import, then run
-- movie_masterlist_import_merge.sql to copy records into movie_masterlist.

create table if not exists public.movie_masterlist (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_year integer,
  watchlist_date date,
  letterboxd_uri text,
  poster_url text,
  country text,
  genres text[] not null default '{}',
  status text not null default 'Watchlist',
  rating numeric(4,2),
  notes text,
  format text not null default 'Film',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint movie_masterlist_rating_range check (rating is null or rating between 0 and 10)
);

create unique index if not exists movie_masterlist_letterboxd_uri_uidx
  on public.movie_masterlist (letterboxd_uri) where letterboxd_uri is not null;
create index if not exists movie_masterlist_title_idx on public.movie_masterlist (title);
create index if not exists movie_masterlist_year_idx on public.movie_masterlist (release_year);

-- Staging columns match the Letterboxd CSV header exactly.
create table if not exists public.movie_masterlist_import (
  "Date" date,
  "Name" text,
  "Year" integer,
  "Letterboxd URI" text
);

alter table public.movie_masterlist enable row level security;
drop policy if exists "movie masterlist read access" on public.movie_masterlist;
create policy "movie masterlist read access"
  on public.movie_masterlist for select to anon, authenticated using (true);
revoke insert, update, delete, truncate, references, trigger on public.movie_masterlist from anon, authenticated, public;
grant select on public.movie_masterlist to anon, authenticated;

alter table public.movie_masterlist_import enable row level security;
revoke all on public.movie_masterlist_import from anon, authenticated, public;
