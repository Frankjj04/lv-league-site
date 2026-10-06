/* =========================================
   LAS VEGAS SOCCER LEAGUE — Schedule page

   Reads /api/games (public) and shows one division at a time in three
   views: upcoming games, results, and the standings worked out from those
   results. Polls once a minute while the tab is visible, so a score a
   referee types at the field shows up without a reload.
   ========================================= */

'use strict';

(function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const $ = (id) => document.getElementById(id);
  const KEY_DIV = 'lvsl-sched-div';
  const KEY_TEAM = 'lvsl-sched-team';
  const POLL_MS = 60 * 1000;

  let games = [];
  let loaded = false;
  let failed = false;
  let division = '';
  let team = '';
  let view = 'games';

  /* ---------- small helpers ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const t = (key) => {
    const d = (window.LVSL_TRANSLATIONS || {})[lang()] || {};
    return d[key] !== undefined ? d[key] : key;
  };

  const store = {
    get(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  /* Today in Las Vegas, as YYYY-MM-DD — a player in another zone still sees
     "Hoy" on the night the game is played. */
  const today = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  function addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function dayLabel(iso) {
    const d = new Date(iso + 'T12:00:00Z');
    const s = d.toLocaleDateString(lang() === 'en' ? 'en-US' : 'es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function timeLabel(hhmm) {
    if (!hhmm) return t('sc_tbd_time');
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + ' ' + ampm;
  }

  const divLabel = (d) => (lang() === 'en' ? d.en : d.es);
  const mapsUrl = (place) => 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(place + ', Las Vegas, NV');

  const inDivision = () => games.filter((g) => g.division === division);
  const forTeam = (list) => (team ? list.filter((g) => g.home === team || g.away === team) : list);

  /* ---------- choosing a division ---------- */

  /* Without a saved choice, open on the division with the next game, so the
     page lands on something useful on game night. */
  function defaultDivision() {
    const saved = store.get(KEY_DIV);
    if (DIVISIONS.some((d) => d.id === saved)) return saved;
    const now = today();
    const next = games
      .filter((g) => g.date >= now && g.status !== 'final')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))[0];
    return next ? next.division : (DIVISIONS[0] || {}).id || '';
  }

  function renderTabs() {
    $('divTabs').innerHTML = DIVISIONS.map((d) =>
      '<button type="button" role="tab" class="adm-tab' + (d.id === division ? ' active' : '') +
      '" aria-selected="' + (d.id === division) + '" data-div="' + esc(d.id) + '">' +
      esc(divLabel(d)) + '</button>'
    ).join('');
    // On a phone the tabs scroll sideways; keep the chosen one in sight.
    const strip = $('divTabs');
    const on = strip.querySelector('.active');
    if (on && strip.scrollWidth > strip.clientWidth) {
      strip.scrollLeft = on.offsetLeft - strip.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2;
    }
  }

  /* Teams from the division's list plus any that only appear on a game, so a
     team removed from sign-up keeps its results. */
  function divisionTeams() {
    const d = DIVISIONS.find((x) => x.id === division) || {};
    const set = new Set(d.teams || []);
    inDivision().forEach((g) => { set.add(g.home); set.add(g.away); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function renderTeamPick() {
    const teams = divisionTeams();
    if (team && !teams.includes(team)) team = '';
    $('teamPick').innerHTML =
      '<option value="">' + esc(t('sc_team_all')) + '</option>' +
      teams.map((n) => '<option' + (n === team ? ' selected' : '') + '>' + esc(n) + '</option>').join('');
  }

  /* ---------- games and results ---------- */
  function gameCard(g) {
    const final = g.status === 'final';
    const cancelled = g.status === 'cancelled';
    const homeWin = final && g.homeScore > g.awayScore;
    const awayWin = final && g.awayScore > g.homeScore;
    const mine = (n) => (team && n === team ? ' is-mine' : '');

    let state = '';
    if (final) state = '<span class="tag gm-tag gm-tag--final">' + esc(t('sc_final')) + '</span>';
    else if (cancelled) state = '<span class="tag gm-tag gm-tag--off">' + esc(t('sc_cancelled')) + '</span>';
    else if (g.date < today()) state = '<span class="tag gm-tag">' + esc(t('sc_pending')) + '</span>';

    const side = (name, goals, win) =>
      '<div class="gm-team' + (win ? ' is-win' : '') + mine(name) + '">' +
        '<span class="gm-name">' + esc(name) + '</span>' +
        (final ? '<span class="gm-score">' + goals + '</span>' : '') +
      '</div>';

    return '<li class="gm' + (final ? ' is-final' : '') + (cancelled ? ' is-off' : '') + '">' +
      '<div class="gm-when">' +
        '<span class="gm-time">' + esc(timeLabel(g.time)) + '</span>' +
        (g.field
          ? '<a class="gm-field" href="' + mapsUrl(g.field) + '" target="_blank" rel="noopener" title="' +
            esc(t('sc_directions')) + '"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>' +
            esc(g.field) + '</a>'
          : '') +
      '</div>' +
      '<div class="gm-teams">' + side(g.home, g.homeScore, homeWin) + side(g.away, g.awayScore, awayWin) + '</div>' +
      (state ? '<div class="gm-state">' + state + '</div>' : '') +
      (g.note ? '<p class="gm-note">' + esc(g.note) + '</p>' : '') +
    '</li>';
  }

  function byDay(list) {
    const days = new Map();
    list.forEach((g) => { if (!days.has(g.date)) days.set(g.date, []); days.get(g.date).push(g); });
    const now = today();
    return Array.from(days, ([date, list]) => {
      let flag = '';
      if (date === now) flag = '<span class="tag tag--orange">' + esc(t('sc_today')) + '</span>';
      else if (date === addDays(now, 1)) flag = '<span class="tag">' + esc(t('sc_tomorrow')) + '</span>';
      return '<section class="gm-day' + (date === now ? ' is-today' : '') + '">' +
        '<h3 class="gm-date">' + esc(dayLabel(date)) + flag + '</h3>' +
        '<ul class="gm-list">' + list.map(gameCard).join('') + '</ul>' +
      '</section>';
    }).join('');
  }

  const empty = (key) => '<p class="sched-empty">' + esc(t(team ? 'sc_empty_team' : key)) + '</p>';

  function renderGames() {
    const now = today();
    const list = forTeam(inDivision())
      .filter((g) => g.date >= now && g.status !== 'final')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    return list.length ? byDay(list) : empty('sc_empty_games');
  }

  /* Played games, newest first. A past game still waiting on its score sits
     here too, marked pending, rather than vanishing between the two lists. */
  function renderResults() {
    const now = today();
    const list = forTeam(inDivision())
      .filter((g) => g.status === 'final' || (g.date < now && g.status !== 'cancelled'))
      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time));
    return list.length ? byDay(list) : empty('sc_empty_results');
  }

  /* ---------- standings ---------- */
  function standings() {
    const rows = new Map();
    const row = (n) => {
      if (!rows.has(n)) rows.set(n, { team: n, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 });
      return rows.get(n);
    };
    divisionTeams().forEach(row);

    inDivision().filter((g) => g.status === 'final').forEach((g) => {
      const h = row(g.home), a = row(g.away);
      h.p++; a.p++;
      h.gf += g.homeScore; h.ga += g.awayScore;
      a.gf += g.awayScore; a.ga += g.homeScore;
      if (g.homeScore > g.awayScore) { h.w++; a.l++; }
      else if (g.homeScore < g.awayScore) { a.w++; h.l++; }
      else { h.d++; a.d++; }
    });

    return Array.from(rows.values())
      .map((r) => Object.assign(r, { gd: r.gf - r.ga, pts: r.w * 3 + r.d }))
      .sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
  }

  function renderTable() {
    if (!inDivision().some((g) => g.status === 'final')) {
      return '<p class="sched-empty">' + esc(t('sc_empty_table')) + '</p>';
    }
    const cols = ['p', 'w', 'd', 'l', 'gf', 'ga', 'gd', 'pts'];
    const head = '<tr><th class="st-pos">#</th><th>' + esc(t('sc_th_team')) + '</th>' +
      cols.map((c) => '<th class="st-n' + (c === 'pts' ? ' st-pts' : '') + (['gf', 'ga'].includes(c) ? ' st-wide' : '') + '">' + esc(t('sc_th_' + c)) + '</th>').join('') + '</tr>';
    const body = standings().map((r, i) =>
      '<tr' + (team && r.team === team ? ' class="is-mine"' : '') + '><td class="st-pos">' + (i + 1) + '</td>' +
      '<td class="st-team">' + esc(r.team) + '</td>' +
      cols.map((c) => '<td class="st-n' + (c === 'pts' ? ' st-pts' : '') + (['gf', 'ga'].includes(c) ? ' st-wide' : '') + '">' +
        (c === 'gd' && r.gd > 0 ? '+' : '') + r[c] + '</td>').join('') +
      '</tr>'
    ).join('');
    return '<div class="table-scroll st-wrap"><table class="st"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>' +
      '<p class="st-note">' + esc(t('sc_table_note')) + '</p>';
  }

  /* ---------- render ---------- */
  function render() {
    renderTabs();
    renderTeamPick();
    document.querySelectorAll('.sched-view').forEach((b) => {
      b.classList.toggle('active', b.dataset.view === view);
      b.setAttribute('aria-selected', String(b.dataset.view === view));
    });

    let html;
    if (!loaded) html = '<p class="sched-empty">' + esc(t(failed ? 'sc_error' : 'sc_loading')) + '</p>';
    else if (view === 'results') html = renderResults();
    else if (view === 'table') html = renderTable();
    else html = renderGames();
    $('sched').innerHTML = html;
  }

  /* ---------- load ---------- */
  async function load() {
    try {
      const res = await fetch('/api/games', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      games = Array.isArray(data) ? data : [];
      failed = false;
      if (!loaded) {
        loaded = true;
        division = defaultDivision();
        team = store.get(KEY_TEAM);
      }
    } catch (e) {
      // Keep showing what we had; only an empty page reports the failure.
      if (!loaded) failed = true;
    }
    render();
  }

  /* ---------- events ---------- */
  $('divTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-div]');
    if (!b) return;
    division = b.dataset.div;
    team = '';
    store.set(KEY_DIV, division);
    store.set(KEY_TEAM, '');
    render();
  });

  $('teamPick').addEventListener('change', (e) => {
    team = e.target.value;
    store.set(KEY_TEAM, team);
    render();
  });

  document.querySelectorAll('.sched-view').forEach((b) => {
    b.addEventListener('click', () => { view = b.dataset.view; render(); });
  });

  // main.js switches the language by setting <html lang>; follow it.
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  setInterval(() => { if (!document.hidden) load(); }, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && loaded) load(); });

  division = (DIVISIONS[0] || {}).id || '';
  render();
  load();
})();
