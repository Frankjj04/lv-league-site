/* =========================================
   LAS VEGAS SOCCER LEAGUE — Player Registration

   Divisions, teams, fees and the minor age all come from
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
      showOther(false);
      return;
    }

    (div.teams || []).forEach((name) => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      teamSel.appendChild(o);
    });

    if (CFG.allowOtherTeam) {
      const o = document.createElement('option');
      o.value = OTHER;
      o.textContent = t('rg_team_other_opt', 'Mi equipo no está en la lista');
      teamSel.appendChild(o);
    }

    teamSel.disabled = false;
    // Only restore the old pick if this division actually has it.
    teamSel.value = Array.from(teamSel.options).some((o) => o.value === keep) ? keep : '';
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

  /* ===================== PHOTO ===================== */
  const photoInput = $('photo');
  const preview    = $('photoPreview');
  const clearBtn   = $('photoClear');
  const photoStatus = $('photoStatus');
  const PH = CFG.photo || {};
  let photoDataUrl = null;

  function resetPhoto() {
    photoDataUrl = null;
    photoInput.value = '';
    preview.innerHTML = '<span class="photo-preview-empty">' + t('rg_photo_empty', 'Sin foto') + '</span>';
    preview.style.backgroundImage = '';
    preview.classList.remove('has-photo');
    clearBtn.hidden = true;
    photoStatus.textContent = t('rg_photo_help', 'JPG o PNG. La ajustamos automáticamente, no importa el tamaño.');
  }

  clearBtn.addEventListener('click', resetPhoto);

  // applyLang() rewrites the status line from its data-i18n key on every
  // language switch, which would wipe "Foto lista." — put it back.
  document.querySelectorAll('.lang-btn').forEach((b) =>
    b.addEventListener('click', () => setTimeout(() => {
      photoStatus.textContent = photoDataUrl
        ? t('rg_photo_ready', 'Foto lista.')
        : t('rg_photo_help', 'JPG o PNG. La ajustamos automáticamente, no importa el tamaño.');
      if (!photoDataUrl) {
        preview.innerHTML = '<span class="photo-preview-empty">' + t('rg_photo_empty', 'Sin foto') + '</span>';
      }
    }, 0)));

  photoInput.addEventListener('change', () => {
    const file = photoInput.files && photoInput.files[0];
    if (!file) return resetPhoto();

    if (!/^image\//.test(file.type)) {
      setErr(photoInput, t('rg_e_photo_type', 'Ese archivo no es una imagen.'));
      return resetPhoto();
    }
    if (PH.maxBytes && file.size > PH.maxBytes) {
      setErr(photoInput, t('rg_e_photo_big', 'Esa foto pesa demasiado. Toma una nueva con la cámara.'));
      return resetPhoto();
    }

    clearErr(photoInput);
    photoStatus.textContent = t('rg_photo_working', 'Preparando la foto…');

    const reader = new FileReader();
    reader.onerror = () => { setErr(photoInput, t('rg_e_photo_read', 'No pudimos leer esa foto.')); resetPhoto(); };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => { setErr(photoInput, t('rg_e_photo_read', 'No pudimos leer esa foto.')); resetPhoto(); };
      img.onload = () => {
        const max = PH.maxPixels || 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        photoDataUrl = canvas.toDataURL('image/jpeg', PH.quality || 0.86);
        preview.innerHTML = '';
        preview.style.backgroundImage = 'url("' + photoDataUrl + '")';
        preview.classList.add('has-photo');
        clearBtn.hidden = false;
        photoStatus.textContent = t('rg_photo_ready', 'Foto lista.');
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  resetPhoto();

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
    if (!teamSel.disabled) need(teamSel, 'rg_e_team', 'Elige tu equipo.');
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

    if (!photoDataUrl) {
      setErr(photoInput, t('rg_e_photo', 'Sube una foto para tu credencial.'));
      errs.push(photoInput);
    } else {
      clearErr(photoInput);
    }

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.hidden = true;

    const errs = validate();
    if (errs.length) {
      const first = errs[0];
      // The photo input is visually hidden; scroll to its section instead.
      (first === photoInput ? preview : first).scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (first !== photoInput) first.focus({ preventScroll: true });
      return;
    }

    const div = DIVISIONS.find((d) => d.id === divisionSel.value);
    const payload = {
      division:      divisionSel.value,
      divisionLabel: div ? div.es : divisionSel.value,
      team:          teamSel.value === OTHER ? otherInput.value.trim() : teamSel.value,
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
      photo:         photoDataUrl,
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

      if (!res.ok) throw new Error(data.message || 'HTTP ' + res.status);

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;   // Stripe, once it is turned on
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
      formError.textContent = t('rg_e_submit',
        'No pudimos enviar tu registro. Revisa tu internet e inténtalo otra vez, o llámanos al 702-831-9474.');
      formError.hidden = false;
      formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      submitBtn.disabled = false;
      submitBtn.classList.remove('is-loading');
      btnText.textContent = original;
    }
  });
})();
