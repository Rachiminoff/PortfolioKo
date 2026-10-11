-- Run after importing Letterboxd watchlist.csv into public.movie_masterlist_import.
-- Upserts on Letterboxd URI and preserves existing ratings, poster links, genres,
-- country, status, and notes when the CSV does not provide those fields.
insert into public.movie_masterlist as live
  (title, release_year, watchlist_date, letterboxd_uri, format)
select
  trim("Name"), "Year", "Date", nullif(trim("Letterboxd URI"), ''), 'Film'
from public.movie_masterlist_import
where nullif(trim("Name"), '') is not null
on conflict (letterboxd_uri) where letterboxd_uri is not null
 do update set
   title = excluded.title,
   release_year = coalesce(excluded.release_year, live.release_year),
   watchlist_date = coalesce(excluded.watchlist_date, live.watchlist_date),
   updated_at = now();

-- Verify the import:
select count(*) as movies_total from public.movie_masterlist;
