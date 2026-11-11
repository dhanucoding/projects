// Run: timeout 60 node scripts/hub.test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const data = src.split('// DATA-START')[1].split('// DATA-END')[0];
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(data + core + '; return { CATEGORIES, APPS, norm, terms, slug, score, search, countsByCategory, isNew, parseHash, buildHash };')();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const titles = (list) => list.map(a => a.title);
const day = (y, m, d) => new Date(y, m - 1, d, 15, 30);

t('APPS data: valid categories, unique titles/hrefs, files exist, required fields', () => {
  const seenTitle = new Set(), seenHref = new Set();
  assert.ok(api.APPS.length >= 17);
  for (const a of api.APPS) {
    assert.ok(api.CATEGORIES.includes(a.cat), 'unknown category: ' + a.title);
    for (const f of ['icon', 'title', 'href', 'desc']) assert.ok(typeof a[f] === 'string' && a[f].trim(), f + ' missing: ' + a.title);
    assert.ok(!seenTitle.has(a.title), 'duplicate title ' + a.title); seenTitle.add(a.title);
    assert.ok(!seenHref.has(a.href), 'duplicate href ' + a.href); seenHref.add(a.href);
    assert.ok(fs.existsSync(path.join(root, a.href)), 'missing file: ' + a.href);
    if (a.tags !== undefined) assert.ok(Array.isArray(a.tags) && a.tags.every(x => typeof x === 'string'), 'bad tags: ' + a.title);
    if (a.added !== undefined) assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(a.added) && !isNaN(Date.parse(a.added)), 'bad added: ' + a.title);
  }
  for (const c of api.CATEGORIES) assert.ok(api.APPS.some(a => a.cat === c), 'empty category ' + c);
  assert.strictEqual(new Set(api.CATEGORIES.map(api.slug)).size, api.CATEGORIES.length); // slugs distinct
});
t('norm / terms / slug', () => {
  assert.strictEqual(api.norm('Café ÜBER'), 'cafe uber');
  assert.strictEqual(api.norm(null), '');
  assert.strictEqual(api.norm(undefined), '');
  assert.deepStrictEqual(api.terms('  JSON   csv \t'), ['json', 'csv']);
  assert.deepStrictEqual(api.terms(''), []);
  assert.deepStrictEqual(api.terms('   '), []);
  assert.strictEqual(api.slug('Text & Code'), 'text-code');
  assert.strictEqual(api.slug('Converters'), 'converters');
  assert.strictEqual(api.slug('--Hi!!'), 'hi');
});
t('search: empty/whitespace query returns everything in list order', () => {
  for (const q of ['', '   ', null, undefined]) assert.deepStrictEqual(api.search(api.APPS, q, null), api.APPS);
});
t('search: category filter, with and without query', () => {
  const conv = api.search(api.APPS, '', 'Converters');
  assert.ok(conv.length > 0 && conv.every(a => a.cat === 'Converters'));
  assert.deepStrictEqual(titles(api.search(api.APPS, 'unit', 'Converters')), ['Unit Converter']);
  assert.deepStrictEqual(api.search(api.APPS, 'unit', 'Boards'), []);
  assert.deepStrictEqual(api.search(api.APPS, '', 'No Such Category'), []);
});
t('search: matches title, description, tags, category; case and accent insensitive', () => {
  assert.ok(titles(api.search(api.APPS, 'JWT', null)).includes('JWT Decoder'));
  assert.ok(titles(api.search(api.APPS, 'jwt', null)).includes('JWT Decoder'));
  assert.ok(titles(api.search(api.APPS, 'iso 8601', null)).includes('Timestamp / Epoch Converter')); // tag with a space
  assert.ok(titles(api.search(api.APPS, 'indexeddb', null)).includes('Kanban Board'));
  assert.ok(titles(api.search(api.APPS, 'generators', null)).includes('UUID Generator'));       // by category
  assert.deepStrictEqual(titles(api.search([{ title: 'Café Tool', desc: '', cat: 'x' }], 'CAFE', null)), ['Café Tool']);
  assert.deepStrictEqual(titles(api.search([{ title: 'Cafe Tool', desc: '', cat: 'x' }], 'café', null)), ['Cafe Tool']);
});
t('search: all terms must match (AND), any order', () => {
  assert.deepStrictEqual(titles(api.search(api.APPS, 'csv json', null)), ['CSV ⇄ JSON Converter']);
  assert.deepStrictEqual(titles(api.search(api.APPS, 'json csv', null)), ['CSV ⇄ JSON Converter']);
  assert.deepStrictEqual(api.search(api.APPS, 'json zzzz', null), []);
});
t('search: ranking puts title hits before tag/description hits, stable ties', () => {
  const r = titles(api.search(api.APPS, 'json', null));
  assert.strictEqual(r[0], 'JSON Formatter');                      // title starts with it
  assert.ok(r.indexOf('CSV ⇄ JSON Converter') < r.indexOf('JWT Decoder')); // title word beats tag-only
  const tie = [{ title: 'A one', desc: '', cat: 'x' }, { title: 'B one', desc: '', cat: 'x' }];
  assert.deepStrictEqual(titles(api.search(tie, 'one', null)), ['A one', 'B one']);
});
t('search: special characters are literal, never regex or errors', () => {
  for (const q of ['.*', '(', '[', '\\', '+?', '$^', '%', '<script>', '🍅', '日本語', 'a'.repeat(5000)]) {
    assert.doesNotThrow(() => api.search(api.APPS, q, null), q);
  }
  assert.deepStrictEqual(api.search(api.APPS, '[', null), []);
  assert.ok(titles(api.search(api.APPS, '(', null)).includes('JWT Decoder')); // literal "(" in its description
  assert.deepStrictEqual(api.search(api.APPS, '🍅', null), []); // icons are not searchable text
  assert.deepStrictEqual(api.search(api.APPS, '.*', null), []); // matched literally, not as a regex
});
t('countsByCategory follows the query', () => {
  const all = api.countsByCategory(api.APPS, '', api.CATEGORIES);
  assert.strictEqual(all.total, api.APPS.length);
  assert.strictEqual(api.CATEGORIES.reduce((s, c) => s + all[c], 0), api.APPS.length);
  const j = api.countsByCategory(api.APPS, 'json', api.CATEGORIES);
  assert.strictEqual(j.total, api.search(api.APPS, 'json', null).length);
  assert.strictEqual(j.Generators, 0);
  assert.ok(j['Text & Code'] >= 2 && j.Converters >= 1);
  assert.strictEqual(api.countsByCategory(api.APPS, 'zzzz', api.CATEGORIES).total, 0);
});
t('isNew: window edges, future, missing, malformed, impossible dates', () => {
  const app = (added) => ({ added });
  const now = day(2026, 11, 11);
  assert.strictEqual(api.isNew(app('2026-11-11'), now), true);   // today
  assert.strictEqual(api.isNew(app('2026-10-28'), now), true);   // 14 days ago
  assert.strictEqual(api.isNew(app('2026-10-27'), now), false);  // 15 days ago
  assert.strictEqual(api.isNew(app('2026-11-12'), now), false);  // future
  assert.strictEqual(api.isNew({}, now), false);
  assert.strictEqual(api.isNew(null, now), false);
  for (const bad of ['', 'yesterday', '2026-02-31', '2026-13-01', '2026-1-1', '26-11-11', null, 20261111]) {
    assert.strictEqual(api.isNew(app(bad), now), false, String(bad));
  }
  assert.strictEqual(api.isNew(app('2025-12-25'), day(2026, 1, 3)), true);   // across a year boundary
  assert.strictEqual(api.isNew(app('2024-02-29'), day(2024, 3, 5)), true);   // leap day
  assert.strictEqual(api.isNew(app('2026-11-04'), now, 3), false);           // custom window
  assert.strictEqual(api.isNew(app('2026-03-01'), day(2026, 3, 14)), true);  // DST week: no off-by-one
  assert.strictEqual(api.isNew(app('2026-11-01'), day(2026, 11, 15)), true); // fall-back week, exactly 14
});
t('parseHash: valid, unknown category, empty, malformed, trims huge queries', () => {
  const C = api.CATEGORIES;
  assert.deepStrictEqual(api.parseHash('#cat=converters&q=json', C), { cat: 'Converters', q: 'json' });
  assert.deepStrictEqual(api.parseHash('#cat=text-code', C), { cat: 'Text & Code', q: '' });
  assert.deepStrictEqual(api.parseHash('#cat=nope&q=x', C), { cat: null, q: 'x' });
  for (const h of ['', '#', null, undefined, '#%', '#q=%E0%A4%A', '#&&&', '#cat=']) {
    assert.doesNotThrow(() => api.parseHash(h, C), String(h));
    assert.strictEqual(api.parseHash(h, C).cat, null);
  }
  assert.strictEqual(api.parseHash('#q=' + 'a'.repeat(1000), C).q.length, 100);
});
t('buildHash / parseHash round-trip incl. Unicode and reserved characters', () => {
  const C = api.CATEGORIES;
  assert.strictEqual(api.buildHash(null, ''), '');
  assert.strictEqual(api.buildHash(null, '   '), '');
  assert.strictEqual(api.buildHash('Converters', ''), '#cat=converters');
  for (const q of ['json', 'two words', 'a&b=c', '100%', 'café', '日本語', '🍅 timer', '#hash', '+plus']) {
    const back = api.parseHash(api.buildHash('Text & Code', q), C);
    assert.deepStrictEqual(back, { cat: 'Text & Code', q }, q);
  }
  assert.strictEqual(api.buildHash(null, '🍅'.repeat(300)).length > 0, true);
  assert.strictEqual(api.parseHash(api.buildHash(null, '🍅'.repeat(300)), C).q, '🍅'.repeat(100)); // cut on code points
});
t('search is fast on a large list', () => {
  const big = [];
  for (let i = 0; i < 5000; i++) big.push({ cat: 'Boards', title: 'App ' + i, desc: 'desc ' + i, tags: ['t' + i] });
  const start = Date.now();
  assert.strictEqual(api.search(big, 'app 4999', null)[0].title, 'App 4999');
  assert.ok(Date.now() - start < 2000);
});

console.log(n + ' tests passed');
process.exit(0);
