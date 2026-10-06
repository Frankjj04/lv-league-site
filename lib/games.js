/* The rules for a game on the schedule, shared by the coach's form and the
   referee's score screen so the two can never disagree about what is valid.

   Validators return { game } / { score } or { error, code }, like
   lib/validate.js does for players. */

import { clean } from './validate.js';

export const STATUSES = ['scheduled', 'final', 'cancelled'];
export const MAX_GOALS = 99;

/* Referees can score a game from the day before up to today, Las Vegas time.
   One shared password is handed to every referee, so this keeps a leaked one
   from rewriting the whole season's results — anything older is the coach's. */
export const REF_WINDOW_DAYS = 1;

const fail = (code, error) => ({ error, code });

/* Today's date in Las Vegas as YYYY-MM-DD, whatever zone the server runs in. */
export function todayInVegas(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
}

export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* Is this game's date one a referee may still score? */
export function refMayScore(gameDate, now = new Date()) {
  const today = todayInVegas(now);
  return gameDate <= today && gameDate >= addDays(today, -REF_WINDOW_DAYS);
}

function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}

/* A goal count, or null when the box was left empty. Anything else is NaN. */
function goals(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= MAX_GOALS ? n : NaN;
}

/* Checks a score on its own. Both numbers are required: half a score is a
   typo, never a result. */
export function validateScore(body) {
  const b = body || {};
  const home = goals(b.homeScore);
  const away = goals(b.awayScore);
  if (home === null || away === null) return fail('score_missing', 'Pon los goles de los dos equipos.');
  if (Number.isNaN(home) || Number.isNaN(away)) return fail('score_bad', 'Los goles tienen que ser un número de 0 a 99.');
  return { score: { home, away } };
}

/* Everything the coach can set on a game. */
export function validateGame(body) {
  const b = body || {};

  const g = {
    division: clean(b.division, 60),
    home:     clean(b.home, 80).toUpperCase(),
    away:     clean(b.away, 80).toUpperCase(),
    date:     clean(b.date, 10),
    time:     clean(b.time, 5),
    field:    clean(b.field, 120),
    status:   clean(b.status, 12) || 'scheduled',
    note:     clean(b.note, 160),
    homeScore: null,
    awayScore: null,
  };

  if (!g.division) return fail('division', 'Elige la división.');
  if (!g.home)     return fail('home', 'Elige el equipo local.');
  if (!g.away)     return fail('away', 'Elige el equipo visitante.');
  if (g.home === g.away) return fail('same_team', 'Un equipo no puede jugar contra sí mismo.');
  if (!validDate(g.date)) return fail('date', 'Pon la fecha del partido.');
  if (g.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(g.time)) return fail('time', 'Esa hora no parece correcta.');
  if (!STATUSES.includes(g.status)) return fail('status', 'Ese estado no existe.');

  // Only a final carries a score. Moving a game back to scheduled or to
  // cancelled drops it, so an old result can never linger on the schedule.
  if (g.status === 'final') {
    const { score, error, code } = validateScore(b);
    if (error) return fail(code, error);
    g.homeScore = score.home;
    g.awayScore = score.away;
  }

  return { game: g };
}

/* Every query selects these, so the date always arrives as plain text: pg
   would otherwise turn a DATE into a Date at local midnight, and the day could
   shift with the server's time zone. */
export const GAME_COLUMNS = `id, division, home, away, game_date::text AS game_date, game_time,
  field, status, home_score, away_score, note, score_by, score_name, score_at`;

/* A database row as the browser sees it. `full` adds who entered the score,
   which only the coach's page shows. */
export function gameOut(r, { full = false } = {}) {
  const out = {
    id: Number(r.id),
    division: r.division,
    home: r.home,
    away: r.away,
    date: String(r.game_date).slice(0, 10),   // selected as ::text, see GAME_COLUMNS
    time: r.game_time,
    field: r.field,
    status: r.status,
    homeScore: r.status === 'final' ? r.home_score : null,
    awayScore: r.status === 'final' ? r.away_score : null,
    note: r.note,
  };
  if (full) {
    out.scoreBy = r.score_by;
    out.scoreName = r.score_name;
    out.scoreAt = r.score_at;
  }
  return out;
}
