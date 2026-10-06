/* Changing the schedule.

   POST   /api/game              add a game                         coach
   PATCH  /api/game?id=N         edit everything about a game       coach
   PATCH  /api/game?id=N         { mode: 'score', ... } — the score  coach or referee
   DELETE /api/game?id=N         remove a game                      coach

   A referee can only put a score on a game, and only on one played today or
   yesterday (lib/games.js REF_WINDOW_DAYS), and never over a score the coach
   entered himself. Everything else needs the coach's password. */

import { query, isConfigured } from '../lib/db.js';
import { isConfigured as isAuthConfigured, isSignedIn, isRefSignedIn } from '../lib/auth.js';
import { validateGame, validateScore, refMayScore, gameOut, GAME_COLUMNS } from '../lib/games.js';
import { clean } from '../lib/validate.js';

export default async function handler(req, res) {
  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'POST, PATCH, DELETE');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!isAuthConfigured()) return res.status(503).json({ error: 'not_configured' });

  const coach = isSignedIn(req);
  const ref = !coach && isRefSignedIn(req);
  const scoring = req.method === 'PATCH' && (req.body || {}).mode === 'score';

  if (!coach && !(ref && scoring)) return res.status(401).json({ error: 'unauthorized' });
  if (!isConfigured()) return res.status(503).json({ error: 'not_configured' });

  try {
    if (req.method === 'POST') return await create(req, res);

    const id = Number((req.query || {}).id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'bad_id' });

    if (req.method === 'DELETE') return await remove(res, id);
    if (scoring) return await score(req, res, id, coach ? 'coach' : 'ref');
    return await edit(req, res, id);
  } catch (err) {
    console.error('game failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}

const refuse = (res, code, message) =>
  res.status(400).json({ error: 'invalid', code, message });

async function create(req, res) {
  const { game: g, error, code } = validateGame(req.body);
  if (error) return refuse(res, code, error);

  const { rows } = await query(
    `INSERT INTO games (division, home, away, game_date, game_time, field, status,
                        home_score, away_score, note, score_by, score_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
             CASE WHEN $7 = 'final' THEN 'coach' ELSE '' END,
             CASE WHEN $7 = 'final' THEN NOW() END)
     RETURNING ${GAME_COLUMNS}`,
    [g.division, g.home, g.away, g.date, g.time, g.field, g.status,
     g.homeScore, g.awayScore, g.note]
  );
  return res.status(201).json(gameOut(rows[0], { full: true }));
}

async function edit(req, res, id) {
  const { game: g, error, code } = validateGame(req.body);
  if (error) return refuse(res, code, error);

  // The score's author only changes when the score itself does, so fixing a
  // field name does not take a referee's result over as the coach's.
  const { rows } = await query(
    `UPDATE games SET
        division = $2, home = $3, away = $4, game_date = $5, game_time = $6,
        field = $7, note = $11,
        score_by   = CASE WHEN $8 <> 'final' THEN ''
                          WHEN status = 'final' AND home_score = $9::smallint
                               AND away_score = $10::smallint THEN score_by
                          ELSE 'coach' END,
        score_name = CASE WHEN $8 <> 'final' THEN ''
                          WHEN status = 'final' AND home_score = $9::smallint
                               AND away_score = $10::smallint THEN score_name
                          ELSE '' END,
        score_at   = CASE WHEN $8 <> 'final' THEN NULL
                          WHEN status = 'final' AND home_score = $9::smallint
                               AND away_score = $10::smallint THEN score_at
                          ELSE NOW() END,
        status = $8, home_score = $9, away_score = $10,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${GAME_COLUMNS}`,
    [id, g.division, g.home, g.away, g.date, g.time, g.field, g.status,
     g.homeScore, g.awayScore, g.note]
  );
  if (!rows.length) return res.status(404).json({ error: 'not_found' });
  return res.status(200).json(gameOut(rows[0], { full: true }));
}

async function score(req, res, id, by) {
  const { score: s, error, code } = validateScore(req.body);
  if (error) return refuse(res, code, error);

  const { rows: found } = await query(
    `SELECT ${GAME_COLUMNS} FROM games WHERE id = $1`, [id]
  );
  if (!found.length) return res.status(404).json({ error: 'not_found' });
  const game = found[0];

  if (game.status === 'cancelled') {
    return refuse(res, 'cancelled', 'Este partido está cancelado.');
  }
  if (by === 'ref') {
    if (!refMayScore(game.game_date)) {
      return res.status(403).json({ error: 'too_old', code: 'too_old',
        message: 'Este partido ya no se puede cambiar desde aquí. Avísale al coach.' });
    }
    if (game.status === 'final' && game.score_by === 'coach') {
      return res.status(403).json({ error: 'coach_score', code: 'coach_score',
        message: 'El coach ya puso este marcador. Si está mal, avísale a él.' });
    }
  }

  const { rows } = await query(
    `UPDATE games SET status = 'final', home_score = $2, away_score = $3,
            score_by = $4, score_name = $5, score_at = NOW(), updated_at = NOW()
      WHERE id = $1
      RETURNING ${GAME_COLUMNS}`,
    [id, s.home, s.away, by, clean((req.body || {}).name, 60)]
  );
  return res.status(200).json(gameOut(rows[0], { full: by === 'coach' }));
}

async function remove(res, id) {
  const { rowCount } = await query('DELETE FROM games WHERE id = $1', [id]);
  if (!rowCount) return res.status(404).json({ error: 'not_found' });
  return res.status(200).json({ ok: true });
}
