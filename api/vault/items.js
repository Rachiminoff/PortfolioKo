import { createClient } from '@supabase/supabase-js';
import { getVaultSessionToken, isValidVaultSessionToken } from './session.js';
import { isSameOrigin, setSecurityHeaders } from '../_security.js';

let client;
function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  client ||= createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

// Vault content is only served to holders of a valid vault session cookie.
export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (!isValidVaultSessionToken(getVaultSessionToken(req))) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('Vault items: SUPABASE_SERVICE_ROLE_KEY / Supabase URL is not configured');
    return res.status(503).json({ error: 'Vault storage is not configured.' });
  }

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('vault_items')
        .select('*')
        .order('display_order', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json({ data });
    }

    if (req.method === 'PATCH') {
      if (!isSameOrigin(req)) return res.status(403).json({ error: 'Forbidden.' });
      const id = Number(new URL(req.url, 'http://localhost').searchParams.get('id'));
      const favorite = req.body?.favorite;
      if (!Number.isSafeInteger(id) || id <= 0 || typeof favorite !== 'boolean') {
        return res.status(400).json({ error: 'Invalid request.' });
      }
      // Only the favorite flag is writable from the browser.
      const { error } = await supabase.from('vault_items').update({ favorite }).eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('Vault items error:', error?.code, error?.message);
    return res.status(500).json({ error: 'Database operation failed.' });
  }
}
