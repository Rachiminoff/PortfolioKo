import { VAULT_COOKIE } from './vault/session.js';
import { isSameOrigin, setSecurityHeaders } from './_security.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  if (!isSameOrigin(req)) return res.status(403).json({ success: false, error: 'Forbidden' });

  res.setHeader(
    'Set-Cookie',
    `${VAULT_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
  );
  return res.status(200).json({ success: true });
}
