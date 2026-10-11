-- PortfolioKo: safe staging table for importing the game CSV
-- Run this AFTER public.game_masterlist exists.
-- This staging table intentionally has NO primary key, so duplicate IGDB IDs in the CSV won't fail.

create table if not exists public.game_masterlist_import
  (like public.game_masterlist including defaults);

-- Clear only the staging table so previous import rows do not get re-merged.
truncate table public.game_masterlist_import;

-- Then use Supabase Table Editor to import game_masterlist_import.csv into
-- public.game_masterlist_import. It is okay for this staging table to contain duplicate igdb_id values.
