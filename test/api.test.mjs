/* Tests for the parts of the API that do not need a database.

   Everything in api/register.js up to the INSERT is pure validation, and
   lib/auth.js is pure crypto, so both can be exercised for real. The INSERT
   itself needs Postgres and is not covered here.

   Run: node test/api.test.mjs
*/

import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

// register.js only reaches the database after validation passes, so a fake
// connection string is enough to get past the "is it configured" check.
process.env.DATABASE_URL = 'postgres://test/test';
process.env.ADMIN_PASSWORD = 'correct-horse';
process.env.SESSION_SECRET = 'test-secret-not-a-real-one';

const { default: register } = await import('../api/register.js');
const auth = await import('../lib/auth.js');

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

for (const [field, value, why] of [
  ['division', '', 'no division'],
  ['team', '', 'no team'],
  ['name', '', 'no name'],
  ['address', '', 'no address'],
  ['phone', '702-555', 'a short phone'],
  ['email', 'not-an-email', 'a malformed email'],
  ['dob', '', 'no birth date'],
  ['dob', '1830-01-01', 'an impossible birth date'],
]) {
  await atest('rejects ' + why, async () => {
    const res = await post({ ...adult(), [field]: value });
    assert.equal(res.statusCode, 400, 'expected 400, got ' + res.statusCode);
    assert.equal(res.body.error, 'invalid');
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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
