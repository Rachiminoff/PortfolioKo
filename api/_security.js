// Shared helpers for the serverless handlers. Files prefixed with "_" are not exposed as routes.

const DEFAULT_ORIGIN = 'https://tanyadeniseyambao.vercel.app';

export function allowedOrigins() {
  const configured = (process.env.SITE_ORIGIN || DEFAULT_ORIGIN)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  // Vercel preview/production deployments of this project are also same-origin by definition.
  if (process.env.VERCEL_URL) configured.push(`https://${process.env.VERCEL_URL}`);
  return configured;
}

/** CSRF defence in depth on top of SameSite=Strict: browsers always send Origin on POST/PATCH/DELETE. */
export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return false;
  return allowedOrigins().includes(origin);
}

export function clientIp(req) {
  const header =
    req.headers['x-vercel-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'];
  const first = header?.toString().split(',')[0].trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

export function setSecurityHeaders(res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}

/** Best-effort per-instance throttle (serverless instances are ephemeral; use a DB for hard limits). */
export function createThrottle({ maxFailures, lockMs }) {
  const entries = new Map();
  return {
    isLocked(key) {
      const entry = entries.get(key);
      if (!entry) return false;
      if (entry.until && entry.until > Date.now()) return true;
      if (entry.until) entries.delete(key);
      return false;
    },
    fail(key) {
      const entry = entries.get(key) || { count: 0, until: 0 };
      entry.count += 1;
      if (entry.count >= maxFailures) {
        entry.until = Date.now() + lockMs;
        entry.count = 0;
      }
      entries.set(key, entry);
      if (entries.size > 5000) entries.delete(entries.keys().next().value);
    },
    clear(key) {
      entries.delete(key);
    },
  };
}
