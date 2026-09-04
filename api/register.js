/* POST /api/register — a player signing themselves up on the site.

   The rules live in lib/validate.js, shared with the coach's own add-player
   form so the two can never drift apart. */

import { query, isConfigured } from '../lib/db.js';
import { validatePlayer, decodePhoto, clean } from '../lib/validate.js';

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

  // Honeypot: a real person never fills a field they cannot see. Answer 200 so
  // a bot cannot tell it was caught.
  if (clean((req.body || {}).website, 80)) return res.status(200).json({ ok: true });

  const { player: p, error } = validatePlayer(req.body);
  if (error) return res.status(400).json({ error: 'invalid', message: error });

  // A player signing themselves up ticks the release and supplies a headshot.
  // Both are required here; the coach's form treats them differently.
  if (req.body.waiverAccepted !== true) {
    return res.status(400).json({ error: 'invalid',
      message: 'Tienes que aceptar el descargo de responsabilidad.' });
  }

  const photo = decodePhoto(req.body.photo);
  if (photo.error) return res.status(400).json({ error: 'invalid', message: photo.error });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || null;

  try {
    const { rows } = await query(
      `INSERT INTO players
         (division, team, name, dob, phone, email, address,
          guardian_name, guardian_phone, photo, photo_type,
          status, source, payment_method, waiver_accepted_at, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING id`,
      [p.division, p.team, p.name, p.dob, p.phone, p.email, p.address,
       p.guardianName, p.guardianPhone, photo.buf, photo.type,
       'active', 'online', '',
       new Date(),           // our clock, not the browser's
       ip]
    );

    return res.status(201).json({ ok: true, id: Number(rows[0].id) });
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
