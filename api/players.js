/* GET /api/players — the roster, for the coach's page only.

   Photos are not inlined here: a few hundred players would make the response
   enormous. Each row carries a photoUrl pointing at /api/photo, which the
   browser fetches and caches like any other image. */

import { query, isConfigured } from '../lib/db.js';
import { requireAdmin } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!requireAdmin(req, res)) return;

  if (!isConfigured()) {
    return res.status(503).json({ error: 'not_configured' });
  }

  try {
    const { rows } = await query(
      `SELECT id, division, team, name, dob, phone, email, address,
              guardian_name, guardian_phone, status,
              waiver_accepted_at, created_at,
              (photo IS NOT NULL) AS has_photo
         FROM players
        ORDER BY division, team, name`
    );

    res.setHeader('Cache-Control', 'private, no-store');

    return res.status(200).json(rows.map((r) => ({
      id: Number(r.id),
      division: r.division,
      team: r.team,
      name: r.name,
      dob: r.dob instanceof Date ? r.dob.toISOString().slice(0, 10) : String(r.dob),
      phone: r.phone,
      email: r.email,
      address: r.address,
      guardianName: r.guardian_name,
      guardianPhone: r.guardian_phone,
      status: r.status,
      photo: r.has_photo ? '/api/photo?id=' + r.id : '',
      waiverAcceptedAt: r.waiver_accepted_at,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('players failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
