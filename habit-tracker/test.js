// Run: timeout 60 node habit-tracker/test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(core + `; return { MAX_HABITS, MAX_NAME, MAX_DAYS, dayKey, parseDay, shiftDay, daysBetween, weekday, fmtDate, fmtNum, fmtPct,
  streak, checkedDays, totalCheckins, bestStreak, firstDay, completionRate, cleanName, validateName, addHabit, removeHabit,
  toggleDay, levelFor, heatmap, monthLabels, loadState };`)();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const set = (...days) => Object.fromEntries(days.map(d => [d, true]));
const TODAY = '2026-11-12'; // a Thursday

t('dayKey uses local date and zero-pads', () => {
  assert.strictEqual(api.dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  assert.strictEqual(api.dayKey(new Date(2026, 11, 31, 0, 0)), '2026-12-31');
});
t('parseDay accepts only real calendar days', () => {
  assert.notStrictEqual(api.parseDay('2024-02-29'), null);
  for (const bad of ['2026-02-29', '2026-02-31', '2026-13-01', '2026-00-10', '2026-04-31', '2026-1-1', '26-11-11', '0050-01-01', '', 'x', null, undefined, 20261111, '2026-11-11 ']) {
    assert.strictEqual(api.parseDay(bad), null, String(bad));
  }
});
t('shiftDay across month, year, leap day, and DST weeks', () => {
  assert.strictEqual(api.shiftDay('2026-03-01', -1), '2026-02-28');
  assert.strictEqual(api.shiftDay('2024-03-01', -1), '2024-02-29');
  assert.strictEqual(api.shiftDay('2026-01-01', -1), '2025-12-31');
  assert.strictEqual(api.shiftDay('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(api.shiftDay('2026-03-09', -1), '2026-03-08');
  assert.strictEqual(api.shiftDay('2026-11-02', -1), '2026-11-01');
  assert.strictEqual(api.shiftDay('2026-11-12', 0), '2026-11-12');
  assert.strictEqual(api.shiftDay('garbage', 5), 'garbage');
  assert.strictEqual(api.daysBetween('2026-01-01', '2026-12-31'), 364);
  assert.strictEqual(api.daysBetween('2026-03-07', '2026-03-09'), 2); // spans US spring-forward
});
t('weekday is 0 for Sunday', () => {
  assert.strictEqual(api.weekday('2026-11-08'), 0);
  assert.strictEqual(api.weekday('2026-11-12'), 4);
  assert.strictEqual(api.weekday('2026-11-14'), 6);
});
t('formatting: dates, numbers, percentages', () => {
  assert.strictEqual(api.fmtDate('2026-11-05'), 'Nov 5, 2026');
  assert.strictEqual(api.fmtDate('2026-02-31'), '');
  assert.strictEqual(api.fmtDate(null), '');
  assert.strictEqual(api.fmtNum(0), '0');
  assert.strictEqual(api.fmtNum(1234567), '1,234,567');
  for (const v of [NaN, Infinity, null, undefined, '5']) assert.strictEqual(api.fmtNum(v), '—');
  assert.strictEqual(api.fmtPct(0), '0%');
  assert.strictEqual(api.fmtPct(1), '100%');
  assert.strictEqual(api.fmtPct(2 / 3), '67%');
  assert.strictEqual(api.fmtPct(0.005), '1%');
  assert.strictEqual(api.fmtPct(NaN), '—');
  assert.strictEqual(api.fmtPct(undefined), '—');
});
t('streak: today, yesterday-only, gap, empty, bad input', () => {
  assert.strictEqual(api.streak({}, TODAY), 0);
  assert.strictEqual(api.streak(null, TODAY), 0);
  assert.strictEqual(api.streak(undefined, TODAY), 0);
  assert.strictEqual(api.streak(set('2026-11-12'), TODAY), 1);
  assert.strictEqual(api.streak(set('2026-11-11', '2026-11-10'), TODAY), 2);          // not checked yet today
  assert.strictEqual(api.streak(set('2026-11-12', '2026-11-11', '2026-11-09'), TODAY), 2); // gap on the 10th
  assert.strictEqual(api.streak(set('2026-11-10'), TODAY), 0);                          // missed yesterday: broken
  assert.strictEqual(api.streak(set('2026-11-13', '2026-11-14'), TODAY), 0);            // future entries ignored
  assert.strictEqual(api.streak(set('2026-02-28', '2026-03-01'), '2026-03-01'), 2);     // across month end
  assert.strictEqual(api.streak(set('2025-12-31', '2026-01-01'), '2026-01-01'), 2);     // across year end
  assert.strictEqual(api.streak(set('2024-02-28', '2024-02-29', '2024-03-01'), '2024-03-01'), 3); // leap day
  assert.strictEqual(api.streak(set('2026-11-12'), 'not a day'), 0);
});
t('streak survives a long run without hanging', () => {
  const days = {};
  let d = TODAY;
  for (let i = 0; i < 5000; i++) { days[d] = true; d = api.shiftDay(d, -1); }
  const s = api.streak(days, TODAY);
  assert.ok(s >= api.MAX_DAYS && s <= api.MAX_DAYS + 1, String(s)); // bounded, finishes
});
t('bestStreak and totalCheckins ignore future and invalid keys', () => {
  const days = set('2026-11-01', '2026-11-02', '2026-11-03', '2026-11-10', '2026-11-11', '2026-11-20', 'junk', '2026-02-31');
  assert.strictEqual(api.bestStreak(days, TODAY), 3);
  assert.strictEqual(api.totalCheckins(days, TODAY), 5);
  assert.strictEqual(api.bestStreak({}, TODAY), 0);
  assert.strictEqual(api.bestStreak(null, TODAY), 0);
  assert.strictEqual(api.bestStreak(set('2026-12-31', '2027-01-01'), '2027-01-01'), 2);
  assert.strictEqual(api.bestStreak({ '2026-11-01': false }, TODAY), 0); // only true counts
});
t('completionRate: young habit, full window, backfill before creation', () => {
  assert.strictEqual(api.completionRate({}, TODAY, TODAY, 30), 0);
  assert.strictEqual(api.completionRate(set(TODAY), TODAY, TODAY, 30), 1);                  // created today, done today
  assert.strictEqual(api.completionRate(set('2026-11-11'), '2026-11-11', TODAY, 30), 0.5);  // 2-day-old habit
  const full = {}; let d = TODAY;
  for (let i = 0; i < 15; i++) { full[d] = true; d = api.shiftDay(d, -1); }
  assert.strictEqual(api.completionRate(full, '2026-01-01', TODAY, 30), 0.5);               // 15 of last 30
  const early = set('2026-11-01', TODAY);
  const start = api.firstDay('2026-11-10', early, TODAY);
  assert.strictEqual(start, '2026-11-01');                                                   // backfill extends the start
  assert.ok(api.completionRate(early, start, TODAY, 30) <= 1);
  assert.strictEqual(api.completionRate({}, TODAY, 'bad', 30), 0);
  assert.strictEqual(api.completionRate(set(TODAY), '2027-01-01', TODAY, 30), 1);            // creation date in the future
  assert.strictEqual(api.completionRate(set(TODAY), 'garbage', TODAY, 30), 1);
});
t('habit names: clean, validate, Unicode, duplicates, limits', () => {
  assert.strictEqual(api.cleanName('  read \n  books '), 'read books');
  assert.strictEqual(api.cleanName(null), '');
  assert.strictEqual(api.validateName([], ''), 'empty');
  assert.strictEqual(api.validateName([], '   \t'), 'empty');
  assert.strictEqual(api.validateName([], null), 'empty');
  assert.strictEqual(api.validateName([], 'Read'), '');
  const list = api.addHabit([], 'Café Time ☕', 'a', TODAY);
  assert.strictEqual(list[0].name, 'Café Time ☕');
  assert.strictEqual(list[0].created, TODAY);
  assert.strictEqual(api.validateName(list, 'cafe  time ☕'), 'duplicate');   // case, accent, spacing
  assert.strictEqual(api.validateName(list, 'CAFÉ TIME ☕'), 'duplicate');
  assert.strictEqual(api.validateName(list, '日本語'), '');
  assert.strictEqual(api.addHabit(list, 'cafe time ☕', 'b', TODAY).length, 1); // duplicate rejected
  assert.strictEqual(api.addHabit(undefined, '日本語の習慣', 'c', TODAY)[0].name, '日本語の習慣');
  const long = api.addHabit([], '🔥'.repeat(200), 'd', TODAY)[0].name;
  assert.strictEqual(Array.from(long).length, api.MAX_NAME);
  assert.ok(!/[\ud800-\udbff]$/.test(long));                                  // no broken surrogate pair
  let many = [];
  for (let i = 0; i < api.MAX_HABITS + 3; i++) many = api.addHabit(many, 'habit ' + i, 'id' + i, TODAY);
  assert.strictEqual(many.length, api.MAX_HABITS);
  assert.strictEqual(api.validateName(many, 'one more'), 'limit');
  assert.strictEqual(api.addHabit([], 'x', 'e', 'bad-date')[0].created.length, 10); // falls back to a real day
});
t('toggleDay: toggles, backfills, refuses future/invalid, immutable', () => {
  const log = {};
  const on = api.toggleDay(log, 'h1', TODAY, TODAY);
  assert.deepStrictEqual(on, { h1: { [TODAY]: true } });
  assert.deepStrictEqual(log, {});
  const off = api.toggleDay(on, 'h1', TODAY, TODAY);
  assert.deepStrictEqual(off, {});                                // empty habit entry removed
  assert.ok(api.toggleDay(log, 'h1', '2026-11-01', TODAY).h1['2026-11-01']); // backfill past day
  assert.strictEqual(api.toggleDay(log, 'h1', '2026-11-13', TODAY), log);    // future: same object
  assert.strictEqual(api.toggleDay(log, 'h1', '2026-02-31', TODAY), log);
  assert.strictEqual(api.toggleDay(log, 'h1', 'junk', TODAY), log);
  assert.strictEqual(api.toggleDay(log, 'h1', TODAY, 'junk'), log);
  const two = api.toggleDay(api.toggleDay({}, 'a', TODAY, TODAY), 'b', TODAY, TODAY);
  assert.deepStrictEqual(Object.keys(two).sort(), ['a', 'b']);
});
t('removeHabit drops the habit and its log only', () => {
  const habits = api.addHabit(api.addHabit([], 'one', 'a', TODAY), 'two', 'b', TODAY);
  const log = { a: set(TODAY), b: set(TODAY) };
  const r = api.removeHabit(habits, log, 'a');
  assert.deepStrictEqual(r.habits.map(h => h.id), ['b']);
  assert.deepStrictEqual(Object.keys(r.log), ['b']);
  assert.deepStrictEqual(Object.keys(log), ['a', 'b']);           // original untouched
  assert.strictEqual(api.removeHabit(habits, log, 'zzz').habits.length, 2);
});
t('levelFor thresholds', () => {
  assert.strictEqual(api.levelFor(0, 0), 0);
  assert.strictEqual(api.levelFor(0, 4), 0);
  assert.strictEqual(api.levelFor(1, 10), 1);
  assert.strictEqual(api.levelFor(1, 4), 1);
  assert.strictEqual(api.levelFor(2, 4), 2);
  assert.strictEqual(api.levelFor(3, 4), 3);
  assert.strictEqual(api.levelFor(4, 4), 4);
  assert.strictEqual(api.levelFor(1, 1), 4);
});
t('heatmap shape: 26 columns x 7 rows, Sunday-first, today in last column', () => {
  const cols = api.heatmap([], {}, null, TODAY, 26);
  assert.strictEqual(cols.length, 26);
  assert.ok(cols.every(c => c.length === 7));
  assert.ok(cols.every(c => api.weekday(c[0].day) === 0));        // every column starts on Sunday
  const last = cols[25];
  assert.strictEqual(last[4].day, TODAY);                         // Thursday = row 4
  assert.strictEqual(last[4].future, false);
  assert.strictEqual(last[5].future, true);                       // Friday onward is future
  assert.strictEqual(last[6].future, true);
  assert.strictEqual(cols[0][0].day, api.shiftDay('2026-11-08', -7 * 25));
  const days = cols.flat().map(c => c.day);
  assert.strictEqual(new Set(days).size, days.length);            // no repeated day
  for (let i = 1; i < days.length; i++) assert.strictEqual(api.daysBetween(days[i - 1], days[i]), 1); // contiguous
});
t('heatmap: today on a Sunday and on a Saturday', () => {
  const sun = api.heatmap([], {}, null, '2026-11-08', 4);
  assert.strictEqual(sun[3][0].day, '2026-11-08');
  assert.ok(sun[3].slice(1).every(c => c.future));
  const sat = api.heatmap([], {}, null, '2026-11-14', 4);
  assert.strictEqual(sat[3][6].day, '2026-11-14');
  assert.ok(sat[3].every(c => !c.future));
});
t('heatmap: single habit vs all habits, creation date, future ignored', () => {
  const habits = api.addHabit(api.addHabit([], 'one', 'a', '2026-11-01'), 'two', 'b', '2026-11-10', );
  const log = { a: set('2026-11-12', '2026-11-05'), b: set('2026-11-12') };
  const find = (cols, day) => cols.flat().find(c => c.day === day);
  const all = api.heatmap(habits, log, null, TODAY, 4);
  assert.deepStrictEqual([find(all, TODAY).checked, find(all, TODAY).total, find(all, TODAY).level], [2, 2, 4]);
  assert.strictEqual(find(all, '2026-11-05').total, 1);           // habit "two" didn't exist yet
  assert.strictEqual(find(all, '2026-11-05').level, 4);
  assert.strictEqual(find(all, '2026-11-11').level, 0);           // 0 of 2
  const one = api.heatmap(habits, log, 'a', TODAY, 4);
  assert.strictEqual(find(one, '2026-11-05').level, 4);
  assert.strictEqual(find(one, '2026-11-06').level, 0);
  assert.strictEqual(find(one, '2026-11-13').level, 0);           // future cells never lit
  assert.strictEqual(api.heatmap(habits, { a: set('2026-11-13') }, 'a', TODAY, 4).flat().find(c => c.day === '2026-11-13').level, 0); // checked in the future: still unlit
  const none = api.heatmap([], {}, null, TODAY, 4);
  assert.ok(none.flat().every(c => c.level === 0 && c.total === 0));
  const backfilled = api.heatmap(api.addHabit([], 'x', 'a', TODAY), { a: set('2026-11-01') }, null, TODAY, 4);
  assert.strictEqual(find(backfilled, '2026-11-01').level, 4);    // a check before creation still shows
});
t('monthLabels: starts at the first column, no crowding', () => {
  const cols = api.heatmap([], {}, null, TODAY, 26);
  const labels = api.monthLabels(cols);
  assert.strictEqual(labels[0].col, 0);
  for (let i = 1; i < labels.length; i++) assert.ok(labels[i].col - labels[i - 1].col >= 3);
  assert.ok(labels.length >= 5 && labels.length <= 8);
  assert.ok(labels.every(l => /^[A-Z][a-z]{2}$/.test(l.label)));
});
t('loadState: null, corrupt JSON, wrong types', () => {
  for (const v of [null, undefined, '', 'not json', '42', '"str"', 'null', '[]', '{', '{"habits":5,"log":"x"}']) {
    assert.deepStrictEqual(api.loadState(v, TODAY), { habits: [], log: {} }, String(v));
  }
});
t('loadState: filters bad habits/days, accepts array or object logs, dedupes ids', () => {
  const s = api.loadState(JSON.stringify({
    habits: [
      { id: 'a', name: '  Read  ', created: '2026-11-01' },
      { id: 'a', name: 'dup id' },
      { id: 5, name: 'numeric id' },
      { id: 'c', name: '   ' },
      { id: 'd', name: 'Bad created', created: '2026-02-31' },
      { id: 'e', name: 'Arr log' },
      null, 'str'
    ],
    log: {
      a: { '2026-11-02': true, '2026-11-03': false, junk: true, '2026-02-31': true },
      d: ['2026-11-01', 'nope', '2026-11-01'],
      e: ['2026-11-05'],
      ghost: { '2026-11-01': true },
      constructor: { '2026-11-01': true }
    }
  }), TODAY);
  assert.deepStrictEqual(s.habits.map(h => [h.id, h.name, h.created]), [['a', 'Read', '2026-11-01'], ['d', 'Bad created', TODAY], ['e', 'Arr log', TODAY]]);
  assert.deepStrictEqual(s.log.a, { '2026-11-02': true });
  assert.deepStrictEqual(s.log.d, { '2026-11-01': true });
  assert.deepStrictEqual(s.log.e, { '2026-11-05': true });
  assert.strictEqual(s.log.ghost, undefined);
  assert.strictEqual(Object.getPrototypeOf(s.log), Object.prototype);
});
t('loadState: habit ids that match Object.prototype keys are safe', () => {
  const s = api.loadState('{"habits":[{"id":"constructor","name":"x"},{"id":"toString","name":"y"}],"log":{"constructor":["2026-11-01"]}}', TODAY);
  assert.deepStrictEqual(s.habits.map(h => h.id), ['constructor', 'toString']);
  assert.deepStrictEqual(s.log.constructor, { '2026-11-01': true });
  assert.strictEqual(s.log.toString, Object.prototype.toString); // no entry created for a habit with no checks
  // a habit with no checks must still behave as empty through the core helpers
  assert.strictEqual(api.streak(s.log.toString, TODAY), 0);
  assert.strictEqual(api.totalCheckins(s.log.toString, TODAY), 0);
  const p = api.loadState('{"habits":[{"id":"__proto__","name":"x"}],"log":{"__proto__":["2026-11-01"]}}', TODAY);
  assert.deepStrictEqual(p.habits, []);                           // rejected outright
  assert.strictEqual(Object.getPrototypeOf(p.log), Object.prototype);
  assert.strictEqual({}.polluted, undefined);
});
t('loadState round-trips its own output; Unicode survives', () => {
  let habits = api.addHabit([], 'Méditer 🧘 日本', 'x', '2026-11-01');
  let log = api.toggleDay(api.toggleDay({}, 'x', '2026-11-02', TODAY), 'x', TODAY, TODAY);
  const back = api.loadState(JSON.stringify({ habits, log }), TODAY);
  assert.deepStrictEqual(back, { habits, log });
});
t('loadState caps habits and days per habit', () => {
  const habits = Array.from({ length: api.MAX_HABITS + 10 }, (_, i) => ({ id: 'h' + i, name: 'habit ' + i, created: '2020-01-01' }));
  assert.strictEqual(api.loadState(JSON.stringify({ habits, log: {} }), TODAY).habits.length, api.MAX_HABITS);
  const keys = []; let d = TODAY;
  for (let i = 0; i < api.MAX_DAYS + 50; i++) { keys.push(d); d = api.shiftDay(d, -1); }
  const s = api.loadState(JSON.stringify({ habits: [habits[0]], log: { h0: keys } }), TODAY);
  assert.strictEqual(Object.keys(s.log.h0).length, api.MAX_DAYS);
  assert.ok(s.log.h0[TODAY]);                                     // newest days kept
});

console.log(n + ' tests passed');
process.exit(0);
