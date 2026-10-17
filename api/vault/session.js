import crypto from 'crypto';

const COOKIE = 'vault_session';
const MAX_AGE = 24 * 60 * 60;

function getSecret() {
  return process.env.VAULT_SESSION_SECRET || process.env.BLOG_SESSION_SECRET;
}

export function createVaultSessionToken() {
  const secret = getSecret();
  if (!secret) throw new Error('Vault session signing secret is not configured');
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const nonce = crypto.randomBytes(32).toString('hex');
  const payload = `${expires}.${nonce}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

export function isValidVaultSessionToken(token) {
  const secret = getSecret();
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (
    !/^\d+$/.test(expires) ||
    !/^[a-f0-9]{64}$/i.test(nonce) ||
    !/^[a-f0-9]{64}$/i.test(signature)
  )
    return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const payload = `${expires}.${nonce}`;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function getVaultSessionToken(req) {
  const cookies = req.headers.cookie || '';
  const value = cookies
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`));
  return value ? value.slice(COOKIE.length + 1) : null;
}

export const VAULT_COOKIE = COOKIE;
export const VAULT_MAX_AGE = MAX_AGE;
