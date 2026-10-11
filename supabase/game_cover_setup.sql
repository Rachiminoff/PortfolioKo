-- Add cached IGDB cover fields to an existing game_masterlist table.
-- Safe to run more than once; does not delete or recreate any game records.
alter table public.game_masterlist
  add column if not exists cover_url text,
  add column if not exists cover_checked_at timestamptz;

comment on column public.game_masterlist.cover_url is
  'Cached IGDB cover image URL used by the PortfolioKo Masterlist UI.';
comment on column public.game_masterlist.cover_checked_at is
  'Timestamp when the IGDB cover lookup was attempted, including no-cover results.';
