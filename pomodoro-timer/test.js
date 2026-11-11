// Run: timeout 60 node pomodoro-timer/test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(core + `; return { DEFAULTS, MAX_HISTORY, MAX_TASKS, MAX_TASK_LEN, sanitizeSettings, phaseSeconds, nextPhase,
  fmtClock, remainingSeconds, fmtNum, fmtMinutes, dayKey, shiftDay, recordSession, todayStats, streak, bestStreak,
  addTask, toggleTask, removeTask, creditTask, loadState };`)();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const S = api.DEFAULTS;
const h = (day, minutes = 25) => ({ day, minutes, task: '', at: 0 });

t('sanitizeSettings: defaults, clamping, rounding, junk', () => {
  assert.deepStrictEqual(api.sanitizeSettings(undefined), S);
  assert.deepStrictEqual(api.sanitizeSettings(null), S);
  assert.deepStrictEqual(api.sanitizeSettings('x'), S);
  assert.deepStrictEqual(api.sanitizeSettings({}), S);
  const r = api.sanitizeSettings({ work: '0', short: 999, long: -5, cycles: 1 });
  assert.deepStrictEqual(r, { work: 1, short: 180, long: 1, cycles: 2 });
  assert.strictEqual(api.sanitizeSettings({ work: '' }).work, 25);
  assert.strictEqual(api.sanitizeSettings({ work: null }).work, 25);
  assert.strictEqual(api.sanitizeSettings({ work: 'abc' }).work, 25);
  assert.strictEqual(api.sanitizeSettings({ work: NaN }).work, 25);
  assert.strictEqual(api.sanitizeSettings({ work: Infinity }).work, 25);
  assert.strictEqual(api.sanitizeSettings({ work: '12.6' }).work, 13);
  assert.strictEqual(api.sanitizeSettings({ cycles: 10 }).cycles, 10);
});
t('phaseSeconds and nextPhase cycle', () => {
  assert.strictEqual(api.phaseSeconds('work', S), 1500);
  assert.strictEqual(api.phaseSeconds('long', S), 900);
  const seq = [];
  let phase = 'work', done = 0;
  for (let i = 0; i < 8; i++) {
    if (phase === 'work') done++;
    phase = api.nextPhase(phase, done, S);
    seq.push(phase);
  }
  assert.deepStrictEqual(seq, ['short', 'work', 'short', 'work', 'short', 'work', 'long', 'work']);
  assert.strictEqual(api.nextPhase('work', 0, S), 'short');
  assert.strictEqual(api.nextPhase('long', 4, S), 'work');
});
t('fmtClock', () => {
  assert.strictEqual(api.fmtClock(1500), '25:00');
  assert.strictEqual(api.fmtClock(0), '00:00');
  assert.strictEqual(api.fmtClock(59), '00:59');
  assert.strictEqual(api.fmtClock(61), '01:01');
  assert.strictEqual(api.fmtClock(10800), '180:00');
  assert.strictEqual(api.fmtClock(0.2), '00:01');
  for (const v of [-5, NaN, undefined, null, 'abc', Infinity]) assert.strictEqual(api.fmtClock(v), '00:00');
});
t('remainingSeconds uses timestamps', () => {
  assert.strictEqual(api.remainingSeconds(10000, 0), 10);
  assert.strictEqual(api.remainingSeconds(10000, 9001), 1);
  assert.strictEqual(api.remainingSeconds(10000, 10000), 0);
  assert.strictEqual(api.remainingSeconds(10000, 99999), 0); // background tab woke up late
});
t('number and minutes formatting', () => {
  assert.strictEqual(api.fmtNum(0), '0');
  assert.strictEqual(api.fmtNum(1234567), '1,234,567');
  assert.strictEqual(api.fmtNum(NaN), '—');
  assert.strictEqual(api.fmtNum('5'), '—');
  assert.strictEqual(api.fmtMinutes(0), '0 min');
  assert.strictEqual(api.fmtMinutes(45), '45 min');
  assert.strictEqual(api.fmtMinutes(60), '1 h');
  assert.strictEqual(api.fmtMinutes(135), '2 h 15 min');
  assert.strictEqual(api.fmtMinutes(60000), '1,000 h');
  assert.strictEqual(api.fmtMinutes(undefined), '0 min');
  assert.strictEqual(api.fmtMinutes(-10), '0 min');
});
t('dayKey and shiftDay across month, year, leap day', () => {
  assert.strictEqual(api.dayKey(new Date(2026, 0, 5)), '2026-01-05');
  assert.strictEqual(api.dayKey(new Date(2026, 11, 31, 23, 59)), '2026-12-31');
  assert.strictEqual(api.shiftDay('2026-03-01', -1), '2026-02-28');
  assert.strictEqual(api.shiftDay('2024-03-01', -1), '2024-02-29');
  assert.strictEqual(api.shiftDay('2026-01-01', -1), '2025-12-31');
  assert.strictEqual(api.shiftDay('2026-12-31', 1), '2027-01-01');
  assert.strictEqual(api.shiftDay('garbage', 1), 'garbage');
  // DST transition weeks (US spring forward / fall back) must not skip or repeat a day
  assert.strictEqual(api.shiftDay('2026-03-09', -1), '2026-03-08');
  assert.strictEqual(api.shiftDay('2026-11-02', -1), '2026-11-01');
});
t('streak: today, yesterday-only, gap, empty', () => {
  const today = '2026-11-11';
  assert.strictEqual(api.streak([], today), 0);
  assert.strictEqual(api.streak(null, today), 0);
  assert.strictEqual(api.streak([h('2026-11-11')], today), 1);
  assert.strictEqual(api.streak([h('2026-11-10'), h('2026-11-09')], today), 2); // none yet today
  assert.strictEqual(api.streak([h('2026-11-11'), h('2026-11-10'), h('2026-11-08')], today), 2); // gap on the 9th
  assert.strictEqual(api.streak([h('2026-11-08')], today), 0);
  assert.strictEqual(api.streak([h('2026-11-11'), h('2026-11-11'), h('2026-11-11')], today), 1);
  assert.strictEqual(api.streak([h('2026-02-28'), h('2026-03-01')], '2026-03-01'), 2);
});
t('bestStreak', () => {
  assert.strictEqual(api.bestStreak([]), 0);
  assert.strictEqual(api.bestStreak([h('2026-11-01'), h('2026-11-02'), h('2026-11-03'), h('2026-11-10'), h('2026-11-11')]), 3);
  assert.strictEqual(api.bestStreak([h('2026-11-03'), h('2026-11-01'), h('2026-11-02')]), 3); // unsorted
  assert.strictEqual(api.bestStreak([h('2026-12-31'), h('2027-01-01')]), 2);
});
t('todayStats and recordSession (immutable, capped)', () => {
  const hist = [h('2026-11-10', 25), h('2026-11-11', 25), h('2026-11-11', 50)];
  assert.deepStrictEqual(api.todayStats(hist, '2026-11-11'), { sessions: 2, minutes: 75 });
  assert.deepStrictEqual(api.todayStats(null, '2026-11-11'), { sessions: 0, minutes: 0 });
  const orig = [h('a')];
  const next = api.recordSession(orig, h('b'));
  assert.strictEqual(orig.length, 1);
  assert.strictEqual(next.length, 2);
  assert.strictEqual(api.recordSession(undefined, h('x')).length, 1);
  let big = [];
  for (let i = 0; i < api.MAX_HISTORY + 5; i++) big = api.recordSession(big, { day: String(i), minutes: 1 });
  assert.strictEqual(big.length, api.MAX_HISTORY);
  assert.strictEqual(big[big.length - 1].day, String(api.MAX_HISTORY + 4)); // newest kept
});
t('tasks: add trims/collapses, rejects empty, Unicode, length cap', () => {
  assert.deepStrictEqual(api.addTask([], '   ', 'a'), []);
  assert.deepStrictEqual(api.addTask([], '', 'a'), []);
  assert.deepStrictEqual(api.addTask([], null, 'a'), []);
  assert.deepStrictEqual(api.addTask(undefined, '  write   report \n', 'a'), [{ id: 'a', text: 'write report', done: false, pomodoros: 0 }]);
  assert.strictEqual(api.addTask([], '日本語のタスク 🍅', 'a')[0].text, '日本語のタスク 🍅');
  const long = api.addTask([], '🍅'.repeat(300), 'a')[0].text;
  assert.strictEqual(Array.from(long).length, api.MAX_TASK_LEN); // cut on code points, no broken surrogate
  assert.ok(!/[\ud800-\udbff]$/.test(long));
  let many = [];
  for (let i = 0; i < api.MAX_TASKS + 3; i++) many = api.addTask(many, 'task ' + i, 'id' + i);
  assert.strictEqual(many.length, api.MAX_TASKS);
});
t('tasks: toggle, remove, credit are immutable and id-scoped', () => {
  const list = api.addTask(api.addTask([], 'one', '1'), 'two', '2');
  const toggled = api.toggleTask(list, '2');
  assert.strictEqual(toggled[1].done, true);
  assert.strictEqual(list[1].done, false);
  assert.strictEqual(api.toggleTask(toggled, '2')[1].done, false);
  assert.strictEqual(api.creditTask(list, '1')[0].pomodoros, 1);
  assert.strictEqual(api.creditTask(list, 'zzz')[0].pomodoros, 0);
  assert.deepStrictEqual(api.removeTask(list, '1').map(x => x.id), ['2']);
  assert.strictEqual(api.removeTask(list, 'nope').length, 2);
});
t('loadState: null, corrupt JSON, wrong types', () => {
  for (const v of [null, undefined, '', 'not json', '42', '"str"', 'null', '[]', '{']) {
    const s = api.loadState(v);
    assert.deepStrictEqual(s.settings, S);
    assert.deepStrictEqual(s.tasks, []);
    assert.deepStrictEqual(s.history, []);
    assert.strictEqual(s.activeId, null);
  }
});
t('loadState: filters bad entries, keeps good ones, validates activeId', () => {
  const s = api.loadState(JSON.stringify({
    settings: { work: 50, short: 'x' },
    tasks: [{ id: 't1', text: 'ok', done: true, pomodoros: 3 }, { id: 5, text: 'bad id' }, null, { id: 't2', text: 'neg', pomodoros: -4 }, 'str'],
    history: [{ day: '2026-11-11', minutes: 25, task: 'ok', at: 1 }, { day: 'yesterday', minutes: 25 }, { day: '2026-11-10', minutes: 'abc' }, null],
    activeId: 't1'
  }));
  assert.strictEqual(s.settings.work, 50);
  assert.strictEqual(s.settings.short, 5);
  assert.deepStrictEqual(s.tasks.map(x => x.id), ['t1', 't2']);
  assert.strictEqual(s.tasks[0].done, true);
  assert.strictEqual(s.tasks[1].pomodoros, 0);
  assert.strictEqual(s.history.length, 1);
  assert.strictEqual(s.activeId, 't1');
  assert.strictEqual(api.loadState(JSON.stringify({ tasks: [], activeId: 'ghost' })).activeId, null);
});
t('loadState: round-trips its own output; Unicode survives', () => {
  const state = { settings: { work: 30, short: 7, long: 20, cycles: 3 }, tasks: api.addTask([], 'café ☕ 日本', 'x'), history: [h('2026-11-11')], activeId: 'x' };
  const back = api.loadState(JSON.stringify(state));
  assert.deepStrictEqual(back.settings, state.settings);
  assert.strictEqual(back.tasks[0].text, 'café ☕ 日本');
  assert.strictEqual(back.activeId, 'x');
});

console.log(n + ' tests passed');
process.exit(0);
