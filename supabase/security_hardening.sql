-- Run in the Supabase SQL Editor. Safe to re-run.
-- The anon key ships in the browser bundle, so anything anon can read or write is public.
-- Private/admin data is served by /api/* using the server-only service-role key instead.

-- blog_posts: public may read PUBLISHED posts only; all writes go through /api/blog/posts.
alter table public.blog_posts enable row level security;
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'blog_posts'
  loop
    execute format('drop policy if exists %I on public.blog_posts', r.policyname);
  end loop;
end $$;
revoke all on public.blog_posts from anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
create policy "published posts are public" on public.blog_posts
  for select to anon, authenticated using (published = true);

-- vault_items: no browser access at all; served by /api/vault/items after the session check.
alter table public.vault_items enable row level security;
do $$
declare r record;
begin
  for r in select policyname from pg_policies where schemaname = 'public' and tablename = 'vault_items'
  loop
    execute format('drop policy if exists %I on public.vault_items', r.policyname);
  end loop;
end $$;
revoke all on public.vault_items from anon, authenticated;

-- manga_masterlist: the old policy let ANY visitor overwrite anilist_metadata with arbitrary JSON.
-- The AniList cache is now refreshed by /api/masterlist/sync (server fetches AniList and writes
-- with the service-role key), so browser write access is removed. Run this only AFTER deploying
-- the new code, otherwise the old page's cache writes will fail.
drop policy if exists "manga metadata cache update" on public.manga_masterlist;
revoke update on public.manga_masterlist from anon, authenticated, public;
