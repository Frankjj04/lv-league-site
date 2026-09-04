/* Password gate for the roster page.

   One shared password in ADMIN_PASSWORD, exchanged for a signed cookie. The
   cookie holds an expiry and an HMAC of it, so it cannot be forged or extended
   without the secret, and nothing about the password is stored in the browser. */

import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

const COOKIE = 'lvsl_admin';
const MAX_AGE = 12 * 60 * 60;        // 12 hours, in seconds

/* Falls back to a random per-instance secret so that a missing SESSION_SECRET
   fails closed — sessions simply stop validating — rather than signing with a
   predictable key. */
const SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');

export function isConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(value) {
  return createHmac('sha256', SECRET).update(value).digest('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkPassword(given) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(given || '', expected);
}

export function issueCookie() {
  const expires = Date.now() + MAX_AGE * 1000;
  const token = expires + '.' + sign(String(expires));
  return COOKIE + '=' + token +
    '; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=' + MAX_AGE;
}

export function clearCookie() {
  return COOKIE + '=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

export function isSignedIn(req) {
  const raw = req.headers.cookie || '';
  const hit = raw.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(COOKIE + '='));
  if (!hit) return false;

  const token = hit.slice(COOKIE.length + 1);
  const dot = token.lastIndexOf('.');
  if (dot < 1) return false;

  const expires = token.slice(0, dot);
  const mac = token.slice(dot + 1);

  if (!safeEqual(mac, sign(expires))) return false;
  return Number(expires) > Date.now();
}

/* Guard for every endpoint that returns player data. */
export function requireAdmin(req, res) {
  if (!isConfigured()) {
    res.status(503).json({ error: 'not_configured',
      message: 'No ADMIN_PASSWORD is set on this project.' });
    return false;
  }
  if (!isSignedIn(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return false;
  }
  return true;
}
