/* =========================================
   LAS VEGAS SOCCER LEAGUE — Referee page

   Behind the referee password (or the coach's). Lists today's and
   yesterday's games and lets the referee type each final score. The server
   decides what a referee may change; this page only mirrors it.
   ========================================= */

'use strict';

(function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const $ = (id) => document.getElementById(id);
  const KEY_NAME = 'lvsl-ref-name';

  let games = [];
  let activeDivision = 'all';

  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const today = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  const divisionLabel = (id) => { const d = DIVISIONS.find((x) => x.id === id); return d ? d.es : id; };

  function timeLabel(hhmm) {
    if (!hhmm) return 'Sin hora';
    const [h, m] = hhmm.split(':').map(Number);
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM');
  }

  try { $('refName').value = localStorage.getItem(KEY_NAME) || ''; } catch (e) { /* private mode */ }
  $('refName').addEventListener('change', () => {
    try { localStorage.setItem(KEY_NAME, $('refName').value.trim()); } catch (e) { /* ignore */ }
  });

  /* ---------- sign in ---------- */
  function showGate(msg) {
    $('gate').hidden = false;
    $('admHead').hidden = true;
    $('admMain').hidden = true;
    $('gateErr').hidden = !msg;
    $('gateErr').textContent = msg || '';
    $('gatePass').focus();
  }

  function showPage() {
    $('gate').hidden = true;
    $('admHead').hidden = false;
    $('admMain').hidden = false;
  }

  $('gateForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('gateBtn').disabled = true;
    try {
      const res = await fetch('/api/ref-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: $('gatePass').value }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { showGate(data.message || 'Contraseña incorrecta.'); return; }
      $('gatePass').value = '';
      showPage();
      await load();
    } catch (err) {
      showGate('No se pudo conectar. Inténtalo otra vez.');
    } finally {
      $('gateBtn').disabled = false;
    }
  });

  $('outBtn').addEventListener('click', async () => {
    try { await fetch('/api/ref-login', { method: 'DELETE' }); } catch (e) { /* sign out anyway */ }
    games = [];
    showGate('');
  });

  /* ---------- load ---------- */
  async function load() {
    try {
      const res = await fetch('/api/games?ref=1', { headers: { Accept: 'application/json' } });
      if (res.status === 401) { showGate(''); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      games = await res.json();
    } catch (e) {
      $('list').innerHTML = '';
      $('empty').hidden = false;
      $('empty').innerHTML = '<strong>No se pudieron cargar los partidos.</strong>Revisa tu internet y recarga la página.';
      return;
    }
    render();
  }

  async function start() {
    try {
      const res = await fetch('/api/ref-login', { headers: { Accept: 'application/json' } });
      const state = res.ok ? await res.json() : null;
      if (state && state.signedIn) { showPage(); await load(); return; }
    } catch (e) { /* fall through to the gate */ }
    showGate('');
  }

  /* ---------- render ---------- */
  function card(g) {
    const done = g.status === 'final';
    const locked = g.lockedByCoach;
    const val = (n) => (n == null ? '' : n);
    const dis = locked ? ' disabled' : '';
    const status = locked
      ? '<span class="rf-status">El coach ya puso este marcador.</span>'
      : done ? '<span class="rf-status is-ok">✓ Guardado: ' + g.homeScore + ' – ' + g.awayScore + '</span>'
             : '<span class="rf-status">Falta el marcador</span>';

    return '<form class="rf-card' + (locked ? ' is-locked' : done ? ' is-done' : '') + '" data-id="' + g.id + '" novalidate>' +
      '<div class="rf-top"><span class="rf-div">' + esc(divisionLabel(g.division)) + '</span>' +
        '<span>' + (g.date === today() ? 'Hoy' : 'Ayer') + ' · ' + esc(timeLabel(g.time)) + (g.field ? ' · ' + esc(g.field) : '') + '</span></div>' +
      '<div class="rf-grid">' +
        '<label class="rf-team" for="h' + g.id + '">' + esc(g.home) + '</label>' +
        '<input id="h' + g.id + '" name="home" type="number" min="0" max="99" inputmode="numeric" value="' + val(g.homeScore) + '"' + dis + ' />' +
        '<label class="rf-team" for="a' + g.id + '">' + esc(g.away) + '</label>' +
        '<input id="a' + g.id + '" name="away" type="number" min="0" max="99" inputmode="numeric" value="' + val(g.awayScore) + '"' + dis + ' />' +
      '</div>' +
      '<div class="rf-foot">' + status +
        (locked ? '' : '<button type="submit" class="gx-btn gx-btn--go">' + (done ? 'Corregir' : 'Guardar marcador') + '</button>') +
      '</div>' +
    '</form>';
  }

  function render() {
    const divs = DIVISIONS.filter((d) => games.some((g) => g.division === d.id));
    if (activeDivision !== 'all' && !divs.some((d) => d.id === activeDivision)) activeDivision = 'all';
    const tab = (id, label) => '<button type="button" class="adm-tab' + (id === activeDivision ? ' active' : '') +
      '" data-div="' + esc(id) + '">' + esc(label) + '</button>';
    $('divTabs').innerHTML = divs.length > 1 ? tab('all', 'Todas') + divs.map((d) => tab(d.id, d.es)).join('') : '';

    // Today first, then yesterday; within a day, by kickoff.
    const list = games
      .filter((g) => activeDivision === 'all' || g.division === activeDivision)
      .sort((a, b) => b.date.localeCompare(a.date) || a.time.localeCompare(b.time));

    $('list').innerHTML = list.map(card).join('');
    $('empty').hidden = list.length > 0;
    if (!list.length) $('empty').innerHTML = '<strong>No hay partidos hoy ni ayer.</strong>Si falta tu partido, avísale al coach.';
  }

  $('divTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-div]');
    if (b) { activeDivision = b.dataset.div; render(); }
  });

  $('list').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target.closest('.rf-card');
    if (!form) return;
    const id = Number(form.dataset.id);
    const g = games.find((x) => x.id === id);
    const home = form.elements.home.value;
    const away = form.elements.away.value;
    const status = form.querySelector('.rf-status');
    const btn = form.querySelector('button');

    if (home === '' || away === '') {
      status.className = 'rf-status is-err';
      status.textContent = 'Pon los goles de los dos equipos.';
      return;
    }

    // One last look before it goes public — a swapped score is the usual slip.
    if (!confirm(g.home + ' ' + home + ' – ' + away + ' ' + g.away + '\n\n¿Está bien el marcador?')) return;

    btn.disabled = true;
    status.className = 'rf-status';
    status.textContent = 'Guardando…';
    try {
      const res = await fetch('/api/game?id=' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ mode: 'score', homeScore: home, awayScore: away, name: $('refName').value.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) { showGate('Se cerró tu sesión. Entra otra vez.'); return; }
      if (!res.ok) throw new Error(data.message || 'No se pudo guardar. Inténtalo otra vez.');
      Object.assign(g, data);
      render();
    } catch (err) {
      status.className = 'rf-status is-err';
      status.textContent = err.message === 'Failed to fetch' ? 'Sin conexión. Inténtalo otra vez.' : err.message;
      btn.disabled = false;
    }
  });

  start();
})();
