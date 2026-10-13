import crypto from 'crypto';

const COOKIE_NAME = 'vault_session';
const MAX_AGE_SECONDS = 24 * 60 * 60;

function secret() {
  return process.env.VAULT_SESSION_SECRET;
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('hex');
}

export function createVaultToken() {
  if (!secret()) throw new Error('VAULT_SESSION_SECRET is not configured');
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
  const nonce = crypto.randomBytes(32).toString('hex');
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidVaultToken(token) {
  if (!token || !secret()) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || !nonce || Number(expires) < Math.floor(Date.now() / 1000))
    return false;
  const expected = Buffer.from(sign(`${expires}.${nonce}`));
  const supplied = Buffer.from(signature);
  return supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);
}

export function getVaultToken(req) {
  return (req.headers.cookie || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
}

export function setVaultCookie(res, token, maxAge = MAX_AGE_SECONDS) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
  );
}

export { COOKIE_NAME, MAX_AGE_SECONDS };
