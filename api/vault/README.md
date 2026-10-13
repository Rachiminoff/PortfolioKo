# Vault API configuration

Configure these environment variables in Vercel for Production:

- `VAULT_PASSWORD`: the vault password.
- `VAULT_SESSION_SECRET`: a long random secret used to sign vault session cookies. For backward compatibility, `BLOG_SESSION_SECRET` is used if this variable is not set.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service-role key for rate-limit reads/writes.
- `SUPABASE_URL` or the existing `REACT_APP_SUPABASE_URL`: Supabase project URL.
- Optional `SITE_ORIGIN`: the exact site origin allowed to make credentialed unlock requests. Defaults to `https://tanyadeniseyambao.vercel.app`.

The vault session is a stateless HMAC-signed, HTTP-only cookie. The `vault_sessions` table is not used by the current implementation. `vault_attempts` is used for server-side rate limiting, so its schema needs `ip` (primary key), `attempts`, and `locked_until` (nullable timestamp with time zone).

Suggested SQL migration for an existing `vault_attempts` table:

```sql
ALTER TABLE public.vault_attempts
ADD COLUMN IF NOT EXISTS locked_until timestamptz;
```

Keep RLS enabled. The API uses the service-role key server-side; do not grant browser roles access to the vault tables. Never put the service-role key in a `REACT_APP_` variable or client-side code.
