/* The coach's edits to each division: its team list and starting table.

   GET /api/league          { divisions: { id: { teams, standingsStart } } }
   GET /api/league?js=1     the same, as a script that writes the edits into
                            window.LVSL_CONFIG. Every page loads it right after
                            js/league-config.js, so the rest of the site reads
                            the config as it always has. Add &fresh=1 to skip
                            the cache (the coach's own page does).
   PUT /api/league?division=ID  { teams, standingsStart }      coach only

   A division the coach never saved is left as js/league-config.js has it. */

import { query, isConfigured } from '../lib/db.js';
import { isConfigured as isAuthConfigured, isSignedIn } from '../lib/auth.js';
import { validateDivision } from '../lib/league.js';
import { clean } from '../lib/validate.js';

/* Runs in the browser. Changes the division objects in place, since every
   page script keeps a reference to LVSL_CONFIG.divisions. */
const APPLY = `(function (edits) {
  var cfg = window.LVSL_CONFIG;
  if (!cfg || !cfg.divisions) return;
  cfg.divisions.forEach(function (d) {
    var e = edits[d.id];
    if (!e) return;
    d.teams = e.teams;
    d.standingsStart = e.standingsStart;
  });
})`;

export default async function handler(req, res) {
  const q = req.query || {};

  if (req.method === 'GET') return read(res, q.js === '1', q.fresh === '1');

  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!isAuthConfigured()) return res.status(503).json({ error: 'not_configured' });
  if (!isSignedIn(req)) return res.status(401).json({ error: 'unauthorized' });
  if (!isConfigured()) return res.status(503).json({ error: 'not_configured' });

  const division = clean(q.division, 60);
  if (!/^[a-z0-9-]+$/.test(division)) return res.status(400).json({ error: 'bad_division' });

  const { teams, standingsStart, error, code } = validateDivision(req.body);
  if (error) return res.status(400).json({ error: 'invalid', code, message: error });

  try {
    await query(
      `INSERT INTO division_edits (division, teams, standings_start, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (division) DO UPDATE
         SET teams = EXCLUDED.teams, standings_start = EXCLUDED.standings_start,
             updated_at = NOW()`,
      [division, JSON.stringify(teams), JSON.stringify(standingsStart)]
    );
    return res.status(200).json({ division, teams, standingsStart });
  } catch (err) {
    console.error('league save failed:', err);
    return res.status(500).json({ error: 'server_error' });
  }
}

async function read(res, asScript, fresh) {
  let edits = {};
  let failed = false;
  if (isConfigured()) {
    try {
      const { rows } = await query('SELECT division, teams, standings_start FROM division_edits');
      rows.forEach((r) => { edits[r.division] = { teams: r.teams, standingsStart: r.standings_start || {} }; });
    } catch (err) {
      console.error('league read failed:', err);
      failed = true;
    }
  }

  // Short shared cache, like the schedule: an edit shows within seconds. A
  // failed read is never cached, so the next visitor tries again.
  res.setHeader('Cache-Control', fresh || failed
    ? 'private, no-store'
    : 'public, max-age=0, s-maxage=10, stale-while-revalidate=30');

  if (asScript) {
    // On a failure the page still works, from league-config.js alone.
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    return res.status(200).send(failed ? '/* league edits unavailable */\n'
      : APPLY + '(' + JSON.stringify(edits).replace(/</g, '\\u003c') + ');\n');
  }
  if (failed) return res.status(500).json({ error: 'server_error' });
  return res.status(200).json({ divisions: edits });
}
