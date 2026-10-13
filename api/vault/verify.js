import { getVaultToken, isValidVaultToken } from '../../src/server/vaultSession.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ valid: false, error: 'Method not allowed' });
  return res.status(200).json({ valid: isValidVaultToken(getVaultToken(req)) });
}
