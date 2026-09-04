/* POST /api/register — a player signing up.

   Everything the browser sent is re-validated here. The form's own checks are
   there to be helpful; these are the ones that count. */

import { query, isConfigured } from '../lib/db.js';

const MINOR_AGE = 18;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;   // after the browser downscales it

const digits = (s) => String(s || '').replace(/\D/g, '');
const clean  = (s, max) => String(s == null ? '' : s).trim().slice(0, max);

function ageOn(dob) {
  const d = new Date(dob + 'T00:00:00Z');
  if (isNaN(d)) return null;
  const now = new Date();
  let a = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) a--;
  return a;
}

/* Decodes the data URL the form produced, and checks it really is a JPEG or
   PNG by its magic bytes — the declared type is just a claim. */
function decodePhoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) return { error: 'La foto no llegó correctamente.' };

  let buf;
  try { buf = Buffer.from(m[2], 'base64'); }
  catch { return { error: 'La foto no llegó correctamente.' }; }

  if (!buf.length) return { error: 'La foto no llegó correctamente.' };
  if (buf.length > MAX_PHOTO_BYTES) return { error: 'La foto pesa demasiado.' };

  const jpeg = buf[0] === 0xFF && buf[1] === 0xD8;
  const png  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (!jpeg && !png) return { error: 'Ese archivo no es una imagen.' };

  return { buf, type: jpeg ? 'image/jpeg' : 'image/png' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!isConfigured()) {
    return res.status(503).json({
      error: 'not_configured',
      message: 'El registro todavía no está conectado. Llámanos al 702-831-9474.',
    });
  }

  const b = req.body || {};

  // Honeypot: a real person never fills a field they cannot see. Answer 200 so
  // a bot cannot tell it was caught.
  if (clean(b.website, 80)) return res.status(200).json({ ok: true });

  const p = {
    division: clean(b.division, 60),
    team:     clean(b.team, 80),
    name:     clean(b.name, 80),
    dob:      clean(b.dob, 10),
    phone:    digits(b.phone).slice(-10),
    email:    clean(b.email, 120).toLowerCase(),
    address:  clean(b.address, 200),
    guardianName:  clean(b.guardianName, 80),
    guardianPhone: digits(b.guardianPhone).slice(-10),
  };

  const bad = (message) => res.status(400).json({ error: 'invalid', message });

  if (!p.division) return bad('Elige tu división.');
  if (!p.team)     return bad('Elige tu equipo.');
  if (!p.name)     return bad('Escribe tu nombre completo.');
  if (!p.address)  return bad('Escribe tu dirección.');
  if (p.phone.length !== 10) return bad('Escribe un teléfono de 10 dígitos.');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(p.email)) return bad('Ese email no parece correcto.');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob)) return bad('Pon tu fecha de nacimiento.');
  const age = ageOn(p.dob);
  if (age === null || age < 4 || age > 100) return bad('Esa fecha no parece correcta.');

  if (age < MINOR_AGE) {
    if (!p.guardianName) return bad('Escribe el nombre de tu tutor.');
    if (p.guardianPhone.length !== 10) return bad('Escribe el teléfono de tu tutor.');
  } else {
    // An adult's form may still carry guardian values if they typed a date,
    // saw the fields, then corrected it. Drop them.
    p.guardianName = '';
    p.guardianPhone = '';
  }

  if (b.waiverAccepted !== true) return bad('Tienes que aceptar el descargo de responsabilidad.');

  const photo = decodePhoto(b.photo);
  if (photo.error) return bad(photo.error);

  // Trust our own clock, not the browser's, for the release timestamp.
  const acceptedAt = new Date();

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;

  try {
    const { rows } = await query(
      `INSERT INTO players
         (division, team, name, dob, phone, email, address,
          guardian_name, guardian_phone, photo, photo_type,
          status, waiver_accepted_at, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING id`,
      [p.division, p.team, p.name, p.dob, p.phone, p.email, p.address,
       p.guardianName, p.guardianPhone, photo.buf, photo.type,
       'active', acceptedAt, ip]
    );

    return res.status(201).json({ ok: true, id: rows[0].id });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({
        error: 'duplicate',
        message: 'Ese email ya está registrado en esta división. Llámanos al 702-831-9474 si necesitas cambiar algo.',
      });
    }
    console.error('register failed:', err);
    return res.status(500).json({
      error: 'server_error',
      message: 'No pudimos guardar tu registro. Inténtalo otra vez o llámanos al 702-831-9474.',
    });
  }
}
