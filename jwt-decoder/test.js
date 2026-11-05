// Run: timeout 60 node jwt-decoder/test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(core + '; return { decodeSegment, parseJwt, formatRelative, timeClaims, tokenStatus, describeSignature };')();

const b64u = (v) => Buffer.from(typeof v === 'string' ? v : JSON.stringify(v), 'utf8').toString('base64url');
const mk = (h, p, s = 'c2ln') => `${b64u(h)}.${b64u(p)}.${s}`;
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const NOW = Date.UTC(2026, 0, 1, 12, 0, 0);

// Classic jwt.io sample token
const SAMPLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

t('decodes a known real-world token', () => {
  const r = api.parseJwt(SAMPLE);
  assert(r.ok);
  assert.deepStrictEqual(r.header, { alg: 'HS256', typ: 'JWT' });
  assert.deepStrictEqual(r.payload, { sub: '1234567890', name: 'John Doe', iat: 1516239022 });
  assert.strictEqual(r.alg, 'HS256');
  assert.strictEqual(r.signature, 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
});
t('empty / whitespace / null input', () => {
  for (const v of ['', '   ', '\n\t', null, undefined, 'Bearer ', 'Bearer']) {
    const r = api.parseJwt(v); assert.strictEqual(r.ok, false); assert.strictEqual(r.error, 'Empty input.');
  }
});
t('wrong part counts', () => {
  assert.match(api.parseJwt('abc').error, /found 1/);
  assert.match(api.parseJwt('a.b').error, /found 2/);
  assert.match(api.parseJwt('a.b.c.d').error, /found 4/);
  assert.match(api.parseJwt('a.b.c.d.e').error, /JWE/);
  assert.match(api.parseJwt('a.b.c.d.e.f').error, /found 6/);
});
t('Bearer prefix, quotes, wrapped lines, surrounding whitespace', () => {
  for (const v of ['Bearer ' + SAMPLE, 'bearer   ' + SAMPLE, `"${SAMPLE}"`, `'${SAMPLE}'`, `  \n${SAMPLE}\n `,
                   SAMPLE.replace(/(.{20})/g, '$1\n'), SAMPLE.replace(/\./g, ' . ')]) {
    assert(api.parseJwt(v).ok, JSON.stringify(v).slice(0, 40));
  }
});
t('base64url variants: padded, unpadded, standard alphabet', () => {
  const obj = { a: '??>>', b: 'subjects?_' };           // bytes that produce + / in std base64
  const std = Buffer.from(JSON.stringify(obj)).toString('base64');
  assert(/[+\/=]/.test(std));
  for (const seg of [std, std.replace(/=+$/, ''), b64u(obj), b64u(obj) + '==']) {
    assert.deepStrictEqual(JSON.parse(api.decodeSegment(seg)), obj);
  }
});
t('Unicode payload: accents, CJK, emoji (astral), RTL', () => {
  const p = { name: 'José Ñandú', city: '東京', mood: '😀👍🏽', rtl: 'שלום', esc: 'quote" \\ \n' };
  const r = api.parseJwt(mk({ alg: 'none' }, p));
  assert.deepStrictEqual(r.payload, p);
});
t('Unicode in header (kid)', () => {
  assert.strictEqual(api.parseJwt(mk({ alg: 'HS256', kid: 'ключ-1' }, {})).header.kid, 'ключ-1');
});
t('invalid UTF-8 bytes are rejected, not mangled', () => {
  const bad = Buffer.from([0xff, 0xfe, 0x7b]).toString('base64url');
  assert.throws(() => api.decodeSegment(bad), /UTF-8/);
  assert.match(api.parseJwt(`${b64u({ alg: 'x' })}.${bad}.sig`).error, /Payload is not valid UTF-8/);
});
t('bad characters / bad length / not JSON / not an object', () => {
  assert.match(api.parseJwt(`!!!.${b64u({})}.s`).error, /Header contains characters/);
  assert.match(api.parseJwt(`${b64u({})}.a.s`).error, /Payload has an invalid base64 length/);
  assert.match(api.parseJwt(`${b64u('hello')}.${b64u({})}.s`).error, /Header is not valid JSON/);
  assert.match(api.parseJwt(`${b64u({})}.${b64u('[1,2]')}.s`).error, /Payload must be a JSON object/);
  assert.match(api.parseJwt(`${b64u('null')}.${b64u({})}.s`).error, /Header must be a JSON object/);
  assert.match(api.parseJwt(`${b64u('42')}.${b64u({})}.s`).error, /Header must be a JSON object/);
});
t('empty segments', () => {
  assert.match(api.parseJwt('..').error, /Header is not valid JSON/);
  assert.match(api.parseJwt(`${b64u({})}..`).error, /Payload is not valid JSON/);
});
t('unsigned token (empty signature) and alg none', () => {
  const r = api.parseJwt(mk({ alg: 'none' }, { a: 1 }, ''));
  assert(r.ok); assert.strictEqual(r.signature, '');
  assert.match(api.describeSignature('', 'none'), /alg "none"/);
  assert.match(api.describeSignature('', 'HS256'), /no signature/);
  assert.match(api.describeSignature('abcd', 'HS256'), /4 characters/);
});
t('missing/non-string alg', () => {
  assert.strictEqual(api.parseJwt(mk({}, {})).alg, null);
  assert.strictEqual(api.parseJwt(mk({ alg: 5 }, {})).alg, null);
});
t('time claims: formatting and numeric edge cases', () => {
  const s = NOW / 1000;
  const c = api.timeClaims({ exp: s + 3600, iat: s - 86400 * 3, nbf: s }, NOW);
  assert.deepStrictEqual(c.map(x => x.claim), ['exp', 'nbf', 'iat']);
  assert.strictEqual(c[0].iso, '2026-01-01T13:00:00.000Z');
  assert.strictEqual(c[0].relative, 'in 1 hour');
  assert.strictEqual(c[1].relative, 'now');
  assert.strictEqual(c[2].relative, '3 days ago');
  assert.strictEqual(api.timeClaims({ exp: 0 }, NOW)[0].iso, '1970-01-01T00:00:00.000Z');
  assert.strictEqual(api.timeClaims({ exp: 1.5 }, NOW)[0].iso, '1970-01-01T00:00:01.500Z'); // fractional seconds
  for (const bad of ['1700000000', null, true, [], {}, NaN, Infinity, 1e20, -1e20]) {
    const x = api.timeClaims({ exp: bad }, NOW)[0]; assert.strictEqual(x.valid, false, String(bad));
  }
  assert.deepStrictEqual(api.timeClaims({ foo: 1 }, NOW), []);
});
t('relative formatting singular/plural and boundaries', () => {
  const f = api.formatRelative;
  assert.strictEqual(f(1000), 'in 1 second');
  assert.strictEqual(f(-2000), '2 seconds ago');
  assert.strictEqual(f(60000), 'in 1 minute');
  assert.strictEqual(f(-3599000), '59 minutes ago');
  assert.strictEqual(f(86400000 * 400), 'in 400 days');
  assert.strictEqual(f(0), 'now');
  assert.strictEqual(f(300), 'now');          // sub-half-second rounds to now
  assert.strictEqual(f(-499), 'now');
  assert.strictEqual(f(500), 'in 1 second');
});
t('token status', () => {
  const s = NOW / 1000;
  assert.strictEqual(api.tokenStatus({ exp: s - 1 }, NOW), 'expired');
  assert.strictEqual(api.tokenStatus({ exp: s }, NOW), 'expired');        // exp is exclusive per RFC 7519
  assert.strictEqual(api.tokenStatus({ exp: s + 1 }, NOW), 'active');
  assert.strictEqual(api.tokenStatus({ nbf: s + 60, exp: s + 3600 }, NOW), 'not-yet-valid');
  assert.strictEqual(api.tokenStatus({}, NOW), 'no-expiry');
  assert.strictEqual(api.tokenStatus({ exp: 'soon' }, NOW), 'no-expiry'); // invalid exp is not treated as valid expiry
});
t('large token is fast', () => {
  const big = mk({ alg: 'HS256' }, { data: 'x'.repeat(500000) });
  const start = Date.now(); assert(api.parseJwt(big).ok); assert(Date.now() - start < 2000);
});

console.log(n + ' tests passed');
process.exit(0);
