/* =========================================
   LAS VEGAS SOCCER LEAGUE — Player Registration

   Divisions, teams, photo limits and the minor age all come from
   js/league-config.js. Nothing about the league is hard-coded here.
   ========================================= */

'use strict';

(function () {
  const form = document.getElementById('regForm');
  if (!form) return;

  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const OTHER = '__other__';

  /* ---------- helpers ---------- */
  const $ = (id) => document.getElementById(id);
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const t = (key, fallback) => {
    const dict = (window.LVSL_TRANSLATIONS || {})[lang()] || {};
    return dict[key] || fallback;
  };

  /* ---------- registration closed ---------- */
  if (CFG.registrationOpen === false) {
    $('regFormSection').hidden = true;
    $('regClosed').hidden = false;
    return;
  }

  /* ===================== DIVISION → TEAM ===================== */
  const divisionSel = $('division');
  const teamSel     = $('team');
  const otherField  = $('otherTeamField');
  const otherInput  = $('teamOther');
  const teamField   = teamSel.closest('.field');

  function fillDivisions() {
    const keep = divisionSel.value;
    divisionSel.length = 1;                       // keep the placeholder option
    DIVISIONS.forEach((d) => {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = d[lang()] || d.es;
      divisionSel.appendChild(o);
    });
    if (keep) divisionSel.value = keep;
  }

  function fillTeams() {
    const div = DIVISIONS.find((d) => d.id === divisionSel.value);
    const keep = teamSel.value;
    teamSel.length = 1;

    if (!div) {
      teamSel.disabled = true;
      teamField.hidden = false;
      showOther(false);
      return;
    }

    const teams = div.teams || [];
    teams.forEach((name) => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      teamSel.appendChild(o);
    });

    if (CFG.allowOtherTeam || !teams.length) {
      const o = document.createElement('option');
      o.value = OTHER;
      o.textContent = t('rg_team_other_opt', 'Mi equipo no está en la lista');
      teamSel.appendChild(o);
    }

    teamSel.disabled = false;
    // Only restore the old pick if this division actually has it.
    teamSel.value = Array.from(teamSel.options).some((o) => o.value === keep) ? keep : '';

    // A division with no team list yet: skip the empty dropdown and ask for
    // the team's name straight away.
    teamField.hidden = !teams.length;
    if (!teams.length) teamSel.value = OTHER;

    showOther(teamSel.value === OTHER);
  }

  function showOther(on) {
    otherField.hidden = !on;
    otherInput.required = on;
    if (!on) otherInput.value = '';
  }

  divisionSel.addEventListener('change', () => { fillTeams(); clearErr(divisionSel); });
  teamSel.addEventListener('change', () => { showOther(teamSel.value === OTHER); clearErr(teamSel); });

  fillDivisions();
  fillTeams();
  // Rebuild both when the visitor switches language, so the labels follow.
  document.querySelectorAll('.lang-btn').forEach((b) =>
    b.addEventListener('click', () => setTimeout(() => { fillDivisions(); fillTeams(); }, 0)));

  /* ===================== AGE → GUARDIAN ===================== */
  const dob = $('dob');
  const guardianStep = $('guardianStep');
  const guardianName = $('guardianName');
  const guardianPhone = $('guardianPhone');
  const MINOR_AGE = CFG.minorAge || 18;

  function ageOn(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  }

  function syncGuardian() {
    const a = ageOn(dob.value);
    const minor = a !== null && a < MINOR_AGE && a >= 0;
    guardianStep.hidden = !minor;
    guardianName.required = minor;
    guardianPhone.required = minor;
    if (!minor) { guardianName.value = ''; guardianPhone.value = ''; }
  }

  dob.addEventListener('change', () => { syncGuardian(); clearErr(dob); });
  dob.addEventListener('input', syncGuardian);
  // Nobody playing here was born before 1930 or is younger than 4.
  dob.min = '1930-01-01';
  dob.max = new Date(Date.now() - 4 * 365.25 * 864e5).toISOString().slice(0, 10);

  /* ===================== PHOTOS ===================== */
  /* Two pickers share this: the credential headshot and the ID or passport.
     Both are downscaled in the browser before upload; the ID less so, because
     its name and birth date have to stay readable. */
  function photoPicker(o) {
    const input    = $(o.input);
    const preview  = $(o.preview);
    const clearBtn = $(o.clear);
    const status   = $(o.status);
    const LIM = o.limits || {};
    let url = null;

    // Tagged with its key so the language switch translates it like everything else.
    const empty = () => '<span class="photo-preview-empty" data-i18n="' + o.emptyKey + '">' +
      t(o.emptyKey, o.emptyText) + '</span>';
    const idle  = () => t(o.helpKey, o.helpText);
    const ready = () => t(o.readyKey, o.readyText);

    function reset() {
      url = null;
      input.value = '';
      preview.innerHTML = empty();
      preview.style.backgroundImage = '';
      preview.classList.remove('has-photo');
      clearBtn.hidden = true;
      status.textContent = idle();
    }

    clearBtn.addEventListener('click', reset);

    // applyLang() rewrites the status line from its data-i18n key on every
    // language switch, which would wipe "Foto lista." — put it back.
    document.querySelectorAll('.lang-btn').forEach((b) =>
      b.addEventListener('click', () => setTimeout(() => {
        status.textContent = url ? ready() : idle();
        if (!url) preview.innerHTML = empty();
      }, 0)));

    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return reset();

      if (!/^image\//.test(file.type)) {
        setErr(input, t('rg_e_photo_type', 'Ese archivo no es una imagen.'));
        return reset();
      }
      if (LIM.maxBytes && file.size > LIM.maxBytes) {
        setErr(input, t('rg_e_photo_big', 'Esa foto pesa demasiado. Toma una nueva con la cámara.'));
        return reset();
      }

      clearErr(input);
      status.textContent = t('rg_photo_working', 'Preparando la foto…');

      const reader = new FileReader();
      reader.onerror = () => { setErr(input, t('rg_e_photo_read', 'No pudimos leer esa foto.')); reset(); };
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => { setErr(input, t('rg_e_photo_read', 'No pudimos leer esa foto.')); reset(); };
        img.onload = () => {
          const max = LIM.maxPixels || 900;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          url = canvas.toDataURL('image/jpeg', LIM.quality || 0.86);
          preview.innerHTML = '';
          preview.style.backgroundImage = 'url("' + url + '")';
          preview.classList.add('has-photo');
          clearBtn.hidden = false;
          status.textContent = ready();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });

    reset();
    return { input, preview, get: () => url };
  }

  const headshot = photoPicker({
    input: 'photo', preview: 'photoPreview', clear: 'photoClear', status: 'photoStatus',
    limits: CFG.photo,
    emptyKey: 'rg_photo_empty', emptyText: 'Sin foto',
    helpKey:  'rg_photo_help',  helpText:  'JPG o PNG. La ajustamos automáticamente, no importa el tamaño.',
    readyKey: 'rg_photo_ready', readyText: 'Foto lista.',
  });

  const idDoc = photoPicker({
    input: 'idPhoto', preview: 'idPreview', clear: 'idClear', status: 'idStatus',
    limits: CFG.idPhoto,
    emptyKey: 'rg_id_empty', emptyText: 'Sin ID',
    helpKey:  'rg_id_help',  helpText:  'Pon el ID sobre una mesa, con buena luz y sin reflejos.',
    readyKey: 'rg_id_ready', readyText: 'ID lista.',
  });

  const pickers = [headshot, idDoc];

  /* ===================== VALIDATION ===================== */
  function setErr(el, msg) {
    const p = $('err-' + el.id);
    if (p) { p.textContent = msg; p.hidden = false; }
    el.classList.add('is-invalid');
    el.setAttribute('aria-invalid', 'true');
  }

  function clearErr(el) {
    const p = $('err-' + el.id);
    if (p) { p.hidden = true; p.textContent = ''; }
    el.classList.remove('is-invalid');
    el.removeAttribute('aria-invalid');
  }

  // A phone number with 10 digits, however the person chose to punctuate it.
  const digits = (s) => (s || '').replace(/\D/g, '');
  const okPhone = (s) => { const d = digits(s); return d.length === 10 || (d.length === 11 && d[0] === '1'); };
  const okEmail = (s) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test((s || '').trim());

  function validate() {
    const errs = [];
    const need = (el, key, fallback) => {
      if (!el.value.trim()) { setErr(el, t(key, fallback)); errs.push(el); return false; }
      clearErr(el);
      return true;
    };

    need(divisionSel, 'rg_e_division', 'Elige tu división.');
    if (!teamSel.disabled) need(teamSel, 'rg_e_team', 'Busca el equipo con el que juegas.');
    if (!otherField.hidden) need(otherInput, 'rg_e_team_other', 'Escribe el nombre de tu equipo.');

    need($('name'), 'rg_e_name', 'Escribe tu nombre completo.');

    if (need(dob, 'rg_e_dob', 'Pon tu fecha de nacimiento')) {
      const a = ageOn(dob.value);
      if (a === null || a < 0 || a > 100) {
        setErr(dob, t('rg_e_dob_bad', 'Esa fecha no parece correcta.'));
        errs.push(dob);
      }
    }

    const phone = $('phone');
    if (need(phone, 'rg_e_phone', 'Escribe tu teléfono.') && !okPhone(phone.value)) {
      setErr(phone, t('rg_e_phone_bad', 'Escribe un teléfono de 10 dígitos.'));
      errs.push(phone);
    }

    const email = $('email');
    if (need(email, 'rg_e_email', 'Escribe tu email.') && !okEmail(email.value)) {
      setErr(email, t('rg_e_email_bad', 'Ese email no parece correcto.'));
      errs.push(email);
    }

    need($('address'), 'rg_e_address', 'Escribe tu dirección.');

    if (!guardianStep.hidden) {
      need(guardianName, 'rg_e_g_name', 'Escribe el nombre de tu tutor.');
      if (need(guardianPhone, 'rg_e_g_phone', 'Escribe el teléfono de tu tutor.') && !okPhone(guardianPhone.value)) {
        setErr(guardianPhone, t('rg_e_phone_bad', 'Escribe un teléfono de 10 dígitos.'));
        errs.push(guardianPhone);
      }
    }

    [[headshot, 'rg_e_photo', 'Sube una foto para tu credencial.'],
     [idDoc,    'rg_e_id',    'Sube una foto de tu ID o pasaporte. Sin ella no se puede completar el registro.'],
    ].forEach(([pic, key, fallback]) => {
      if (!pic.get()) { setErr(pic.input, t(key, fallback)); errs.push(pic.input); }
      else clearErr(pic.input);
    });

    const waiver = $('waiver');
    if (!waiver.checked) {
      setErr(waiver, t('rg_e_waiver', 'Tienes que aceptar el descargo de responsabilidad.'));
      errs.push(waiver);
    } else {
      clearErr(waiver);
    }

    return errs;
  }

  form.querySelectorAll('input, select').forEach((el) => {
    el.addEventListener('input', () => { if (el.classList.contains('is-invalid')) clearErr(el); });
    el.addEventListener('change', () => { if (el.classList.contains('is-invalid')) clearErr(el); });
  });

  /* ===================== SUBMIT ===================== */
  const submitBtn = $('submitBtn');
  const formError = $('formError');

  function showFormError(msg, scrollTo) {
    formError.textContent = msg;
    formError.hidden = false;
    (scrollTo || formError).scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* Why the server refused, keyed by the code it sends: the field to point at
     and the line to show. The checks above catch nearly everything before the
     form is sent; these are the cases only the server can know (a duplicate,
     a photo that arrived broken) or that slipped past the browser. */
  const REFUSALS = {
    duplicate:      ['email',         'rg_e_duplicate'],
    division:       ['division',      'rg_e_division'],
    team:           ['team',          'rg_e_team'],
    name:           ['name',          'rg_e_name'],
    address:        ['address',       'rg_e_address'],
    phone:          ['phone',         'rg_e_phone_bad'],
    email:          ['email',         'rg_e_email_bad'],
    dob:            ['dob',           'rg_e_dob'],
    dob_bad:        ['dob',           'rg_e_dob_bad'],
    guardian_name:  ['guardianName',  'rg_e_g_name'],
    guardian_phone: ['guardianPhone', 'rg_e_phone_bad'],
    waiver:         ['waiver',        'rg_e_waiver'],
    photo_missing:  ['photo',         'rg_e_photo'],
    photo_bad:      ['photo',         'rg_e_photo_read'],
    photo_big:      ['photo',         'rg_e_photo_big'],
    photo_type:     ['photo',         'rg_e_photo_type'],
    id_missing:     ['idPhoto',       'rg_e_id'],
    id_bad:         ['idPhoto',       'rg_e_id_read'],
    id_big:         ['idPhoto',       'rg_e_id_big'],
    id_type:        ['idPhoto',       'rg_e_id_type'],
    too_large:      [null,            'rg_e_too_large'],
    server_error:   [null,            'rg_e_server'],
    not_configured: [null,            'rg_e_unavailable'],
  };

  function explainRefusal(status, data) {
    // Vercel itself answers 413, with no JSON, when the whole request is too big.
    const code = status === 413 ? 'too_large' : (data.code || data.error);
    const r = REFUSALS[code];
    const msg = r
      ? t(r[1], data.message)
      : data.message || t('rg_e_server', 'No pudimos guardar tu registro. Llámanos al 702-831-9474.');

    // Mark the field too. A typed team name lives in its own box.
    let el = r && r[0] ? $(r[0]) : null;
    if (el === teamSel && !otherField.hidden) el = otherInput;
    if (el) setErr(el, msg);

    const pic = el && pickers.find((x) => x.input === el);
    showFormError(msg, pic ? pic.preview : el);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const errs = validate();
    if (errs.length) {
      const first = errs[0];
      // The photo inputs are visually hidden; scroll to their preview instead.
      const pic = pickers.find((x) => x.input === first);
      (pic ? pic.preview : first).scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!pic) first.focus({ preventScroll: true });
      return;
    }

    const div = DIVISIONS.find((d) => d.id === divisionSel.value);
    const payload = {
      division:      divisionSel.value,
      divisionLabel: div ? div.es : divisionSel.value,
      // Typed names are uppercased like the listed ones, so "los tigres" and
      // "LOS TIGRES" land on the same team in the coach's roster.
      team:          teamSel.value === OTHER
                       ? otherInput.value.trim().replace(/\s+/g, ' ').toUpperCase()
                       : teamSel.value,
      teamIsNew:     teamSel.value === OTHER,
      name:          $('name').value.trim(),
      dob:           dob.value,
      phone:         digits($('phone').value).slice(-10),
      email:         $('email').value.trim().toLowerCase(),
      address:       $('address').value.trim(),
      guardianName:  guardianStep.hidden ? '' : guardianName.value.trim(),
      guardianPhone: guardianStep.hidden ? '' : digits(guardianPhone.value).slice(-10),
      waiverAccepted: true,
      waiverAcceptedAt: new Date().toISOString(),
      photo:         headshot.get(),
      idPhoto:       idDoc.get(),
      website:       $('website').value,   // honeypot
      lang:          lang(),
    };

    submitBtn.disabled = true;
    submitBtn.classList.add('is-loading');
    const btnText = submitBtn.querySelector('[data-i18n]');
    const original = btnText.textContent;
    btnText.textContent = t('rg_sending', 'Enviando…');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      // The server answered, so this is not a connection problem — say why.
      if (!res.ok) {
        explainRefusal(res.status, data);
        return;
      }

      form.hidden = true;
      const ok = $('regSuccess');
      const detail = $('regSuccessDetail');
      detail.textContent = payload.name + ' — ' + payload.team;
      ok.hidden = false;
      ok.focus();
      ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      // Only reached when the request got no answer at all: a real connection problem.
      showFormError(t('rg_e_submit',
        'No pudimos enviar tu registro. Revisa tu internet e inténtalo otra vez, o llámanos al 702-831-9474.'));
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      btnText.textContent = original;
    }
  });
})();
