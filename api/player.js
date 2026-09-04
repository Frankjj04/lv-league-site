/* The coach adding a player himself.

   POST  /api/player          create — he took the $15 in cash at the field
   PATCH /api/player?id=N     attach or replace the credential photo

   Both are behind the roster password. This exists because a good share of
   the league will never fill in a web form: they hand the coach $15 and he
   writes them down. */

import { query, isConfigured } from '../lib/db.js';
import { requireAdmin } from '../lib/auth.js';
import { validatePlayer, decodePhoto, clean } from '../lib/validate.js';

const METHODS = ['cash', 'zelle', 'stripe', 'other', ''];

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (!isConfigured()) return res.status(503).json({ error: 'not_configured' });

  if (req.method === 'POST')  return create(req, res);
  if (req.method === 'PATCH') return setPhoto(req, res);

  res.setHeader('Allow', 'POST, PATCH');
  return res.status(405).json({ error: 'method_not_allowed' });
}

async function create(req, res) {
  // The coach is often standing on a field with a player who has no guardian
  // present, so guardian details are encouraged but not enforced here — the
  // form warns him instead. Everything else is checked exactly as it is for a
  // player registering themselves.
  const { player: p, error } = validatePlayer(req.body, { requireGuardian: false });
  if (error) return res.status(400).json({ error: 'invalid', message: error });

  // He has to confirm the player actually agreed to the release. A registration
  // with no accepted waiver is worth less than no registration at all.
  if (req.body.waiverAccepted !== true) {
    return res.status(400).json({ error: 'invalid',
      message: 'Confirma que el jugador aceptó el descargo de responsabilidad.' });
  }

  const method = METHODS.includes(req.body.paymentMethod) ? req.body.paymentMethod : 'cash';
  const note = clean(req.body.note, 200);

  // A photo is optional when he adds someone in person; it can be attached
  // later from the player's panel, and the roster flags who is missing one.
  let photoBuf = null, photoType = 'image/jpeg';
  if (req.body.photo) {
    const photo = decodePhoto(req.body.photo);
    if (photo.error) return res.status(400).json({ error: 'invalid', message: photo.error });
    photoBuf = photo.buf;
    photoType = photo.type;
  }

  try {
    const { rows } = await query(
      `INSERT INTO players
         (division, team, name, dob, phone, email, address,
          guardian_name, guardian_phone, photo, photo_type,
          status, source, payment_method, added_note, waiver_accepted_at, ip)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [p.division, p.team, p.name, p.dob, p.phone, p.email, p.address,
       p.guardianName, p.guardianPhone, photoBuf, photoType,
       'active', 'in_person', method, note, new Date(), null]
    );

    return res.status(201).json({ ok: true, id: Number(rows[0].id), needsPhoto: !photoBuf });
  } catch (err) {
    if (err && err.code === '23505') {
      return res.status(409).json({ error: 'duplicate',
        message: 'Ese email ya está registrado en esa división.' });
    }
    console.error('add player failed:', err);
    return res.status(500).json({ error: 'server_error',
      message: 'No se pudo guardar. Inténtalo otra vez.' });
  }
}

async function setPhoto(req, res) {
  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'bad_id' });

  const photo = decodePhoto((req.body || {}).photo);
  if (photo.error) return res.status(400).json({ error: 'invalid', message: photo.error });

  try {
    const { rowCount } = await query(
      `UPDATE players SET photo = $1, photo_type = $2, updated_at = NOW() WHERE id = $3`,
      [photo.buf, photo.type, id]
    );
    if (!rowCount) return res.status(404).json({ error: 'not_found' });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('set photo failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
