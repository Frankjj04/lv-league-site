/* The coach adding a player himself, and attaching a photo afterwards.

   Loaded by admin.html alongside admin.js. It reuses the same league config
   the player form uses, so the divisions and teams can never disagree. */

'use strict';

window.LVSL_ADMIN_ADD = (function () {
  const CFG = window.LVSL_CONFIG || {};
  const DIVISIONS = CFG.divisions || [];
  const $ = (id) => document.getElementById(id);

  let photoDataUrl = null;
  let idDataUrl = null;
  let onSaved = null;              // handed in by admin.js so it can reload

  // The headshot and the ID are downscaled differently: the ID keeps more
  // pixels so the name and birth date on it stay readable.
  const limitsFor = (kind) => (kind === 'id' ? CFG.idPhoto : CFG.photo) || {};

  /* ---------- shared photo handling ---------- */
  function readPhoto(file, preview, clearBtn, done, PH) {
    PH = PH || {};
    if (!file || !/^image\//.test(file.type)) return done('Ese archivo no es una imagen.');
    if (PH.maxBytes && file.size > PH.maxBytes) return done('Esa foto pesa demasiado.');

    const reader = new FileReader();
    reader.onerror = () => done('No se pudo leer la foto.');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => done('No se pudo leer la foto.');
      img.onload = () => {
        const max = PH.maxPixels || 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        const url = c.toDataURL('image/jpeg', PH.quality || 0.86);
        if (preview) {
          preview.innerHTML = '';
          preview.style.backgroundImage = 'url("' + url + '")';
          preview.classList.add('has-photo');
        }
        if (clearBtn) clearBtn.hidden = false;
        done(null, url);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* One picker on the add form: the headshot, or the ID. */
  const PICKERS = [
    { kind: 'photo', input: 'a-photo', preview: 'a-photoPreview', clear: 'a-photoClear', empty: 'Sin foto',
      set: (url) => { photoDataUrl = url; } },
    { kind: 'id',    input: 'a-id',    preview: 'a-idPreview',    clear: 'a-idClear',    empty: 'Sin ID',
      set: (url) => { idDataUrl = url; } },
  ];

  function emptyPicker(pk) {
    pk.set(null);
    $(pk.input).value = '';
    const pv = $(pk.preview);
    pv.innerHTML = '<span class="photo-preview-empty">' + pk.empty + '</span>';
    pv.style.backgroundImage = '';
    pv.classList.remove('has-photo');
    $(pk.clear).hidden = true;
  }

  function wirePicker(pk) {
    $(pk.input).addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      readPhoto(f, $(pk.preview), $(pk.clear), (error, url) => {
        if (error) { $('a-error').textContent = error; $('a-error').hidden = false; return; }
        pk.set(url);
      }, limitsFor(pk.kind));
    });
    $(pk.clear).addEventListener('click', () => emptyPicker(pk));
  }

  /* ---------- division -> team ---------- */
  function fillDivisions() {
    const sel = $('a-division');
    sel.length = 1;
    DIVISIONS.forEach((d) => {
      const o = document.createElement('option');
      o.value = d.id;
      o.textContent = d.es;
      sel.appendChild(o);
    });
  }

  function fillTeams() {
    const div = DIVISIONS.find((d) => d.id === $('a-division').value);
    const sel = $('a-team');
    sel.length = 1;

    // A division with no team list yet: type the name instead of picking it.
    const typed = !!div && !(div.teams || []).length;
    sel.closest('.field').hidden = typed;
    $('a-teamOtherField').hidden = !typed;
    if (!typed) $('a-teamOther').value = '';

    if (!div) { sel.disabled = true; return; }
    (div.teams || []).forEach((name) => {
      const o = document.createElement('option');
      o.value = name;
      o.textContent = name;
      sel.appendChild(o);
    });
    sel.disabled = false;
  }

  /* ---------- minors ---------- */
  function ageOf(dob) {
    const d = new Date(dob + 'T00:00:00');
    if (isNaN(d)) return null;
    const now = new Date();
    let a = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
    return a;
  }

  function syncMinor() {
    const a = ageOf($('a-dob').value);
    const minor = a !== null && a >= 0 && a < (CFG.minorAge || 18);
    $('a-guardian').hidden = !minor;
    $('a-minorWarn').hidden = !minor;
  }

  /* ---------- open / close ---------- */
  function reset() {
    $('addForm').reset();
    PICKERS.forEach(emptyPicker);
    $('a-error').hidden = true;
    $('a-team').disabled = true;
    $('a-guardian').hidden = true;
    $('a-minorWarn').hidden = true;
    fillTeams();
  }

  function open() {
    reset();
    $('addSheet').hidden = false;
    document.body.style.overflow = 'hidden';
    $('a-division').focus();
  }

  function close() {
    $('addSheet').hidden = true;
    document.body.style.overflow = '';
  }

  /* ---------- save ---------- */
  async function save(e) {
    e.preventDefault();
    const err = $('a-error');
    err.hidden = true;

    if (!$('a-waiver').checked) {
      err.textContent = 'Confirma que el jugador aceptó el descargo.';
      err.hidden = false;
      return;
    }

    const body = {
      division: $('a-division').value,
      team:     $('a-teamOtherField').hidden
                  ? $('a-team').value
                  : $('a-teamOther').value.trim().replace(/\s+/g, ' ').toUpperCase(),
      name:     $('a-name').value,
      dob:      $('a-dob').value,
      phone:    $('a-phone').value,
      email:    $('a-email').value,
      address:  $('a-address').value,
      guardianName:  $('a-gname').value,
      guardianPhone: $('a-gphone').value,
      paymentMethod: $('a-method').value,
      note:     $('a-note').value,
      photo:    photoDataUrl || '',
      idPhoto:  idDataUrl || '',
      waiverAccepted: true,
    };

    const btn = $('a-submit');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Guardando…';

    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        err.textContent = data.message || 'No se pudo guardar.';
        err.hidden = false;
        return;
      }
      close();
      if (onSaved) onSaved();
    } catch (e2) {
      err.textContent = 'No se pudo conectar. Inténtalo otra vez.';
      err.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  /* ---------- attach a headshot or an ID to an existing player ---------- */
  async function uploadPhotoFor(id, file, statusEl, kind) {
    kind = kind === 'id' ? 'id' : 'photo';
    return new Promise((resolve) => {
      readPhoto(file, null, null, async (error, url) => {
        if (error) { if (statusEl) statusEl.textContent = error; return resolve(false); }
        if (statusEl) statusEl.textContent = 'Subiendo…';
        try {
          const res = await fetch('/api/player?id=' + encodeURIComponent(id), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ photo: url, kind }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            if (statusEl) statusEl.textContent = d.message || 'No se pudo subir.';
            return resolve(false);
          }
          if (statusEl) statusEl.textContent = 'Foto guardada.';
          resolve(true);
        } catch (e) {
          if (statusEl) statusEl.textContent = 'No se pudo conectar.';
          resolve(false);
        }
      }, limitsFor(kind));
    });
  }

  /* ---------- wire up ---------- */
  function init(reloadFn) {
    onSaved = reloadFn;
    fillDivisions();

    $('addBtn').addEventListener('click', open);
    $('addSheet').addEventListener('click', (e) => {
      if (e.target.closest('[data-close-add]')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('addSheet').hidden) close();
    });

    $('a-division').addEventListener('change', fillTeams);
    $('a-dob').addEventListener('change', syncMinor);
    $('a-dob').addEventListener('input', syncMinor);

    PICKERS.forEach(wirePicker);

    $('addForm').addEventListener('submit', save);
  }

  return { init, uploadPhotoFor };
})();
