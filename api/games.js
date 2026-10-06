/* GET /api/games — the schedule.

   Public: this is what /calendario shows, so it carries only what a player
   needs. With ?full=1 and the coach signed in it also says who entered each
   score, for his own page. With ?ref=1 and a referee signed in it returns only
   the games a referee may still score, each saying whether the coach already
   locked it with his own score. */

import { query, isConfigured } from '../lib/db.js';
import { isSignedIn, isRefSignedIn } from '../lib/auth.js';
import { GAME_COLUMNS, gameOut, refMayScore } from '../lib/games.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!isConfigured()) return res.status(503).json({ error: 'not_configured' });

  const q = req.query || {};
  const full = (q.full === '1' || q.full === 'true') && isSignedIn(req);
  const refView = q.ref === '1' && !full;
  if (refView && !isRefSignedIn(req) && !isSignedIn(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  try {
    const { rows } = await query(
      `SELECT ${GAME_COLUMNS} FROM games ORDER BY game_date, game_time, id`
    );

    // A score typed at the field should reach the schedule within seconds, so
    // the shared cache keeps it only briefly. The coach's copy is never cached.
    res.setHeader('Cache-Control', full || refView
      ? 'private, no-store'
      : 'public, max-age=0, s-maxage=10, stale-while-revalidate=30');

    if (refView) {
      return res.status(200).json(rows
        .filter((r) => r.status !== 'cancelled' && refMayScore(r.game_date))
        .map((r) => Object.assign(gameOut(r), {
          lockedByCoach: r.status === 'final' && r.score_by === 'coach',
        })));
    }

    return res.status(200).json(rows.map((r) => gameOut(r, { full })));
  } catch (err) {
    console.error('games failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}
