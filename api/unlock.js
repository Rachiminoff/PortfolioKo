import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { createVaultToken, setVaultCookie } from '../src/server/vaultSession.js';

function safeEqual(suppliedValue, expectedValue) {
  const supplied = Buffer.from(String(suppliedValue ?? ''));
  const expected = Buffer.from(String(expectedValue ?? ''));
  return supplied.length === expected.length && supplied.length > 0 && crypto.timingSafeEqual(supplied, expected);
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server credentials are not configured');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

  try {
    const { password } = req.body || {};
    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, error: 'Password required' });
    }
    if (!process.env.VAULT_PASSWORD || !process.env.VAULT_SESSION_SECRET) {
      console.error('Vault password/session secret is not configured');
      return res.status(500).json({ success: false, error: 'Vault authentication is not configured' });
    }

    const supabase = getSupabaseAdmin();
    // Use the platform-provided client address only for throttling; never for session identity.
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
    const { data: existing, error: fetchError } = await supabase
      .from('vault_attempts').select('ip, attempts, locked_until').eq('ip', ip).maybeSingle();
    if (fetchError) {
      console.error('Vault rate-limit lookup failed:', fetchError.message);
      return res.status(500).json({ success: false, error: 'Authentication temporarily unavailable' });
    }

    if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
      return res.status(429).json({ success: false, locked: true, lockedUntil: existing.locked_until });
    }

    if (safeEqual(password, process.env.VAULT_PASSWORD)) {
      if (existing) {
        const { error } = await supabase.from('vault_attempts').delete().eq('ip', ip);
        if (error) console.error('Could not clear vault attempts:', error.message);
      }
      const token = createVaultToken();
      setVaultCookie(res, token);
      return res.status(200).json({ success: true });
    }

    const attempts = (existing?.attempts || 0) + 1;
    if (attempts >= 4) {
      const lockedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.from('vault_attempts').upsert({ ip, attempts, locked_until: lockedUntil }, { onConflict: 'ip' });
      if (error) {
        console.error('Could not save vault lockout:', error.message);
        return res.status(500).json({ success: false, error: 'Authentication temporarily unavailable' });
      }
      return res.status(429).json({ success: false, locked: true, lockedUntil });
    }

    const { error } = await supabase.from('vault_attempts').upsert({ ip, attempts, locked_until: null }, { onConflict: 'ip' });
    if (error) {
      console.error('Could not save vault attempt:', error.message);
      return res.status(500).json({ success: false, error: 'Authentication temporarily unavailable' });
    }
    return res.status(401).json({ success: false, remaining: 4 - attempts });
  } catch (error) {
    console.error('Vault unlock error:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
