/* =========================================
   LAS VEGAS SOCCER LEAGUE — Roster page

   Reads /api/players. Until that endpoint exists it falls back to
   js/sample-roster.js and says so on screen.
   ========================================= */

'use strict';

(function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const $ = (id) => document.getElementById(id);

  let players = [];
  let usingSample = false;
  let activeDivision = 'all';

  /* ---------- small helpers ---------- */
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  function age(dob) {
    const d = new Date(dob + 'T00:00:00');
    if (isNaN(d)) return '';
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  }

  const isMinor = (p) => { const a = age(p.dob); return a !== '' && a < (CFG.minorAge || 18); };

  const phoneFmt = (s) => {
    const d = String(s || '').replace(/\D/g, '').slice(-10);
    return d.length === 10 ? d.slice(0, 3) + '-' + d.slice(3, 6) + '-' + d.slice(6) : (s || '');
  };

  const dateFmt = (iso) => {
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const divisionLabel = (id) => {
    const d = DIVISIONS.find((x) => x.id === id);
    return d ? d.es : id;
  };

  /* ---------- load ---------- */
  async function load() {
    try {
      const res = await fetch('/api/players', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      players = Array.isArray(data) ? data : (data.players || []);
    } catch (e) {
      players = (window.LVSL_SAMPLE_ROSTER || []).slice();
      usingSample = true;
      $('sampleBanner').hidden = false;
    }
    render();
  }

  /* ---------- filtering ---------- */
  function visible() {
    const q = $('search').value.trim().toLowerCase();
    const unpaid = $('unpaidOnly').checked;

    return players.filter((p) => {
      if (activeDivision !== 'all' && p.division !== activeDivision) return false;
      if (unpaid && p.paid) return false;
      if (!q) return true;
      const hay = [p.name, p.team, p.phone, p.email, phoneFmt(p.phone)].join(' ').toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  /* ---------- summary ---------- */
  function renderStats(list) {
    const teams = new Set(list.map((p) => p.team));
    const paid = list.filter((p) => p.paid).length;
    const minors = list.filter(isMinor).length;

    const tiles = [
      { n: list.length, l: 'Jugadores' },
      { n: teams.size,  l: 'Equipos' },
      { n: paid,        l: 'Pagados', tone: 'good' },
      { n: list.length - paid, l: 'Deben', tone: (list.length - paid) ? 'warn' : '' },
      { n: minors,      l: 'Menores de edad', tone: minors ? 'note' : '' },
    ];

    $('stats').innerHTML = tiles.map((t) =>
      '<div class="adm-stat' + (t.tone ? ' is-' + t.tone : '') + '">' +
        '<span class="adm-stat-n">' + t.n + '</span>' +
        '<span class="adm-stat-l">' + esc(t.l) + '</span>' +
      '</div>').join('');
  }

  /* ---------- division tabs ---------- */
  function renderTabs() {
    const counts = { all: players.length };
    DIVISIONS.forEach((d) => { counts[d.id] = players.filter((p) => p.division === d.id).length; });

    const tabs = [{ id: 'all', label: 'Todas' }]
      .concat(DIVISIONS.map((d) => ({ id: d.id, label: d.es })));

    $('divTabs').innerHTML = tabs.map((t) =>
      '<button type="button" role="tab" class="adm-tab' + (t.id === activeDivision ? ' active' : '') +
      '" data-div="' + esc(t.id) + '" aria-selected="' + (t.id === activeDivision) + '">' +
        esc(t.label) + '<span class="adm-tab-n">' + (counts[t.id] || 0) + '</span>' +
      '</button>').join('');

    $('divTabs').querySelectorAll('.adm-tab').forEach((b) => {
      b.addEventListener('click', () => { activeDivision = b.dataset.div; render(); });
    });
  }

  /* ---------- roster, grouped by team ---------- */
  function renderRoster(list) {
    const groups = new Map();
    list.forEach((p) => {
      const key = p.division + '||' + p.team;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    });

    const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'));

    $('empty').hidden = list.length > 0;

    $('roster').innerHTML = sorted.map(([key, members]) => {
      const team = key.split('||')[1];
      const div  = key.split('||')[0];
      const owe  = members.filter((p) => !p.paid).length;

      members.sort((a, b) => a.name.localeCompare(b.name, 'es'));

      return '<section class="team">' +
        '<header class="team-head">' +
          '<h2 class="team-name">' + esc(team) + '</h2>' +
          '<span class="team-div">' + esc(divisionLabel(div)) + '</span>' +
          '<span class="team-count">' + members.length + ' jugador' + (members.length === 1 ? '' : 'es') + '</span>' +
          (owe ? '<span class="team-owe">' + owe + ' sin pagar</span>' : '') +
        '</header>' +
        '<ul class="team-list">' + members.map(playerRow).join('') + '</ul>' +
      '</section>';
    }).join('');

    $('roster').querySelectorAll('.pl').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.pl-paid')) return;
        openSheet(Number(el.dataset.id));
      });
    });

    $('roster').querySelectorAll('.pl-paid input').forEach((box) => {
      box.addEventListener('change', () => {
        const p = players.find((x) => x.id === Number(box.dataset.id));
        if (p) { p.paid = box.checked; render(); }
      });
    });
  }

  function playerRow(p) {
    return '<li class="pl' + (p.paid ? '' : ' pl--owes') + '" data-id="' + p.id + '" tabindex="0">' +
      '<img class="pl-photo" src="' + esc(p.photo) + '" alt="" />' +
      '<span class="pl-main">' +
        '<span class="pl-name">' + esc(p.name) +
          (isMinor(p) ? '<span class="pl-minor" title="Menor de edad">MENOR</span>' : '') +
        '</span>' +
        '<span class="pl-meta">' + age(p.dob) + ' años · ' + esc(phoneFmt(p.phone)) + '</span>' +
      '</span>' +
      '<label class="pl-paid" title="Marcar como pagado">' +
        '<input type="checkbox" data-id="' + p.id + '"' + (p.paid ? ' checked' : '') + ' />' +
        '<span>' + (p.paid ? 'Pagado' : 'Debe') + '</span>' +
      '</label>' +
    '</li>';
  }

  /* ---------- player detail ---------- */
  function openSheet(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;

    const row = (label, value) => value
      ? '<div class="sh-row"><dt>' + esc(label) + '</dt><dd>' + value + '</dd></div>' : '';

    $('sheetBody').innerHTML =
      '<div class="sh-top">' +
        '<img src="' + esc(p.photo) + '" alt="" class="sh-photo" />' +
        '<div>' +
          '<h2 id="sheetName">' + esc(p.name) + '</h2>' +
          '<p class="sh-team">' + esc(p.team) + ' · ' + esc(divisionLabel(p.division)) + '</p>' +
          '<span class="sh-pill' + (p.paid ? ' is-paid' : '') + '">' + (p.paid ? 'Pagado' : 'Debe') + '</span>' +
        '</div>' +
      '</div>' +
      '<dl class="sh-rows">' +
        row('Nacimiento', esc(p.dob) + ' (' + age(p.dob) + ' años)') +
        row('Teléfono', '<a href="tel:' + esc(p.phone) + '">' + esc(phoneFmt(p.phone)) + '</a>') +
        row('Email', '<a href="mailto:' + esc(p.email) + '">' + esc(p.email) + '</a>') +
        row('Dirección', esc(p.address)) +
        row('Tutor', p.guardianName
          ? esc(p.guardianName) + ' · <a href="tel:' + esc(p.guardianPhone) + '">' +
            esc(phoneFmt(p.guardianPhone)) + '</a>' : '') +
        row('Registrado', esc(dateFmt(p.createdAt))) +
        row('Aceptó el descargo', esc(dateFmt(p.waiverAcceptedAt))) +
      '</dl>';

    $('sheet').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeSheet() {
    $('sheet').hidden = true;
    document.body.style.overflow = '';
  }

  $('sheet').addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeSheet(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });

  /* ---------- CSV ---------- */
  function toCsv(list) {
    const head = ['Division', 'Equipo', 'Nombre', 'Nacimiento', 'Edad', 'Menor',
                  'Telefono', 'Email', 'Direccion', 'Tutor', 'Telefono tutor',
                  'Pagado', 'Registrado', 'Acepto descargo'];

    // Excel and Sheets both read a quoted field; a quote inside one is doubled.
    const cell = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

    const rows = list.map((p) => [
      divisionLabel(p.division), p.team, p.name, p.dob, age(p.dob), isMinor(p) ? 'SI' : '',
      phoneFmt(p.phone), p.email, p.address, p.guardianName, phoneFmt(p.guardianPhone),
      p.paid ? 'SI' : 'NO', p.createdAt, p.waiverAcceptedAt,
    ].map(cell).join(','));

    // BOM so Excel opens the accents correctly.
    return '﻿' + [head.map(cell).join(',')].concat(rows).join('\r\n');
  }

  $('csvBtn').addEventListener('click', () => {
    const list = visible();
    const blob = new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = 'lvsl-jugadores-' + stamp + '.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ---------- printable credentials ---------- */
  $('printBtn').addEventListener('click', () => {
    const list = visible();
    if (!list.length) return;

    $('credSheet').innerHTML = list.map((p) =>
      '<div class="cred">' +
        '<div class="cred-top">' +
          '<img src="assets/logo.jpg" alt="" class="cred-crest" />' +
          '<span class="cred-league">LAS VEGAS<br>SOCCER LEAGUE</span>' +
        '</div>' +
        '<img src="' + esc(p.photo) + '" alt="" class="cred-photo" />' +
        '<div class="cred-name">' + esc(p.name) + '</div>' +
        '<div class="cred-team">' + esc(p.team) + '</div>' +
        '<div class="cred-foot">' +
          '<span>' + esc(divisionLabel(p.division)) + '</span>' +
          '<span>' + esc(p.dob) + '</span>' +
        '</div>' +
      '</div>').join('');

    window.print();
  });

  /* ---------- wire up ---------- */
  function render() {
    const list = visible();
    renderStats(list);
    renderTabs();
    renderRoster(list);
  }

  $('search').addEventListener('input', render);
  $('unpaidOnly').addEventListener('change', render);

  load();
})();
