/* Made-up games for showing the schedule before the coach has entered any.
   Only loaded by calendario.js when the address ends in ?demo — the real page
   never reads this file, and nothing here ever reaches the database.

   Dates are worked out from today, so the demo always has games that were
   played, games tonight and games coming up, whenever it is opened. */

'use strict';

window.LVSL_SAMPLE_GAMES = (function () {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const base = new Date(today + 'T12:00:00Z');

  /* The weekday (0 = Sunday) `weeks` weeks from this week's one. A week whose
     day is still ahead counts as "this week", so weeks 0 can be today. */
  function day(weekday, weeks) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + ((weekday - d.getUTCDay() + 7) % 7) + 7 * weeks);
    return d.toISOString().slice(0, 10);
  }

  const F1 = 'Bettye Wilson Soccer Complex — Cancha 3';
  const F2 = 'Bettye Wilson Soccer Complex — Cancha 4';
  const M = 'martes-open', W = 'miercoles-premier';
  let id = 0;

  const g = (division, home, away, date, time, field, extra) => Object.assign({
    id: ++id, division, home, away, date, time, field,
    status: 'scheduled', homeScore: null, awayScore: null, note: '',
  }, extra);
  const fin = (h, a) => ({ status: 'final', homeScore: h, awayScore: a });

  // Two weeks played and the next one coming up, in each of two divisions.
  // A score only goes on a game whose day has already passed.
  const tue = [day(2, -2), day(2, -1), day(2, 0)];
  const wed = [day(3, -2), day(3, -1), day(3, 0)];
  const played = (date, score) => (date < today ? score : {});

  return [
    g(M, 'LV UNITED', 'JALISCO',   tue[0], '19:00', F1, played(tue[0], fin(3, 1))),
    g(M, 'LA BANDA',  'MARINEROS', tue[0], '20:00', F1, played(tue[0], fin(2, 2))),
    g(M, 'LEGACY',    'GUERRERO',  tue[0], '21:00', F2, played(tue[0], fin(0, 4))),
    g(M, 'JALISCO',   'LA BANDA',  tue[1], '19:00', F1, played(tue[1], fin(1, 2))),
    g(M, 'GUERRERO',  'LV UNITED', tue[1], '20:00', F1, played(tue[1], fin(2, 2))),
    g(M, 'MARINEROS', 'LEGACY',    tue[1], '21:00', F2, played(tue[1], fin(5, 3))),
    g(M, 'LV UNITED', 'LA BANDA',  tue[2], '19:00', F1),
    g(M, 'GUERRERO',  'MARINEROS', tue[2], '20:00', F1),
    g(M, 'JALISCO',   'LEGACY',    tue[2], '21:00', F2),

    g(W, 'AJAX',         'AMERICA',      wed[0], '19:30', F2, played(wed[0], fin(2, 1))),
    g(W, 'FC BARCELONA', 'INTER FC',     wed[0], '20:30', F2, played(wed[0], fin(0, 0))),
    g(W, 'ELITE',        'LOBITOS FC',   wed[0], '21:30', F2, { status: 'cancelled', note: 'Cancelado por lluvia' }),
    g(W, 'AMERICA',      'FC BARCELONA', wed[1], '19:30', F2, played(wed[1], fin(1, 3))),
    g(W, 'INTER FC',     'AJAX',         wed[1], '20:30', F2, played(wed[1], fin(2, 2))),
    g(W, 'LOBITOS FC',   'ELITE',        wed[1], '21:30', F2, played(wed[1], fin(4, 0))),
    g(W, 'AJAX',         'FC BARCELONA', wed[2], '19:30', F2),
    g(W, 'AMERICA',      'LOBITOS FC',   wed[2], '20:30', F2),
    g(W, 'ELITE',        'INTER FC',     wed[2], '21:30', F2),
  ];
})();
