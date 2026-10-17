import crypto from 'crypto';
import { clientIp, createThrottle, isSameOrigin, setSecurityHeaders } from '../_security.js';

const COOKIE = 'blog_admin_session';
const MAX_AGE = 24 * 60 * 60;

// Reuse env vars you already have: no new variables are required.
const getSecret = () => process.env.BLOG_SESSION_SECRET || process.env.VAULT_SESSION_SECRET;
const getPassword = () => process.env.BLOG_PASSWORD || process.env.REACT_APP_BLOG_PASSWORD;
const throttle = createThrottle({ maxFailures: 5, lockMs: 15 * 60 * 1000 });

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function createToken() {
  const expires = Math.floor(Date.now() / 1000) + MAX_AGE;
  const nonce = crypto.randomBytes(32).toString('hex');
  const payload = `${expires}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

function isValidToken(token) {
  if (!token || !getSecret()) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || !/^[a-f0-9]{64}$/i.test(nonce)) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = sign(`${expires}.${nonce}`);
  const suppliedSignature = Buffer.from(signature);
  const expectedSignature = Buffer.from(expected);
  return (
    suppliedSignature.length === expectedSignature.length &&
    crypto.timingSafeEqual(suppliedSignature, expectedSignature)
  );
}

function getCookie(req) {
  return (req.headers.cookie || '')
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
}

export function isBlogAdmin(req) {
  return isValidToken(getCookie(req));
}

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method === 'GET') {
    return res.status(200).json({ valid: isBlogAdmin(req) });
  }

  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!isSameOrigin(req)) return res.status(403).json({ success: false, error: 'Forbidden' });

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);
    return res.status(200).json({ success: true });
  }

  if (!getPassword() || !getSecret()) {
    console.error('Blog auth is not configured (blog password and session secret are required)');
    return res.status(503).json({ success: false, error: 'Authentication is not configured.' });
  }

  const ip = clientIp(req);
  if (throttle.isLocked(ip)) {
    return res.status(429).json({ success: false, error: 'Too many attempts. Try again later.' });
  }

  const { password } = req.body || {};
  if (typeof password !== 'string' || !password || password.length > 256) {
    return res.status(400).json({ success: false, error: 'Password required.' });
  }

  // Compare fixed-length digests so the check is constant-time regardless of password length.
  const digest = (value) => crypto.createHash('sha256').update(value).digest();
  const matches = crypto.timingSafeEqual(digest(password), digest(getPassword()));

  if (!matches) {
    throttle.fail(ip);
    return res.status(401).json({ success: false, error: 'Invalid password.' });
  }

  throttle.clear(ip);
  const token = createToken();
  res.setHeader(
    'Set-Cookie',
    `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`,
  );
  return res.status(200).json({ success: true });
}
