-- PortfolioKo: schedule TMDB movie poster syncing in Supabase.
-- Run ONCE in Supabase SQL Editor after deploying sync-movie-posters and setting its Edge Function secrets.
-- Replace all three placeholders before running. Do not paste the TMDB token here.
-- This stores only the project URL, anon/publishable key, and the request-guard secret in Supabase Vault.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select vault.create_secret(
  'https://YOUR_PROJECT_REF.supabase.co',
  'portfolio_ko_poster_project_url',
  'PortfolioKo poster sync project URL'
);

select vault.create_secret(
  'YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY',
  'portfolio_ko_poster_anon_key',
  'PortfolioKo poster sync public API key'
);

select vault.create_secret(
  'YOUR_POSTER_SYNC_SECRET',
  'portfolio_ko_poster_sync_guard',
  'Must match the POSTER_SYNC_SECRET Edge Function secret'
);

-- If this named job already exists, remove it before adding the replacement.
select cron.unschedule(jobid)
from cron.job
where jobname = 'portfolio-ko-movie-poster-sync';

-- Every 10 minutes, process up to 20 movies. It stops doing database writes when
-- there are no unchecked movies; new movies are picked up automatically.
select cron.schedule(
  'portfolio-ko-movie-poster-sync',
  '*/10 * * * *',
  $job$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'portfolio_ko_poster_project_url')
      || '/functions/v1/sync-movie-posters',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', (select decrypted_secret from vault.decrypted_secrets where name = 'portfolio_ko_poster_anon_key'),
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'portfolio_ko_poster_anon_key'),
      'x-poster-sync-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'portfolio_ko_poster_sync_guard')
    ),
    body := '{"limit":20}'::jsonb
  );
  $job$
);

-- Verify the scheduled job exists:
select jobid, jobname, schedule, active
from cron.job
where jobname = 'portfolio-ko-movie-poster-sync';
