import { createClient } from '@supabase/supabase-js';
import { isSameOrigin, setSecurityHeaders } from '../_security.js';

// Refreshes the AniList metadata cache for manga_masterlist rows.
// The SERVER fetches AniList and writes the cache, so visitors can never supply the cached data.
// Browsers have no write access to manga_masterlist (see supabase/security_hardening.sql).

const ANILIST_FIELDS = `id siteUrl description(asHtml: false) genres format status countryOfOrigin chapters volumes averageScore startDate { year month day } coverImage { extraLarge large } staff(perPage: 25, sort: [RELEVANCE, ID]) { edges { role node { name { full } } } }`;
const MAX_IDS = 8;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const MIN_INTERVAL_MS = 2000;
let lastRun = 0;

let client;
function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ||= createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ error: 'Forbidden.' });

  const supabase = getSupabase();
  if (!supabase) return res.status(503).json({ error: 'Metadata sync is not configured.' });

  const ids = req.body?.ids;
  if (
    !Array.isArray(ids) ||
    !ids.length ||
    ids.length > MAX_IDS ||
    !ids.every((id) => Number.isSafeInteger(Number(id)) && Number(id) > 0)
  ) {
    return res.status(400).json({ error: 'Invalid request.' });
  }

  // Cheap global throttle so the endpoint cannot be used to hammer AniList.
  const now = Date.now();
  if (now - lastRun < MIN_INTERVAL_MS) {
    return res.status(429).json({ error: 'Slow down.' });
  }
  lastRun = now;

  try {
    const { data: rows, error } = await supabase
      .from('manga_masterlist')
      .select('id,anilist_id,mal_id,anilist_fetched_at,anilist_fetch_status')
      .in('id', ids.map(Number));
    if (error) throw error;

    // Only refresh rows that are actually stale and have an external id.
    const due = (rows || []).filter((row) => {
      if (!row.anilist_id && !row.mal_id) return false;
      const fetchedAt = row.anilist_fetched_at ? new Date(row.anilist_fetched_at).getTime() : 0;
      return (
        (!fetchedAt || now - fetchedAt > CACHE_TTL_MS) && row.anilist_fetch_status !== 'not_found'
      );
    });
    if (!due.length) return res.status(200).json({ data: [] });

    const fields = due.map((row, index) => {
      const idField = row.anilist_id ? 'id' : 'idMal';
      const value = Number(row.anilist_id ?? row.mal_id);
      return `m${index}: Media(${idField}: ${value}, type: MANGA) { ${ANILIST_FIELDS} }`;
    });
    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: `query { ${fields.join('\n')} }` }),
    });
    if (!response.ok) return res.status(502).json({ error: 'AniList is unavailable.' });
    const payload = await response.json();
    if (payload.errors?.length && !payload.data) {
      return res.status(502).json({ error: 'AniList could not process the request.' });
    }

    const fetchedAt = new Date().toISOString();
    const saved = [];
    for (const [index, row] of due.entries()) {
      const metadata = payload.data?.[`m${index}`] ?? null;
      const update = {
        anilist_metadata: metadata ?? { _notFound: true },
        anilist_fetched_at: fetchedAt,
        anilist_fetch_status: metadata ? 'ok' : 'not_found',
      };
      const { error: updateError } = await supabase
        .from('manga_masterlist')
        .update(update)
        .eq('id', row.id);
      if (updateError) throw updateError;
      saved.push({ id: row.id, ...update });
    }
    return res.status(200).json({ data: saved });
  } catch (error) {
    console.error('Masterlist sync error:', error?.code, error?.message);
    return res.status(500).json({ error: 'Metadata sync failed.' });
  }
}
