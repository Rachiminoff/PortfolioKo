-- Uni-user/personal-use media catalogue. No auth.users or user_id column is needed.
create extension if not exists pgcrypto;

create table if not exists public.masterlist_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null check (media_type in ('Anime','Manga','Light Novel','Novel','Movie','TV Series','Game','Other')),
  status text not null default 'Plan to consume' check (status in ('Plan to consume','In progress','Completed','On hold','Dropped')),
  score numeric(3,1) check (score is null or (score >= 0 and score <= 10)),
  progress text,
  release_year integer check (release_year is null or (release_year between 1800 and 2200)),
  creator text,
  cover_url text,
  external_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists masterlist_entries_title_idx on public.masterlist_entries using gin (to_tsvector('simple', title));
create index if not exists masterlist_entries_type_status_idx on public.masterlist_entries (media_type, status);

create or replace function public.set_masterlist_entries_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists masterlist_entries_updated_at on public.masterlist_entries;
create trigger masterlist_entries_updated_at
before update on public.masterlist_entries
for each row execute function public.set_masterlist_entries_updated_at();

alter table public.masterlist_entries enable row level security;

-- Read-only client access. Manage any rows manually in Supabase Studio.
drop policy if exists "Personal masterlist anon read" on public.masterlist_entries;
drop policy if exists "Personal masterlist anon insert" on public.masterlist_entries;
drop policy if exists "Personal masterlist anon update" on public.masterlist_entries;
drop policy if exists "Personal masterlist anon delete" on public.masterlist_entries;
create policy "Personal masterlist anon read" on public.masterlist_entries for select to anon, authenticated using (true);
