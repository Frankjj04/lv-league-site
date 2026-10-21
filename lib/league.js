/* The rules for a division's team list and starting table, as the coach
   saves them from /admin (Tabla). js/league-config.js has the same shape:
   `teams` is a list of names, `standingsStart` maps a team to its numbers
   from before the site's schedule began.

   validateDivision returns { teams, standingsStart } or { error, code }. */

import { clean } from './validate.js';

export const MAX_TEAMS = 40;
export const STAT_KEYS = ['p', 'w', 'd', 'l', 'gf', 'ga', 'adj'];

// Starting numbers can go below zero: the coach edits the table he sees, and
// the site keeps only the difference from what the games already add, so
// correcting a game typed wrong can leave a negative here.
const MAX_STAT = 999;

const fail = (code, error) => ({ error, code });

export function teamName(s) {
  return clean(s, 80).replace(/\s+/g, ' ').toUpperCase();
}

export function validateDivision(body) {
  const b = body || {};
  if (!Array.isArray(b.teams)) return fail('teams', 'Falta la lista de equipos.');

  const teams = [];
  for (const raw of b.teams) {
    const t = teamName(raw);
    if (!t) return fail('team_blank', 'Hay un equipo sin nombre.');
    if (teams.includes(t)) return fail('team_twice', 'El equipo ' + t + ' está dos veces.');
    teams.push(t);
  }
  if (!teams.length) return fail('no_teams', 'La división necesita al menos un equipo.');
  if (teams.length > MAX_TEAMS) return fail('too_many', 'Son demasiados equipos para una división.');
  teams.sort((a, c) => a.localeCompare(c));

  const given = b.standingsStart && typeof b.standingsStart === 'object' ? b.standingsStart : {};
  const standingsStart = {};
  for (const [raw, stats] of Object.entries(given)) {
    const t = teamName(raw);
    // A team taken off the list takes its numbers with it.
    if (!teams.includes(t)) continue;
    const row = {};
    for (const k of STAT_KEYS) {
      const v = stats && stats[k] !== undefined && stats[k] !== '' ? Number(stats[k]) : 0;
      if (!Number.isInteger(v) || Math.abs(v) > MAX_STAT) {
        return fail('stat', 'Los números de ' + t + ' tienen que ser enteros.');
      }
      if (v) row[k] = v;
    }
    if (Object.keys(row).length) standingsStart[t] = row;
  }

  return { teams, standingsStart };
}
