import { getVaultSessionToken, isValidVaultSessionToken } from './session.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cookie');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ valid: false, error: 'Method not allowed' });
  }

  return res.status(200).json({ valid: isValidVaultSessionToken(getVaultSessionToken(req)) });
}
