-- Vault sessions are stateless HMAC-signed cookies now, so the old table is not used.
-- Keep both legacy vault tables inaccessible to browser roles in case they remain in the project.
alter table if exists public.vault_sessions enable row level security;
alter table if exists public.vault_attempts enable row level security;

-- Remove any policies that might grant browser roles access to vault internals.
do $$
declare policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('vault_sessions', 'vault_attempts')
  loop
    execute format('drop policy if exists %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end $$;

-- No anon/authenticated policies are intentionally created. Server-side rate limiting
-- uses SUPABASE_SERVICE_ROLE_KEY, which must never be prefixed with REACT_APP_.
