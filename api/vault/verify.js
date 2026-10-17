import { getVaultSessionToken, isValidVaultSessionToken } from './session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Same-origin only: no CORS headers are emitted, so other sites cannot read this response.
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  return res.status(200).json({ valid: isValidVaultSessionToken(getVaultSessionToken(req)) });
}
