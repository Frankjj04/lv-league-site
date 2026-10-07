/* =========================================
   LAS VEGAS SOCCER LEAGUE — Games page (coach)

   The "Partidos" tab of /admin. admin.js owns the password gate and the
   tab switch, and calls LVSL_GAMES.show() when this tab opens. Adds, edits
   and removes games and puts scores on them. Everything saved here is
   public on /calendario.
   ========================================= */

'use strict';

(function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const $ = (id) => document.getElementById(id);

  let games = [];
  let activeDivision = 'all';
  let when = 'next';
  let editing = null;      // the game open in the edit sheet, or null when adding
  let scoring = null;      // the game open in the score sheet

  /* ---------- small helpers ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const today = () => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  const divisionOf = (id) => DIVISIONS.find((d) => d.id === id);
  const divisionLabel = (id) => { const d = divisionOf(id); return d ? d.es : id; };

  function dayLabel(iso) {
    const s = new Date(iso + 'T12:00:00Z').toLocaleDateString('es-MX', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  function timeLabel(hhmm) {
    if (!hhmm) return 'Sin hora';
    const [h, m] = hhmm.split(':').map(Number);
    return ((h % 12) || 12) + ':' + String(m).padStart(2, '0') + (h >= 12 ? ' PM' : ' AM');
  }

  const stamp = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleString('es-MX', {
      timeZone: 'America/Los_Angeles', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
    });
  };

  let toastTimer;
  function toast(msg) {
    $('toast').textContent = msg;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 2600);
  }

  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { window.LVSL_ADMIN.showGate('Se cerró tu sesión. Entra otra vez.'); throw new Error('signed_out'); }
    if (!res.ok) throw new Error(data.message || 'No se pudo guardar. Inténtalo otra vez.');
    return data;
  }

  /* ---------- load ---------- */
  async function load() {
    try {
      const res = await fetch('/api/games?full=1', { headers: { Accept: 'application/json' } });
      if (res.status === 401) { window.LVSL_ADMIN.showGate('Se cerró tu sesión. Entra otra vez.'); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      games = await res.json();
    } catch (e) {
      games = [];
      $('list').innerHTML = '';
      $('gEmpty').hidden = false;
      $('gEmpty').innerHTML = '<strong>No se pudieron cargar los partidos.</strong>Revisa tu internet y recarga la página.';
      return;
    }
    render();
  }

  /* ---------- list ---------- */
  const isMissing = (g) => g.status === 'scheduled' && g.date < today();

  function filtered() {
    const now = today();
    return games
      .filter((g) => activeDivision === 'all' || g.division === activeDivision)
      .filter((g) => {
        if (when === 'missing') return isMissing(g);
        if (when === 'played') return g.status === 'final';
        return g.date >= now && g.status !== 'final';
      })
      .sort((a, b) => when === 'played'
        ? (b.date + b.time).localeCompare(a.date + a.time)
        : (a.date + a.time).localeCompare(b.date + b.time));
  }

  function renderStats() {
    const now = today();
    const inDiv = games.filter((g) => activeDivision === 'all' || g.division === activeDivision);
    const next = inDiv.filter((g) => g.date >= now && g.status !== 'final').length;
    const missing = inDiv.filter(isMissing).length;
    const played = inDiv.filter((g) => g.status === 'final').length;
    $('gStats').innerHTML =
      '<div class="adm-stat is-note"><span class="adm-stat-n">' + next + '</span><span class="adm-stat-l">Próximos</span></div>' +
      '<div class="adm-stat' + (missing ? ' is-warn' : ' is-good') + '"><span class="adm-stat-n">' + missing + '</span><span class="adm-stat-l">Sin marcador</span></div>' +
      '<div class="adm-stat is-good"><span class="adm-stat-n">' + played + '</span><span class="adm-stat-l">Jugados</span></div>';
  }

  function renderTabs() {
    const count = (id) => games.filter((g) => id === 'all' || g.division === id).length;
    const tab = (id, label) =>
      '<button type="button" class="adm-tab' + (id === activeDivision ? ' active' : '') + '" data-div="' + esc(id) + '">' +
      esc(label) + ' <span class="adm-tab-n">' + count(id) + '</span></button>';
    $('gDivTabs').innerHTML = tab('all', 'Todas') + DIVISIONS.map((d) => tab(d.id, d.es)).join('');
    document.querySelectorAll('#whenTabs .adm-tab').forEach((b) => b.classList.toggle('active', b.dataset.when === when));
  }

  function row(g) {
    const final = g.status === 'final';
    const teams = final
      ? esc(g.home) + '<b>' + g.homeScore + ' – ' + g.awayScore + '</b>' + esc(g.away)
      : esc(g.home) + '<b>vs</b>' + esc(g.away);
    const meta = [activeDivision === 'all' ? divisionLabel(g.division) : '', g.field, g.note]
      .filter(Boolean).map(esc).join(' · ');
    let by = '';
    if (final && g.scoreBy === 'ref') by = 'Marcador del árbitro' + (g.scoreName ? ' (' + esc(g.scoreName) + ')' : '') + ' · ' + esc(stamp(g.scoreAt));
    if (final && g.scoreBy === 'coach') by = 'Marcador tuyo · ' + esc(stamp(g.scoreAt));
    if (g.status === 'cancelled') by = '<span style="color:var(--maroon)">Cancelado</span>';

    return '<li class="gx">' +
      '<span class="gx-time">' + esc(timeLabel(g.time)) + '</span>' +
      '<div class="gx-main"><span class="gx-teams">' + teams + '</span>' +
        (meta ? '<span class="gx-meta">' + meta + '</span>' : '') +
        (by ? '<span class="gx-by">' + by + '</span>' : '') +
      '</div>' +
      '<div class="gx-actions">' +
        (g.status !== 'cancelled'
          ? '<button type="button" class="gx-btn' + (final ? '' : ' gx-btn--go') + '" data-score="' + g.id + '">' + (final ? 'Cambiar marcador' : 'Marcador') + '</button>'
          : '') +
        '<button type="button" class="gx-btn" data-edit="' + g.id + '">Editar</button>' +
      '</div>' +
    '</li>';
  }

  function render() {
    renderTabs();
    renderStats();
    const list = filtered();

    const days = new Map();
    list.forEach((g) => { if (!days.has(g.date)) days.set(g.date, []); days.get(g.date).push(g); });
    $('list').innerHTML = Array.from(days, ([date, gs]) =>
      '<section class="gx-day"><h3 class="gx-date">' + esc(dayLabel(date)) + (date === today() ? ' · HOY' : '') + '</h3>' +
      '<ul class="gx-list">' + gs.map(row).join('') + '</ul></section>'
    ).join('');

    $('gEmpty').hidden = list.length > 0;
    if (!list.length) {
      $('gEmpty').innerHTML = when === 'missing'
        ? '<strong>Todo al día.</strong>No falta ningún marcador.'
        : when === 'played'
          ? '<strong>Todavía no hay partidos jugados.</strong>'
          : '<strong>No hay partidos próximos.</strong>Toca “Agregar partido” para empezar.';
    }
  }

  $('gDivTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-div]');
    if (b) { activeDivision = b.dataset.div; render(); }
  });

  $('whenTabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-when]');
    if (b) { when = b.dataset.when; render(); }
  });

  $('list').addEventListener('click', (e) => {
    const s = e.target.closest('[data-score]');
    const ed = e.target.closest('[data-edit]');
    if (s) openScore(games.find((g) => g.id === Number(s.dataset.score)));
    if (ed) openGame(games.find((g) => g.id === Number(ed.dataset.edit)));
  });

  /* ---------- add / edit ---------- */
  $('g-division').innerHTML = '<option value="">Elige…</option>' +
    DIVISIONS.map((d) => '<option value="' + esc(d.id) + '">' + esc(d.es) + '</option>').join('');

  /* Fill both team lists for a division. A team that is on the game but no
     longer in the division's list (removed from sign-up) is kept as an option,
     so editing an old game never silently changes who played. */
  function fillTeams(divId, keep) {
    const d = divisionOf(divId);
    const names = new Set(d ? d.teams || [] : []);
    (keep || []).forEach((n) => n && names.add(n));
    const sorted = Array.from(names).sort((a, b) => a.localeCompare(b));
    const opts = '<option value="">Elige…</option>' + sorted.map((n) => '<option>' + esc(n) + '</option>').join('');
    ['g-home', 'g-away'].forEach((id) => {
      $(id).innerHTML = d ? opts : '<option value="">Elige la división primero</option>';
      $(id).disabled = !d;
    });
  }

  function fillFields() {
    const seen = Array.from(new Set(games.map((g) => g.field).filter(Boolean))).sort();
    $('g-fields').innerHTML = seen.map((f) => '<option value="' + esc(f) + '">').join('');
  }

  function syncScoreRow() {
    $('g-scoreRow').hidden = $('g-status').value !== 'final';
    $('g-hsLabel').textContent = $('g-home').value || 'Local';
    $('g-asLabel').textContent = $('g-away').value || 'Visitante';
  }

  function openGame(g, preset) {
    editing = g || null;
    const v = g || preset || {};
    $('gTitle').textContent = g ? 'Editar partido' : 'Agregar partido';
    $('gLede').textContent = g ? 'Los cambios salen en el calendario en cuanto los guardes.'
                               : 'Sale en el calendario en cuanto lo guardes.';
    $('g-division').value = v.division || (activeDivision !== 'all' ? activeDivision : '');
    fillTeams($('g-division').value, [v.home, v.away]);
    fillFields();
    $('g-home').value = v.home || '';
    $('g-away').value = v.away || '';
    $('g-date').value = v.date || '';
    $('g-time').value = v.time || '';
    $('g-field').value = v.field || '';
    $('g-status').value = v.status || 'scheduled';
    $('g-hs').value = v.homeScore == null ? '' : v.homeScore;
    $('g-as').value = v.awayScore == null ? '' : v.awayScore;
    $('g-note').value = v.note || '';
    $('g-error').hidden = true;
    $('g-delBox').hidden = !g;
    $('g-saveMore').hidden = Boolean(g);
    syncScoreRow();
    $('gameSheet').hidden = false;
    (g ? $('g-date') : ($('g-division').value ? $('g-home') : $('g-division'))).focus();
  }

  const closeGame = () => { $('gameSheet').hidden = true; editing = null; };

  $('gAddBtn').addEventListener('click', () => openGame(null));
  $('g-division').addEventListener('change', () => { fillTeams($('g-division').value); syncScoreRow(); });
  ['g-status', 'g-home', 'g-away'].forEach((id) => $(id).addEventListener('change', syncScoreRow));
  document.querySelectorAll('[data-close-game]').forEach((el) => el.addEventListener('click', closeGame));

  function formBody() {
    return {
      division: $('g-division').value,
      date: $('g-date').value,
      time: $('g-time').value,
      home: $('g-home').value,
      away: $('g-away').value,
      field: $('g-field').value,
      status: $('g-status').value,
      homeScore: $('g-hs').value,
      awayScore: $('g-as').value,
      note: $('g-note').value,
    };
  }

  async function saveGame(again) {
    $('g-error').hidden = true;
    $('g-save').disabled = $('g-saveMore').disabled = true;
    const body = formBody();
    try {
      const saved = editing
        ? await api('PATCH', '/api/game?id=' + editing.id, body)
        : await api('POST', '/api/game', body);
      games = games.filter((g) => g.id !== saved.id).concat(saved);
      render();
      toast(editing ? 'Partido actualizado' : 'Partido agregado');
      if (again) {
        // Keep the night's division, date and field: the coach usually
        // enters a whole evening of games in a row.
        openGame(null, { division: body.division, date: body.date, time: body.time, field: body.field });
      } else {
        closeGame();
      }
    } catch (err) {
      if (err.message !== 'signed_out') { $('g-error').textContent = err.message; $('g-error').hidden = false; }
    } finally {
      $('g-save').disabled = $('g-saveMore').disabled = false;
    }
  }

  $('gForm').addEventListener('submit', (e) => { e.preventDefault(); saveGame(false); });
  $('g-saveMore').addEventListener('click', () => saveGame(true));

  $('g-del').addEventListener('click', async () => {
    if (!editing) return;
    const g = editing;
    if (!confirm('¿Borrar ' + g.home + ' vs ' + g.away + ' del ' + dayLabel(g.date) + '?\n\nDesaparece del calendario. Esto no se puede deshacer.')) return;
    try {
      await api('DELETE', '/api/game?id=' + g.id);
      games = games.filter((x) => x.id !== g.id);
      closeGame();
      render();
      toast('Partido borrado');
    } catch (err) {
      if (err.message !== 'signed_out') { $('g-error').textContent = err.message; $('g-error').hidden = false; }
    }
  });

  /* ---------- quick score ---------- */
  function openScore(g) {
    scoring = g;
    $('sLede').textContent = divisionLabel(g.division) + ' · ' + dayLabel(g.date) + ' · ' + timeLabel(g.time);
    $('s-hsLabel').textContent = g.home;
    $('s-asLabel').textContent = g.away;
    $('s-hs').value = g.homeScore == null ? '' : g.homeScore;
    $('s-as').value = g.awayScore == null ? '' : g.awayScore;
    $('s-error').hidden = true;
    $('scoreSheet').hidden = false;
    $('s-hs').focus();
  }

  const closeScore = () => { $('scoreSheet').hidden = true; scoring = null; };
  document.querySelectorAll('[data-close-score]').forEach((el) => el.addEventListener('click', closeScore));

  $('sForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!scoring) return;
    $('s-error').hidden = true;
    $('s-save').disabled = true;
    try {
      const saved = await api('PATCH', '/api/game?id=' + scoring.id, {
        mode: 'score', homeScore: $('s-hs').value, awayScore: $('s-as').value,
      });
      games = games.filter((g) => g.id !== saved.id).concat(saved);
      closeScore();
      render();
      toast('Marcador guardado');
    } catch (err) {
      if (err.message !== 'signed_out') { $('s-error').textContent = err.message; $('s-error').hidden = false; }
    } finally {
      $('s-save').disabled = false;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!$('scoreSheet').hidden) closeScore();
    else if (!$('gameSheet').hidden) closeGame();
  });

  /* Called by admin.js each time the Partidos tab opens, so a score a referee
     typed since the last look is already there. */
  window.LVSL_GAMES = { show: load };
})();
