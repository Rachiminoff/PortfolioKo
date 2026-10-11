-- PortfolioKo: safe additions for game-country stats and TMDB movie posters.
-- Run in Supabase SQL Editor. Does not drop, recreate, or delete any tables or rows.

ALTER TABLE public.game_masterlist
  ADD COLUMN IF NOT EXISTS country text;

ALTER TABLE public.movie_masterlist
  ADD COLUMN IF NOT EXISTS poster_checked_at timestamptz;

CREATE INDEX IF NOT EXISTS movie_masterlist_missing_posters_idx
  ON public.movie_masterlist (poster_checked_at)
  WHERE poster_url IS NULL;
