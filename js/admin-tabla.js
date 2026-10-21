/* =========================================
   LAS VEGAS SOCCER LEAGUE — Standings and teams (coach)

   The "Tabla" tab of /admin. admin.js owns the password gate and the tab
   switch, and calls LVSL_TABLA.show() when this tab opens.

   The coach sees each division's table exactly as /calendario shows it, and
   can correct any team's numbers, add a team or take one off. Games marked
   final keep adding on top by themselves, so what gets saved is only the
   part the games don't explain: shown − games = the division's starting
   table (`standingsStart`, see api/league.js). The team list saved here is
   also the one the sign-up form and the games form offer.
   ========================================= */

'use strict';

(function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const $ = (id) => document.getElementById(id);

  const KEYS = ['p', 'w', 'd', 'l', 'gf', 'ga', 'adj'];
  const zero = () => ({ p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, adj: 0 });

  let games = [];
  let loaded = false;
  let activeDivision = (DIVISIONS[0] || {}).id || '';
  let editing = null;      // the team open in the sheet, or '' when adding one

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const division = () => DIVISIONS.find((d) => d.id === activeDivision) || {};

  let toastTimer;
  function toast(msg) {
    $('toast').textContent = msg;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600);
  }

  /* ---------- the numbers ---------- */

  /* What the finished games add for each team in the active division. */
  function fromGames() {
    const out = new Map();
    const row = (n) => { if (!out.has(n)) out.set(n, zero()); return out.get(n); };
    games.filter((g) => g.division === activeDivision && g.status === 'final').forEach((g) => {
      const h = row(g.home), a = row(g.away);
      h.p++; a.p++;
      h.gf += g.homeScore; h.ga += g.awayScore;
      a.gf += g.awayScore; a.ga += g.homeScore;
      if (g.homeScore > g.awayScore) { h.w++; a.l++; }
      else if (g.homeScore < g.awayScore) { a.w++; h.l++; }
      else { h.d++; a.d++; }
    });
    return out;
  }

  /* The table as the public sees it: starting numbers plus games. Sorted
     the same way as /calendario. */
  function table() {
    const start = division().standingsStart || {};
    const played = fromGames();
    return (division().teams || []).map((team) => {
      const r = Object.assign({ team }, zero());
      [start[team], played.get(team)].forEach((s) => {
        if (s) KEYS.forEach((k) => { r[k] += Number(s[k]) || 0; });
      });
      r.gd = r.gf - r.ga;
      r.pts = r.w * 3 + r.d + r.adj;
      return r;
    }).sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team));
  }

  /* ---------- load ---------- */
  async function load() {
    try {
      const res = await fetch('/api/games?full=1', { headers: { Accept: 'application/json' } });
      if (res.status === 401) { window.LVSL_ADMIN.showGate('Se cerró tu sesión. Entra otra vez.'); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      games = await res.json();
      loaded = true;
    } catch (e) {
      loaded = false;
      $('tTable').innerHTML = '';
      $('tEmpty').hidden = false;
      $('tEmpty').innerHTML = '<strong>No se pudo cargar la tabla.</strong>Revisa tu internet y recarga la página.';
      return;
    }
    render();
  }

  /* ---------- render ---------- */
  function render() {
    $('tDivTabs').innerHTML = DIVISIONS.map((d) =>
      '<button type="button" class="adm-tab' + (d.id === activeDivision ? ' active' : '') + '" data-div="' + esc(d.id) + '">' +
      esc(d.es) + ' <span class="adm-tab-n">' + (d.teams || []).length + '</span></button>'
    ).join('');

    const rows = table();
    $('tEmpty').hidden = rows.length > 0;
    if (!rows.length) {
      $('tTable').innerHTML = '';
      $('tEmpty').innerHTML = '<strong>Esta división no tiene equipos.</strong>Toca “Agregar equipo” para empezar.';
      return;
    }

    const cols = [['p', 'PJ'], ['w', 'G'], ['d', 'E'], ['l', 'P'], ['gf', 'GF'], ['ga', 'GC'], ['gd', 'DG'], ['pts', 'PTS']];
    const wide = (c) => (c === 'gf' || c === 'ga' ? ' st-wide' : '');
    $('tTable').innerHTML =
      '<div class="table-scroll st-wrap"><table class="st tb-table"><thead><tr><th class="st-pos">#</th><th>Equipo</th>' +
      cols.map(([c, l]) => '<th class="st-n' + (c === 'pts' ? ' st-pts' : '') + wide(c) + '">' + l + '</th>').join('') +
      '<th class="tb-edit-h"><span class="visually-hidden">Editar</span></th></tr></thead><tbody>' +
      rows.map((r, i) =>
        '<tr data-team="' + esc(r.team) + '" tabindex="0"><td class="st-pos">' + (i + 1) + '</td>' +
        '<td class="st-team">' + esc(r.team) + '</td>' +
        cols.map(([c]) => '<td class="st-n' + (c === 'pts' ? ' st-pts' : '') + wide(c) + '">' +
          (c === 'gd' && r.gd > 0 ? '+' : '') + r[c] + '</td>').join('') +
        '<td class="tb-edit">Editar</td></tr>'
      ).join('') +
      '</tbody></table></div>';
  }

  $('tDivTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-div]');
    if (b) { activeDivision = b.dataset.div; render(); }
  });

  const pickRow = (e) => {
    const tr = e.target.closest('tr[data-team]');
    if (tr) openTeam(tr.dataset.team);
  };
  $('tTable').addEventListener('click', pickRow);
  $('tTable').addEventListener('keydown', (e) => { if (e.key === 'Enter') pickRow(e); });

  /* ---------- the team sheet (edit one, or add one) ---------- */
  const num = (id) => {
    const v = $(id).value.trim();
    return v === '' ? 0 : Number(v);
  };

  // Points follow 3/1/0 unless the coach types his own (a sanction, a
  // forfeit). `adjust` is the difference he typed, kept while W/D change.
  let adjust = 0;

  function updateSums() {
    const w = num('t-w'), d = num('t-d'), l = num('t-l');
    $('t-pts').value = w * 3 + d + adjust;
    $('t-sums').textContent = 'Jugados: ' + (w + d + l) + ' · Diferencia de goles: ' +
      ((num('t-gf') - num('t-ga')) > 0 ? '+' : '') + (num('t-gf') - num('t-ga'));
  }

  function openTeam(team) {
    editing = team || '';
    const adding = !team;
    const r = adding ? Object.assign(zero(), { pts: 0 }) : table().find((x) => x.team === team);
    if (!r) return;

    $('tTitle').textContent = adding ? 'Agregar equipo' : team;
    $('tLede').textContent = adding
      ? 'Sale en ' + division().es + ': en la tabla, en el registro y para agregar partidos.'
      : 'Así sale ahora en la tabla de ' + division().es + '. Cambia lo que esté mal.';
    $('t-nameBox').hidden = !adding;
    $('t-name').value = '';
    $('t-w').value = r.w; $('t-d').value = r.d; $('t-l').value = r.l;
    $('t-gf').value = r.gf; $('t-ga').value = r.ga;
    adjust = r.adj;
    updateSums();
    $('t-error').hidden = true;
    $('t-delBox').hidden = adding;
    $('t-save').textContent = adding ? 'Agregar equipo' : 'Guardar';
    $('teamSheet').hidden = false;
    (adding ? $('t-name') : $('t-w')).focus();
  }

  const closeTeam = () => { $('teamSheet').hidden = true; editing = null; };
  document.querySelectorAll('[data-close-team]').forEach((el) => el.addEventListener('click', closeTeam));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('teamSheet').hidden) closeTeam(); });

  ['t-w', 't-d', 't-l', 't-gf', 't-ga'].forEach((id) => $(id).addEventListener('input', updateSums));
  $('t-pts').addEventListener('input', () => {
    adjust = num('t-pts') - num('t-w') * 3 - num('t-d');
    updateSums();
  });

  /* Saves the whole division: its team list and its starting table. */
  async function save(teams, start) {
    const res = await fetch('/api/league?division=' + encodeURIComponent(activeDivision), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ teams, standingsStart: start }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { window.LVSL_ADMIN.showGate('Se cerró tu sesión. Entra otra vez.'); throw new Error('signed_out'); }
    if (!res.ok) throw new Error(data.message || 'No se pudo guardar. Inténtalo otra vez.');
    // Every tab reads these same objects, so the games form and the roster
    // see the new list without a reload.
    division().teams = data.teams;
    division().standingsStart = data.standingsStart;
  }

  function fail(err) {
    if (err.message === 'signed_out') return;
    $('t-error').textContent = err.message;
    $('t-error').hidden = false;
  }

  $('tForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('t-error').hidden = true;

    const vals = { w: num('t-w'), d: num('t-d'), l: num('t-l'), gf: num('t-gf'), ga: num('t-ga'), pts: num('t-pts') };
    if (Object.values(vals).some((v) => !Number.isInteger(v)) || ['w', 'd', 'l', 'gf', 'ga'].some((k) => vals[k] < 0)) {
      fail(new Error('Los números tienen que ser enteros, de 0 para arriba.'));
      return;
    }

    const teams = (division().teams || []).slice();
    let team = editing;
    if (editing === '') {
      team = $('t-name').value.trim().replace(/\s+/g, ' ').toUpperCase();
      if (!team) { fail(new Error('Escribe el nombre del equipo.')); return; }
      if (teams.includes(team)) { fail(new Error(team + ' ya está en esta división.')); return; }
      teams.push(team);
    }

    // Keep only what the games don't already add.
    const g = fromGames().get(team) || zero();
    const base = {
      p: vals.w + vals.d + vals.l - g.p,
      w: vals.w - g.w, d: vals.d - g.d, l: vals.l - g.l,
      gf: vals.gf - g.gf, ga: vals.ga - g.ga,
      adj: vals.pts - vals.w * 3 - vals.d,
    };
    const start = Object.assign({}, division().standingsStart || {});
    start[team] = base;

    $('t-save').disabled = true;
    try {
      await save(teams, start);
      closeTeam();
      render();
      toast(editing === '' ? team + ' agregado' : 'Tabla guardada');
    } catch (err) { fail(err); }
    finally { $('t-save').disabled = false; }
  });

  $('t-del').addEventListener('click', async () => {
    const team = editing;
    if (!team) return;
    if (!confirm('¿Quitar ' + team + ' de ' + division().es + '?\n\n' +
      'Ya no sale en la tabla, en el registro ni para agregar partidos. ' +
      'Sus jugadores y los partidos que ya jugó se quedan guardados.')) return;

    const teams = (division().teams || []).filter((t) => t !== team);
    const start = Object.assign({}, division().standingsStart || {});
    delete start[team];

    try {
      await save(teams, start);
      closeTeam();
      render();
      toast(team + ' quitado');
    } catch (err) { fail(err); }
  });

  $('tAddBtn').addEventListener('click', () => { if (loaded) openTeam(''); });

  window.LVSL_TABLA = { show: load };
})();
