import { getVaultSessionToken, isValidVaultSessionToken } from './vault/session.js';
import { setSecurityHeaders } from './_security.js';
import { personaData } from './_data/persona.js';

// Private Persona content lives on the server so it is not shipped in the public JS bundle.
export default async function handler(req, res) {
  setSecurityHeaders(res);
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  if (!isValidVaultSessionToken(getVaultSessionToken(req))) {
    return res.status(401).json({ error: 'Unauthorized.' });
  }
  return res.status(200).json({ data: personaData });
}
