import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { clientIp } from './_security.js';
import { createVaultSessionToken, VAULT_COOKIE, VAULT_MAX_AGE } from './vault/session.js';

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function safePasswordMatches(suppliedPassword, expectedPassword) {
  if (typeof suppliedPassword !== 'string' || !expectedPassword || suppliedPassword.length > 256) {
    return false;
  }
  // Hash first so the comparison is constant-time and does not leak the password length.
  const digest = (value) => crypto.createHash('sha256').update(value).digest();
  return crypto.timingSafeEqual(digest(suppliedPassword), digest(expectedPassword));
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowedOrigin = process.env.SITE_ORIGIN || 'https://tanyadeniseyambao.vercel.app';
  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password) {
    return res.status(400).json({ success: false, error: 'Password required' });
  }
  if (!process.env.VAULT_PASSWORD) {
    console.error('VAULT_PASSWORD is not configured');
    return res
      .status(503)
      .json({ success: false, error: 'Vault authentication is not configured.' });
  }
  if (!(process.env.VAULT_SESSION_SECRET || process.env.BLOG_SESSION_SECRET)) {
    console.error('VAULT_SESSION_SECRET (or BLOG_SESSION_SECRET) is not configured');
    return res
      .status(503)
      .json({ success: false, error: 'Vault session signing is not configured.' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error(
      'SUPABASE_URL/REACT_APP_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured',
    );
    return res
      .status(503)
      .json({ success: false, error: 'Vault rate limiting is not configured.' });
  }

  try {
    const ip = clientIp(req);
    const { data: existing, error: fetchError } = await supabase
      .from('vault_attempts')
      .select('ip, attempts, locked_until')
      .eq('ip', ip)
      .maybeSingle();

    if (fetchError) {
      console.error('Vault attempt lookup failed:', fetchError.code, fetchError.message);
      return res.status(500).json({ success: false, error: 'Database lookup failed' });
    }

    if (existing?.locked_until && new Date(existing.locked_until) > new Date()) {
      return res
        .status(429)
        .json({ success: false, locked: true, lockedUntil: existing.locked_until });
    }

    if (safePasswordMatches(password, process.env.VAULT_PASSWORD)) {
      const { error: clearError } = await supabase.from('vault_attempts').delete().eq('ip', ip);
      if (clearError)
        console.error('Could not clear vault attempts:', clearError.code, clearError.message);

      const sessionToken = createVaultSessionToken();
      res.setHeader(
        'Set-Cookie',
        `${VAULT_COOKIE}=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${VAULT_MAX_AGE}`,
      );
      return res.status(200).json({ success: true });
    }

    const attempts = (existing?.attempts || 0) + 1;
    if (attempts >= 4) {
      const lockedUntil = new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString();
      const { error: upsertError } = await supabase
        .from('vault_attempts')
        .upsert({ ip, attempts, locked_until: lockedUntil }, { onConflict: 'ip' });
      if (upsertError) {
        console.error('Could not record vault lockout:', upsertError.code, upsertError.message);
        return res.status(500).json({ success: false, error: 'Could not record failed attempt' });
      }
      return res.status(429).json({ success: false, locked: true, lockedUntil });
    }

    const { error: upsertError } = await supabase
      .from('vault_attempts')
      .upsert({ ip, attempts, locked_until: null }, { onConflict: 'ip' });
    if (upsertError) {
      console.error('Could not record vault attempt:', upsertError.code, upsertError.message);
      return res.status(500).json({ success: false, error: 'Could not record failed attempt' });
    }
    return res.status(401).json({ success: false, remaining: 4 - attempts });
  } catch (error) {
    console.error('Unlock API error:', error?.message || error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
