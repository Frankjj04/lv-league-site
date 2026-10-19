/* =========================================
   LAS VEGAS SOCCER LEAGUE — Home page

   "Esta semana": the next 7 days of games across every division, read from
   the same public /api/games the schedule uses. ?demo shows the made-up
   games (js/sample-games.js) instead of calling the API.
   ========================================= */

'use strict';

(function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const DEMO = new URLSearchParams(location.search).has('demo');
  const DAYS = 7;   // "this week" = today plus the next 6 days
  const MAX = 15;   // cards on the home page (rows of 3); the rest are on /calendario
  const box = document.getElementById('week');
  let games = null;

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const t = (key) => {
    const d = (window.LVSL_TRANSLATIONS || {})[lang()] || {};
    return d[key] !== undefined ? d[key] : key;
  };

  // Today in Las Vegas, so "Hoy" is right for a player in another time zone.
  const today = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  };

  function dayLabel(iso) {
    const now = today();
    if (iso === now) return t('sc_today');
    if (iso === addDays(now, 1)) return t('sc_tomorrow');
    const s = new Date(iso + 'T12:00:00Z').toLocaleDateString(lang() === 'en' ? 'en-US' : 'es-MX', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
    });
    return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '');
  }

  function timeLabel(hhmm) {
    if (!hhmm) return t('sc_tbd_time');
    const [h, m] = hhmm.split(':').map(Number);
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h >= 12 ? 'PM' : 'AM');
  }

  const divLabel = (id) => {
    const d = DIVISIONS.find((x) => x.id === id);
    return d ? (lang() === 'en' ? d.en : d.es) : '';
  };

  // A played game shows its score next to each team.
  const score = (g, k) => (g.status === 'final' && g[k] != null ? ' <span class="wk-score">' + esc(g[k]) + '</span>' : '');

  function render() {
    if (games === null) return;
    const now = today();
    const end = addDays(now, DAYS - 1);
    const upcoming = games
      .filter((g) => g.status !== 'final' && g.date >= now)
      .sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')));
    // This week first; if nothing is scheduled this week, the next games;
    // with nothing coming up at all, the most recent game day(s) instead of
    // an empty section.
    let list = upcoming.filter((g) => g.date <= end);
    if (!list.length) list = upcoming;
    let recent = false;
    if (!list.length) {
      const past = games.filter((g) => g.date < now).sort((a, b) =>
        (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
      const days = [...new Set(past.map((g) => g.date))].slice(0, 2);
      list = past.filter((g) => days.includes(g.date))
        .sort((a, b) => (a.date + (a.time || '99')).localeCompare(b.date + (b.time || '99')));
      recent = list.length > 0;
    }
    list = list.slice(0, MAX);
    const h2 = document.getElementById('weekTitle');
    if (h2) h2.innerHTML = t(recent ? 'hm_last_h2' : 'hm_week_h2');

    if (!list.length) {
      box.innerHTML = '<p class="sched-empty">' + esc(t('hm_week_empty')) + '</p>';
      return;
    }
    box.innerHTML = list.map((g) =>
      '<article class="wk-card">' +
        '<div class="wk-when"><span class="wk-day">' + esc(dayLabel(g.date)) + '</span>' +
          '<span class="wk-time">' + esc(timeLabel(g.time)) + '</span></div>' +
        '<p class="wk-div">' + esc(divLabel(g.division)) + '</p>' +
        '<p class="wk-team">' + esc(g.home) + score(g, 'homeScore') + '</p>' +
        '<p class="wk-vs">vs</p>' +
        '<p class="wk-team">' + esc(g.away) + score(g, 'awayScore') + '</p>' +
        (g.field ? '<p class="wk-field">' + esc(g.field) + '</p>' : '') +
      '</article>'
    ).join('');
  }

  async function load() {
    if (DEMO) {
      games = (window.LVSL_SAMPLE_GAMES || []).slice();
      // keep the demo going when they tap through to the full schedule
      document.querySelectorAll('a[href="calendario.html"]').forEach((a) => { a.href = 'calendario.html?demo'; });
      return render();
    }
    try {
      const res = await fetch('/api/games', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      games = Array.isArray(data) ? data : [];
    } catch (e) {
      games = [];
      box.innerHTML = '<p class="sched-empty">' + esc(t('sc_error')) + '</p>';
      return;
    }
    render();
  }

  // main.js switches the language by setting <html lang>; follow it.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  load();
})();
