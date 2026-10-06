/* The referees' sign-in, separate from the coach's.

   POST   /api/ref-login  — exchange the referee password for a session cookie
   DELETE /api/ref-login  — sign out
   GET    /api/ref-login  — is this browser signed in as a referee? */

import { checkRefPassword, issueRefCookie, clearRefCookie, isRefSignedIn,
  isRefConfigured, isConfigured } from '../lib/auth.js';

export default async function handler(req, res) {
  const configured = isRefConfigured() || isConfigured();

  if (req.method === 'GET') {
    return res.status(200).json({ signedIn: isRefSignedIn(req), configured });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearRefCookie());
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!configured) {
    return res.status(503).json({ error: 'not_configured',
      message: 'Falta configurar la contraseña de árbitros.' });
  }

  if (!checkRefPassword((req.body && req.body.password) || '')) {
    await new Promise((r) => setTimeout(r, 600));
    return res.status(401).json({ error: 'bad_password', message: 'Contraseña incorrecta.' });
  }

  res.setHeader('Set-Cookie', issueRefCookie());
  return res.status(200).json({ ok: true });
}
