/* Tests for the parts of the API that do not need a database.

   Everything in api/register.js up to the INSERT is pure validation, and
   lib/auth.js is pure crypto, so both can be exercised for real. The INSERT
   itself needs Postgres and is not covered here.

   Run: node test/api.test.mjs
*/

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

// register.js only reaches the database after validation passes, so a fake
// connection string is enough to get past the "is it configured" check.
process.env.DATABASE_URL = 'postgres://test/test';
process.env.ADMIN_PASSWORD = 'correct-horse';
process.env.SESSION_SECRET = 'test-secret-not-a-real-one';
process.env.REF_PASSWORD = 'whistle-blue';

const { default: register } = await import('../api/register.js');
const auth = await import('../lib/auth.js');
const gamesLib = await import('../lib/games.js');
const { default: gameApi } = await import('../api/game.js');
const { default: gamesApi } = await import('../api/games.js');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); console.log('  ok   ' + name); passed++; }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); failed++; }
}

async function atest(name, fn) {
  try { await fn(); console.log('  ok   ' + name); passed++; }
  catch (e) { console.log('  FAIL ' + name + '\n       ' + e.message); failed++; }
}

/* ---------- fake req/res ---------- */
function mockRes() {
  const r = { statusCode: 0, body: null, headers: {} };
  r.status = (c) => { r.statusCode = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.send = (b) => { r.body = b; return r; };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  return r;
}

// A real 1x1 JPEG, so the magic-byte check sees genuine bytes.
const JPEG_1PX = 'data:image/jpeg;base64,' +
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
  'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
  'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';

const adult = () => ({
  division: 'viernes-open',
  team: 'HOOLIGANS',
  name: 'Jugador De Prueba',
  dob: '1995-04-10',
  phone: '702-555-0100',
  email: 'Prueba@Example.com',
  address: '123 Main St, Las Vegas, NV',
  waiverAccepted: true,
  photo: JPEG_1PX,
  idPhoto: JPEG_1PX,
  website: '',
});

async function post(body) {
  const res = mockRes();
  await register({ method: 'POST', body, headers: {} }, res);
  return res;
}

/* ================= register: validation ================= */
console.log('\napi/register.js — validation');

await atest('rejects a non-POST method', async () => {
  const res = mockRes();
  await register({ method: 'GET', body: {}, headers: {} }, res);
  assert.equal(res.statusCode, 405);
});

await atest('honeypot is answered 200 and never stored', async () => {
  const res = await post({ ...adult(), website: 'http://spam.example' });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});

for (const [field, value, why, code] of [
  ['division', '', 'no division', 'division'],
  ['team', '', 'no team', 'team'],
  ['name', '', 'no name', 'name'],
  ['address', '', 'no address', 'address'],
  ['phone', '702-555', 'a short phone', 'phone'],
  ['email', 'not-an-email', 'a malformed email', 'email'],
  ['dob', '', 'no birth date', 'dob'],
  ['dob', '1830-01-01', 'an impossible birth date', 'dob_bad'],
]) {
  await atest('rejects ' + why, async () => {
    const res = await post({ ...adult(), [field]: value });
    assert.equal(res.statusCode, 400, 'expected 400, got ' + res.statusCode);
    assert.equal(res.body.error, 'invalid');
    assert.equal(res.body.code, code);
    assert.ok(res.body.message, 'a message for the player');
  });
}

await atest('rejects an unaccepted waiver', async () => {
  const res = await post({ ...adult(), waiverAccepted: false });
  assert.equal(res.statusCode, 400);
});

await atest('rejects a missing photo', async () => {
  const res = await post({ ...adult(), photo: '' });
  assert.equal(res.statusCode, 400);
});

await atest('rejects a photo that is not really an image', async () => {
  const notAnImage = 'data:image/jpeg;base64,' + Buffer.from('hello there').toString('base64');
  const res = await post({ ...adult(), photo: notAnImage });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /no es una imagen/);
});

await atest('rejects an SVG dressed as a photo', async () => {
  const svg = 'data:image/svg+xml;base64,' + Buffer.from('<svg onload="x()"/>').toString('base64');
  const res = await post({ ...adult(), photo: svg });
  assert.equal(res.statusCode, 400);
});

console.log('\napi/register.js — ID or passport');

await atest('rejects a registration with no ID photo', async () => {
  const res = await post({ ...adult(), idPhoto: '' });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ID o pasaporte/);
});

await atest('rejects a registration whose ID field is missing entirely', async () => {
  const body = adult();
  delete body.idPhoto;
  const res = await post(body);
  assert.equal(res.statusCode, 400);
});

await atest('rejects an ID photo that is not really an image', async () => {
  const notAnImage = 'data:image/jpeg;base64,' + Buffer.from('hello there').toString('base64');
  const res = await post({ ...adult(), idPhoto: notAnImage });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /ID/);
});

console.log('\napi/register.js — minors');

await atest('a minor without a guardian is rejected', async () => {
  const res = await post({ ...adult(), dob: '2012-06-01' });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /tutor/);
});

await atest('a minor with a short guardian phone is rejected', async () => {
  const res = await post({ ...adult(), dob: '2012-06-01',
    guardianName: 'Rosa Prueba', guardianPhone: '702' });
  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /tutor/);
});

await atest('a valid minor passes validation and reaches the database', async () => {
  const res = await post({ ...adult(), dob: '2012-06-01',
    guardianName: 'Rosa Prueba', guardianPhone: '702-555-0199' });
  // No Postgres here, so the insert fails — but 500 proves validation passed.
  assert.equal(res.statusCode, 500, 'expected to get as far as the insert');
});

await atest('a valid adult passes validation and reaches the database', async () => {
  const res = await post(adult());
  assert.equal(res.statusCode, 500, 'expected to get as far as the insert');
});

console.log('\napi/register.js — every refusal says which problem it is');

const NOT_AN_IMAGE = 'data:image/jpeg;base64,' + Buffer.from('hello there').toString('base64');

for (const [why, change, code] of [
  ['an unaccepted waiver',               { waiverAccepted: false },       'waiver'],
  ['a missing headshot',                 { photo: '' },                   'photo_missing'],
  ['a headshot that is not an image',    { photo: NOT_AN_IMAGE },         'photo_type'],
  ['an SVG headshot',                    { photo: 'data:image/svg+xml;base64,PHN2Zy8+' }, 'photo_bad'],
  ['a missing ID',                       { idPhoto: '' },                 'id_missing'],
  ['an ID that is not an image',         { idPhoto: NOT_AN_IMAGE },       'id_type'],
  ['a minor with no guardian',           { dob: '2012-06-01' },           'guardian_name'],
  ['a minor with a short guardian phone',
    { dob: '2012-06-01', guardianName: 'Rosa Prueba', guardianPhone: '702' }, 'guardian_phone'],
]) {
  await atest(why + ' is refused as ' + code, async () => {
    const res = await post({ ...adult(), ...change });
    assert.equal(res.statusCode, 400);
    assert.equal(res.body.code, code);
  });
}

// Every code the server can send, including the ones only a database or
// Vercel itself produces (duplicate, server_error, not_configured, too_large).
const SERVER_CODES = [
  'division', 'team', 'name', 'address', 'phone', 'email', 'dob', 'dob_bad',
  'guardian_name', 'guardian_phone', 'waiver',
  'photo_missing', 'photo_bad', 'photo_big', 'photo_type',
  'id_missing', 'id_bad', 'id_big', 'id_type',
  'duplicate', 'server_error', 'not_configured', 'too_large',
];

test('the form has a line, in both languages, for every refusal and everything it shows', () => {
  const form = readFileSync(new URL('../js/registro.js', import.meta.url), 'utf8');
  const i18n = readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
  const start = form.indexOf('const REFUSALS');
  const table = form.slice(start, form.indexOf('};', start));

  for (const code of SERVER_CODES) {
    assert.match(table, new RegExp('\\b' + code + ':'), 'the form has no entry for ' + code);
  }
  // Every key the form script names anywhere — refusals, the minor variants,
  // photo labels — has to exist in both languages.
  for (const key of new Set([...form.matchAll(/'(rg_\w+)'/g)].map((m) => m[1]))) {
    const n = (i18n.match(new RegExp('\\b' + key + ':', 'g')) || []).length;
    assert.equal(n, 2, key + ' should be in both Spanish and English, found ' + n);
  }
});

/* ================= auth ================= */
console.log('\nlib/auth.js');

test('the right password is accepted', () => {
  assert.equal(auth.checkPassword('correct-horse'), true);
});

test('a wrong password is rejected', () => {
  assert.equal(auth.checkPassword('wrong'), false);
  assert.equal(auth.checkPassword(''), false);
  assert.equal(auth.checkPassword(null), false);
});

test('a password that is a prefix of the real one is rejected', () => {
  assert.equal(auth.checkPassword('correct'), false);
});

test('a fresh cookie validates', () => {
  const setCookie = auth.issueCookie();
  const value = setCookie.split(';')[0];
  assert.equal(auth.isSignedIn({ headers: { cookie: value } }), true);
});

test('the cookie is HttpOnly, Secure and SameSite=Strict', () => {
  const c = auth.issueCookie();
  assert.match(c, /HttpOnly/);
  assert.match(c, /Secure/);
  assert.match(c, /SameSite=Strict/);
});

test('the cookie does not outlive the browser session', () => {
  // No Max-Age and no Expires, so the browser drops it when it closes and the
  // coach types the password again. The signed expiry still caps it at an hour.
  const c = auth.issueCookie();
  assert.equal(/Max-Age/.test(c), false);
  assert.equal(/Expires/.test(c), false);
});

test('no cookie means not signed in', () => {
  assert.equal(auth.isSignedIn({ headers: {} }), false);
  assert.equal(auth.isSignedIn({ headers: { cookie: '' } }), false);
});

test('a tampered signature is rejected', () => {
  const value = auth.issueCookie().split(';')[0];
  const broken = value.slice(0, -1) + (value.endsWith('a') ? 'b' : 'a');
  assert.equal(auth.isSignedIn({ headers: { cookie: broken } }), false);
});

test('an expiry cannot be extended without the secret', () => {
  const value = auth.issueCookie().split(';')[0];
  const token = value.split('=')[1];
  const mac = token.slice(token.lastIndexOf('.') + 1);
  const forged = 'lvsl_admin=' + (Date.now() + 999e6) + '.' + mac;
  assert.equal(auth.isSignedIn({ headers: { cookie: forged } }), false);
});

test('an expired cookie is rejected', () => {
  // Sign a real MAC over a past expiry the same way issueCookie does.
  const past = Date.now() - 1000;
  const mac = createHmac('sha256', process.env.SESSION_SECRET).update(String(past)).digest('hex');
  assert.equal(auth.isSignedIn({ headers: { cookie: 'lvsl_admin=' + past + '.' + mac } }), false);
});

test('signing out clears the cookie', () => {
  assert.match(auth.clearCookie(), /Max-Age=0/);
});

/* ================= referees ================= */
console.log('\nlib/auth.js — referees');

const refCookie = () => auth.issueRefCookie().split(';')[0];
const adminCookie = () => auth.issueCookie().split(';')[0];

test('the referee password signs a referee in', () => {
  assert.equal(auth.checkRefPassword('whistle-blue'), true);
  assert.equal(auth.checkRefPassword('wrong'), false);
  assert.equal(auth.checkRefPassword(''), false);
});

test('the coach password also works on the referee page', () => {
  assert.equal(auth.checkRefPassword('correct-horse'), true);
});

test('the referee password does NOT open the roster', () => {
  assert.equal(auth.checkPassword('whistle-blue'), false);
});

test('a referee cookie is not a coach cookie', () => {
  assert.equal(auth.isRefSignedIn({ headers: { cookie: refCookie() } }), true);
  assert.equal(auth.isSignedIn({ headers: { cookie: refCookie().replace('lvsl_ref=', 'lvsl_admin=') } }), false);
});

test('a coach cookie is not a referee cookie', () => {
  assert.equal(auth.isRefSignedIn({ headers: { cookie: adminCookie().replace('lvsl_admin=', 'lvsl_ref=') } }), false);
});

test('the referee cookie is HttpOnly, Secure, SameSite=Strict and session-only', () => {
  const c = auth.issueRefCookie();
  assert.match(c, /HttpOnly/);
  assert.match(c, /Secure/);
  assert.match(c, /SameSite=Strict/);
  assert.equal(/Max-Age|Expires/.test(c), false);
});

/* ================= games: validation ================= */
console.log('\nlib/games.js');

const aGame = (over) => Object.assign({
  division: 'miercoles-premier', home: 'Ajax', away: 'ELITE',
  date: '2026-10-07', time: '19:30', field: 'Parque Sunset', status: 'scheduled',
}, over);

test('a normal game is accepted and team names are uppercased', () => {
  const { game, error } = gamesLib.validateGame(aGame());
  assert.equal(error, undefined);
  assert.equal(game.home, 'AJAX');
});

test('a team cannot play itself', () => {
  assert.equal(gamesLib.validateGame(aGame({ away: 'ajax' })).code, 'same_team');
});

test('dates and times must be real', () => {
  assert.equal(gamesLib.validateGame(aGame({ date: '2026-02-30' })).code, 'date');
  assert.equal(gamesLib.validateGame(aGame({ date: '' })).code, 'date');
  assert.equal(gamesLib.validateGame(aGame({ time: '25:00' })).code, 'time');
  assert.equal(gamesLib.validateGame(aGame({ time: '' })).error, undefined);
});

test('a final needs both scores, and only whole numbers 0–99', () => {
  assert.equal(gamesLib.validateGame(aGame({ status: 'final', homeScore: 2 })).code, 'score_missing');
  assert.equal(gamesLib.validateGame(aGame({ status: 'final', homeScore: 2, awayScore: -1 })).code, 'score_bad');
  assert.equal(gamesLib.validateGame(aGame({ status: 'final', homeScore: 2.5, awayScore: 1 })).code, 'score_bad');
  const { game } = gamesLib.validateGame(aGame({ status: 'final', homeScore: '3', awayScore: '0' }));
  assert.deepEqual([game.homeScore, game.awayScore], [3, 0]);
});

test('a game that is not final never keeps a score', () => {
  const { game } = gamesLib.validateGame(aGame({ status: 'cancelled', homeScore: 3, awayScore: 0 }));
  assert.deepEqual([game.homeScore, game.awayScore], [null, null]);
});

test('referees may score today and yesterday only (Las Vegas time)', () => {
  // 2026-10-08 05:00 UTC is still the evening of Oct 7 in Las Vegas.
  const now = new Date('2026-10-08T05:00:00Z');
  assert.equal(gamesLib.todayInVegas(now), '2026-10-07');
  assert.equal(gamesLib.refMayScore('2026-10-07', now), true);
  assert.equal(gamesLib.refMayScore('2026-10-06', now), true);
  assert.equal(gamesLib.refMayScore('2026-10-05', now), false);
  assert.equal(gamesLib.refMayScore('2026-10-08', now), false);
});

test('the public view hides who entered the score', () => {
  const row = { id: '4', division: 'd', home: 'A', away: 'B', game_date: '2026-10-07', game_time: '19:00',
    field: '', status: 'final', home_score: 2, away_score: 1, note: '', score_by: 'ref', score_name: 'Luis', score_at: null };
  const pub = gamesLib.gameOut(row);
  assert.equal('scoreName' in pub, false);
  assert.equal('scoreBy' in pub, false);
  assert.equal(gamesLib.gameOut(row, { full: true }).scoreName, 'Luis');
});

/* ================= games: who may change what ================= */
console.log('\napi/game.js — permissions (refused before any database call)');

async function callGame(method, cookie, body, id) {
  const res = mockRes();
  await gameApi({ method, body: body || {}, query: id ? { id: String(id) } : {},
    headers: cookie ? { cookie } : {} }, res);
  return res;
}

await atest('nobody signed in cannot add, edit, score or delete', async () => {
  assert.equal((await callGame('POST', null, aGame())).statusCode, 401);
  assert.equal((await callGame('PATCH', null, aGame(), 1)).statusCode, 401);
  assert.equal((await callGame('PATCH', null, { mode: 'score', homeScore: 1, awayScore: 0 }, 1)).statusCode, 401);
  assert.equal((await callGame('DELETE', null, {}, 1)).statusCode, 401);
});

await atest('a referee cannot add, edit or delete a game', async () => {
  assert.equal((await callGame('POST', refCookie(), aGame())).statusCode, 401);
  assert.equal((await callGame('PATCH', refCookie(), aGame(), 1)).statusCode, 401);
  assert.equal((await callGame('DELETE', refCookie(), {}, 1)).statusCode, 401);
});

await atest('a referee sending a bad score is refused before the database', async () => {
  const res = await callGame('PATCH', refCookie(), { mode: 'score', homeScore: '', awayScore: 2 }, 1);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'score_missing');
});

await atest('the coach sending an invalid game is refused with a reason', async () => {
  const res = await callGame('POST', adminCookie(), aGame({ away: 'AJAX' }));
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.code, 'same_team');
});

await atest('the referee list needs a referee or coach session', async () => {
  const res = mockRes();
  await gamesApi({ method: 'GET', query: { ref: '1' }, headers: {} }, res);
  assert.equal(res.statusCode, 401);
});

test('every schedule text the page uses exists in Spanish and English', () => {
  const page = readFileSync(new URL('../js/calendario.js', import.meta.url), 'utf8') +
    readFileSync(new URL('../calendario.html', import.meta.url), 'utf8');
  const i18n = readFileSync(new URL('../js/i18n.js', import.meta.url), 'utf8');
  const keys = new Set([...page.matchAll(/['"](sc_\w+)['"]/g)].map((m) => m[1]).filter((k) => !k.endsWith('_')));
  // calendario.js builds the header keys as 'sc_th_' + column.
  ['p', 'w', 'd', 'l', 'gf', 'ga', 'gd', 'pts'].forEach((c) => keys.add('sc_th_' + c));
  keys.add('nav_schedule');
  for (const key of keys) {
    const n = (i18n.match(new RegExp('\\b' + key + ':', 'g')) || []).length;
    assert.equal(n, 2, key + ' should be in both Spanish and English, found ' + n);
  }
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
