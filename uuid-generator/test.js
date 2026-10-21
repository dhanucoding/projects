// Run: timeout 60 node uuid-generator/test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const load = () => new Function(core + '; return { uuidV4, uuidV7, generate, formatUuid, clampCount, MAX_COUNT };')();
const api = load();

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const V7 = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('v4 format/version/variant', () => { for (let i = 0; i < 2000; i++) assert(V4.test(api.uuidV4())); });
t('v4 uniqueness', () => assert.strictEqual(new Set(api.generate(4, 1000)).size, 1000));
t('v7 format/version/variant', () => { for (let i = 0; i < 2000; i++) assert(V7.test(api.uuidV7())); });
t('v7 timestamp encoded', () => {
  const ms = 1700000000123;
  const u = load().uuidV7(ms + 1e7).replace(/-/g, '');
  assert.strictEqual(parseInt(u.slice(0, 12), 16), ms + 1e7);
});
t('v7 timestamp > 2^32 ms handled', () => {
  const ms = 1.9e12 + 5e9; // well past 32-bit range
  assert.strictEqual(parseInt(load().uuidV7(ms).replace(/-/g, '').slice(0, 12), 16), ms);
});
t('v7 sorts in generation order within one ms', () => {
  const f = load(), list = []; for (let i = 0; i < 3000; i++) list.push(f.uuidV7(2000000000000));
  const sorted = [...list].sort();
  assert.deepStrictEqual(list, sorted);
  assert.strictEqual(new Set(list).size, list.length);
});
t('v7 clock going backwards stays monotonic', () => {
  const f = load(), a = f.uuidV7(3000000000000), b = f.uuidV7(2999999999000);
  assert(b > a);
});
t('v7 batch via generate is ordered', () => {
  const l = api.generate(7, 500); assert.deepStrictEqual(l, [...l].sort());
});
t('count: empty / NaN / zero / negative -> 1', () => {
  for (const v of ['', 'abc', 0, -5, null, undefined, '  ']) assert.strictEqual(api.clampCount(v), 1);
});
t('count: capped at 1000, decimals truncated, numeric strings ok', () => {
  assert.strictEqual(api.clampCount(99999), 1000);
  assert.strictEqual(api.clampCount('7.9'), 7);
  assert.strictEqual(api.clampCount('25'), 25);
  assert.strictEqual(api.generate(4, 5000).length, 1000);
  assert.strictEqual(api.generate(4, '').length, 1);
});
t('formatting: upper/no hyphens/braces and combinations', () => {
  const u = '0190a1b2-c3d4-7e5f-8a6b-7c8d9e0f1a2b';
  assert.strictEqual(api.formatUuid(u, {}), u);
  assert.strictEqual(api.formatUuid(u, { hyphens: true }), u);
  assert.strictEqual(api.formatUuid(u, { hyphens: false }), '0190a1b2c3d47e5f8a6b7c8d9e0f1a2b');
  assert.strictEqual(api.formatUuid(u, { hyphens: true, upper: true }), u.toUpperCase());
  assert.strictEqual(api.formatUuid(u, { hyphens: true, braces: true }), '{' + u + '}');
  assert.strictEqual(api.formatUuid(u, { hyphens: false, upper: true, braces: true }), '{0190A1B2C3D47E5F8A6B7C8D9E0F1A2B}');
});
t('generate with undefined opts keeps hyphens', () => {
  assert.strictEqual(api.generate(4, 1)[0].length, 36);
});
t('v4 randomness sanity: all hex digits appear', () => {
  const s = api.generate(4, 1000).join('').replace(/-/g, '');
  for (const c of '0123456789abcdef') assert(s.includes(c));
});

console.log(`${n} tests passed`);
process.exit(0);
