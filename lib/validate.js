/* One set of rules for both ways a player gets into the league:
   the player filling the form, and the coach adding them in person.

   Keeping this in one place matters — two copies of "what counts as a valid
   registration" would drift, and the coach's copy is the one nobody tests. */

export const MINOR_AGE = 18;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;   // after the browser downscales it

export const digits = (s) => String(s || '').replace(/\D/g, '');
export const clean  = (s, max) => String(s == null ? '' : s).trim().slice(0, max);

export function ageOn(dob) {
  const d = new Date(dob + 'T00:00:00Z');
  if (isNaN(d)) return null;
  const now = new Date();
  let a = now.getUTCFullYear() - d.getUTCFullYear();
  const m = now.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) a--;
  return a;
}

/* Decodes the data URL the browser produced, and checks it really is a JPEG or
   PNG by its magic bytes — the declared type is only a claim. */
export function decodePhoto(dataUrl) {
  const m = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl || '');
  if (!m) return { error: 'La foto no llegó correctamente.' };

  let buf;
  try { buf = Buffer.from(m[2], 'base64'); }
  catch { return { error: 'La foto no llegó correctamente.' }; }

  if (!buf.length) return { error: 'La foto no llegó correctamente.' };
  if (buf.length > MAX_PHOTO_BYTES) return { error: 'La foto pesa demasiado.' };

  const jpeg = buf[0] === 0xFF && buf[1] === 0xD8;
  const png  = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47;
  if (!jpeg && !png) return { error: 'Ese archivo no es una imagen.' };

  return { buf, type: jpeg ? 'image/jpeg' : 'image/png' };
}

/* Normalises and checks everything except the photo and the waiver, which the
   two callers treat differently: a player must tick the release themselves and
   must supply a headshot, while the coach may be standing at a field with a
   player who has neither.

   Returns { player } or { error }. */
export function validatePlayer(body, { requireGuardian = true } = {}) {
  const b = body || {};

  const p = {
    division: clean(b.division, 60),
    team:     clean(b.team, 80),
    name:     clean(b.name, 80),
    dob:      clean(b.dob, 10),
    phone:    digits(b.phone).slice(-10),
    email:    clean(b.email, 120).toLowerCase(),
    address:  clean(b.address, 200),
    guardianName:  clean(b.guardianName, 80),
    guardianPhone: digits(b.guardianPhone).slice(-10),
  };

  const fail = (error) => ({ error });

  if (!p.division) return fail('Elige la división.');
  if (!p.team)     return fail('Elige el equipo.');
  if (!p.name)     return fail('Escribe el nombre completo.');
  if (!p.address)  return fail('Escribe la dirección.');
  if (p.phone.length !== 10) return fail('El teléfono debe tener 10 dígitos.');
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(p.email)) return fail('Ese email no parece correcto.');

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.dob)) return fail('Pon la fecha de nacimiento.');
  const age = ageOn(p.dob);
  if (age === null || age < 4 || age > 100) return fail('Esa fecha no parece correcta.');

  p.isMinor = age < MINOR_AGE;

  if (p.isMinor) {
    if (requireGuardian) {
      if (!p.guardianName) return fail('Escribe el nombre del tutor.');
      if (p.guardianPhone.length !== 10) return fail('El teléfono del tutor debe tener 10 dígitos.');
    }
  } else {
    // An adult's form may still carry guardian values if the birth date was
    // typed, the fields appeared, and then the date was corrected. Drop them.
    p.guardianName = '';
    p.guardianPhone = '';
  }

  return { player: p };
}
