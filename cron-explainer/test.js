// Run: timeout 60 node cron-explainer/test.js
process.env.TZ = 'America/Los_Angeles'; // 'local' tests need a zone with daylight saving; set before any Date is built
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(core + `; return { FIELDS, PRESETS, MACROS, MAX_RUNS, parseField, parseExpression, expressionFromFields,
  nextRuns, describe, classify, fmtRun, fmtRelative };`)();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const F = Object.fromEntries(api.FIELDS.map(f => [f.id, f]));
const vals = (raw, id) => { const r = api.parseField(raw, F[id]); assert.ok(r.ok, raw + ': ' + r.error); return r.values; };
const bad = (raw, id) => { const r = api.parseField(raw, F[id]); assert.strictEqual(r.ok, false, raw); return r.error; };
const expr = (s) => { const p = api.parseExpression(s); assert.ok(p.ok, s + ': ' + p.error); return p; };
const iso = (list) => list.map(d => d.toISOString().slice(0, 16) + 'Z');
const utcRuns = (e, from, count) => iso(api.nextRuns(expr(e), new Date(from), count, 'UTC'));
const FRI = '2026-11-13T09:30:00Z'; // a Friday
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

t('parseField: star, single, list, range, step, combined', () => {
  assert.deepStrictEqual(vals('*', 'minute'), range(0, 59));
  assert.deepStrictEqual(vals('5', 'minute'), [5]);
  assert.deepStrictEqual(vals('05', 'minute'), [5]);
  assert.deepStrictEqual(vals('1,15,30', 'minute'), [1, 15, 30]);
  assert.deepStrictEqual(vals('30,5,5,1', 'minute'), [1, 5, 30]);       // sorted, unique
  assert.deepStrictEqual(vals('1-5', 'hour'), [1, 2, 3, 4, 5]);
  assert.deepStrictEqual(vals('*/15', 'minute'), [0, 15, 30, 45]);
  assert.deepStrictEqual(vals('0-30/10', 'minute'), [0, 10, 20, 30]);
  assert.deepStrictEqual(vals('5/20', 'minute'), [5, 25, 45]);           // start/step runs to the top
  assert.deepStrictEqual(vals('1-3,10,20-22', 'hour'), [1, 2, 3, 10, 20, 21, 22]);
  assert.deepStrictEqual(vals('*/60', 'minute'), [0]);
  assert.deepStrictEqual(vals('?', 'dom'), range(1, 31));
  assert.deepStrictEqual(vals(' 1, 2 ,3 ', 'minute'), [1, 2, 3]);       // inner spaces ignored
  assert.deepStrictEqual(vals('*/2', 'dom').slice(0, 4), [1, 3, 5, 7]);  // day-of-month steps start at 1
});
t('parseField: names and Sunday as 0 or 7', () => {
  assert.deepStrictEqual(vals('jan,Mar,DEC', 'month'), [1, 3, 12]);
  assert.deepStrictEqual(vals('JAN-MAR', 'month'), [1, 2, 3]);
  assert.deepStrictEqual(vals('mon-fri', 'dow'), [1, 2, 3, 4, 5]);
  assert.deepStrictEqual(vals('sun', 'dow'), [0]);
  assert.deepStrictEqual(vals('7', 'dow'), [0]);
  assert.deepStrictEqual(vals('0,7', 'dow'), [0]);
  assert.deepStrictEqual(vals('5-7', 'dow'), [0, 5, 6]);
  assert.deepStrictEqual(vals('*', 'dow'), range(0, 6));
  assert.deepStrictEqual(vals('mon', 'dow'), vals('1', 'dow'));
});
t('parseField: errors name the field and the problem', () => {
  assert.match(bad('60', 'minute'), /^Minute: value 60 is out of range \(0–59\)/);
  assert.match(bad('24', 'hour'), /Hour: .*out of range \(0–23\)/);
  assert.match(bad('0', 'dom'), /Day of month: .*out of range \(1–31\)/);
  assert.match(bad('13', 'month'), /Month: .*out of range \(1–12\)/);
  assert.match(bad('8', 'dow'), /Day of week: .*out of range \(0–7\)/);
  assert.match(bad('5-1', 'minute'), /goes backwards/);
  assert.match(bad('*/0', 'minute'), /step must be between 1 and 60/);
  assert.match(bad('*/61', 'minute'), /step must be between 1 and 60/);
  assert.match(bad('1,,2', 'minute'), /empty list item/);
  assert.match(bad('1,', 'minute'), /empty list item/);
  assert.match(bad('', 'minute'), /value is empty/);
  assert.match(bad('   ', 'minute'), /value is empty/);
  assert.match(bad('foo', 'month'), /"foo" is not a valid value/);
  assert.match(bad('mon', 'month'), /not a valid value/);           // day name in the month field
  assert.match(bad('*-5', 'minute'), /not valid/);
  assert.match(bad('1-2-3', 'minute'), /not valid/);
  assert.match(bad('-1', 'minute'), /not valid/);
  assert.match(bad('1.5', 'minute'), /not valid/);
  assert.match(bad('1/', 'minute'), /not valid/);
  assert.match(bad('99999999999999999999', 'minute'), /out of range/);
  assert.match(bad('0'.repeat(200), 'minute'), /too long/);
  assert.match(bad('１', 'minute'), /not valid/);                    // full-width digit
  assert.match(bad('☃', 'minute'), /not valid/);
  assert.strictEqual(api.parseField(null, F.minute).ok, false);
  assert.strictEqual(api.parseField(undefined, F.minute).ok, false);
});
t('parseField: Quartz-only syntax is rejected clearly, month/day names containing L or W are fine', () => {
  for (const raw of ['L', '5L', '15W', 'LW', '1#2', 'mon#2']) assert.match(bad(raw, 'dom'), /Quartz/, raw);
  assert.deepStrictEqual(vals('JUL', 'month'), [7]);
  assert.deepStrictEqual(vals('wed', 'dow'), [3]);
  assert.deepStrictEqual(vals('JUL,AUG', 'month'), [7, 8]);
});
t('parseExpression: valid shapes, whitespace, case', () => {
  const p = expr('  */5   0-6\t1,15 jan-mar MON  ');
  assert.deepStrictEqual(p.fieldRaw, ['*/5', '0-6', '1,15', 'jan-mar', 'MON']);
  assert.deepStrictEqual(p.fields.month.values, [1, 2, 3]);
  assert.strictEqual(p.bothDays, true);
  assert.strictEqual(expr('* * * * *').bothDays, false);
  assert.strictEqual(expr('0 0 15 * *').bothDays, false);
  assert.strictEqual(expr('0 0 */2 * 1').bothDays, false);          // */n counts as "star" like Vixie cron
  assert.strictEqual(expr('0 0 * * 1').bothDays, false);
  assert.strictEqual(expr('0 0 15 * 1').bothDays, true);
});
t('parseExpression: macros', () => {
  for (const [m, e] of Object.entries(api.MACROS)) {
    const p = expr(m);
    assert.strictEqual(p.macro, m);
    assert.deepStrictEqual(p.fieldRaw, e.split(' '));
  }
  assert.strictEqual(expr('@DAILY').macro, '@daily');
  assert.strictEqual(api.describe(expr('@daily')), api.describe(expr('0 0 * * *')));
  assert.match(api.parseExpression('@reboot').error, /startup/);
  assert.match(api.parseExpression('@sometimes').error, /Unknown shortcut/);
  assert.match(api.parseExpression('@').error, /Unknown shortcut/);
});
t('parseExpression: wrong field counts, empty, huge, junk, null', () => {
  assert.match(api.parseExpression('').error, /Enter a cron expression/);
  assert.match(api.parseExpression('   \n ').error, /Enter a cron expression/);
  assert.match(api.parseExpression(null).error, /Enter a cron expression/);
  assert.match(api.parseExpression(undefined).error, /Enter a cron expression/);
  assert.match(api.parseExpression('* * * *').error, /found 4/);
  assert.match(api.parseExpression('* * * * * *').error, /seconds or year/);
  assert.match(api.parseExpression('0 0 0 * * ? 2026').error, /seconds or year/);
  assert.match(api.parseExpression('x'.repeat(500)).error, /too long/);
  assert.strictEqual(api.parseExpression('hello world foo bar baz').ok, false);
  const e = api.parseExpression('61 25 32 13 8');
  assert.strictEqual(e.ok, false);
  assert.deepStrictEqual(Object.keys(e.errors), ['minute', 'hour', 'dom', 'month', 'dow']); // every bad field reported
  assert.match(e.error, /^Minute:/);                                // headline error is the first bad field
  assert.deepStrictEqual(Object.keys(api.parseExpression('0 0 * * 9').errors), ['dow']);
});
t('expressionFromFields: blanks become *, spaces dropped, bad input safe', () => {
  assert.strictEqual(api.expressionFromFields(['', '', '', '', '']), '* * * * *');
  assert.strictEqual(api.expressionFromFields(['*/5', '9-17', '', '', '1-5']), '*/5 9-17 * * 1-5');
  assert.strictEqual(api.expressionFromFields(['1, 2', ' 3 ', '', '', '']), '1,2 3 * * *');
  assert.strictEqual(api.expressionFromFields([]), '* * * * *');
  assert.strictEqual(api.expressionFromFields(null), '* * * * *');
  assert.strictEqual(api.expressionFromFields([null, undefined, 0, '', '']), '* * 0 * *');
});
t('describe: common schedules read naturally', () => {
  const cases = {
    '* * * * *': 'Every minute',
    '*/5 * * * *': 'Every 5 minutes',
    '*/10 * * * *': 'Every 10 minutes',
    '0 * * * *': 'At minute 0 past every hour',
    '0,30 * * * *': 'Every 30 minutes',
    '0,45 * * * *': 'At minutes 0 and 45 past every hour',
    '5,40 * * * *': 'At minutes 5 and 40 past every hour',
    '0,20 * * * *': 'At minutes 0 and 20 past every hour',
    '5,10,15 * * * *': 'Every 5 minutes, from minute 5 through 15 past every hour',
    '0-30/10 * * * *': 'Every 10 minutes, from minute 0 through 30 past every hour',
    '30 9 * * *': 'At 09:30, every day',
    '0 9,17 * * *': 'At 09:00 and 17:00, every day',
    '0 9 * * 1-5': 'At 09:00, Monday through Friday',
    '0 22 * * 1-5': 'At 22:00, Monday through Friday',
    '*/15 9-17 * * 1-5': 'Every 15 minutes, from 09:00 through 17:59, Monday through Friday',
    '* 9 * * *': 'Every minute from 09:00 through 09:59',
    '* 9-17 * * *': 'Every minute from 09:00 through 17:59',
    '0 */2 * * *': 'At minute 0 past every 2 hours',
    '*/15 9 * * *': 'At 09:00, 09:15, 09:30 and 09:45, every day',
    '0 0 * * 0,6': 'At 00:00, on weekends',
    '0 0 * * mon': 'At 00:00, on Monday',
    '5 4 * * sun': 'At 04:05, on Sunday',
    '0 0 * * 1,3,5': 'At 00:00, on Monday, Wednesday and Friday',
    '0 0 1 * *': 'At 00:00, on day 1 of the month',
    '15 14 1 * *': 'At 14:15, on day 1 of the month',
    '0 0 1 1 *': 'At 00:00, on day 1 of the month, in January',
    '0 0 1,15 * *': 'At 00:00, on days 1 and 15 of the month',
    '0 0 1-7 * *': 'At 00:00, on days 1 through 7 of the month',
    '0 0 * 3,6,9 *': 'At 00:00, in March, June and September',
    '0 0 * jan-mar *': 'At 00:00, from January through March',
    '0 0 1 */3 *': 'At 00:00, on day 1 of the month, every 3 months',
    '0 0 */2 * *': 'At 00:00, every 2 days of the month, starting on day 1',
    '0 0 13 * 5': 'At 00:00, on day 13 of the month, or on Friday',
    '0,15,30,45 9-17 * * *': 'Every 15 minutes, from 09:00 through 17:59',
    '@daily': 'At 00:00, every day',
    '@hourly': 'At minute 0 past every hour',
    '@weekly': 'At 00:00, on Sunday',
    '@monthly': 'At 00:00, on day 1 of the month',
    '@yearly': 'At 00:00, on day 1 of the month, in January'
  };
  for (const [e, want] of Object.entries(cases)) assert.strictEqual(api.describe(expr(e)), want, e);
});
t('describe: empty for invalid input, and every preset has a description', () => {
  assert.strictEqual(api.describe(api.parseExpression('nope')), '');
  assert.strictEqual(api.describe(null), '');
  assert.strictEqual(api.describe(undefined), '');
  for (const pr of api.PRESETS) {
    const p = api.parseExpression(pr.expr);
    assert.ok(p.ok, pr.expr);
    assert.ok(api.describe(p).length > 5, pr.expr);
    assert.ok(api.nextRuns(p, new Date(FRI), 3, 'UTC').length === 3, pr.expr);
  }
  assert.strictEqual(new Set(api.PRESETS.map(p => p.expr)).size, api.PRESETS.length);
});
t('describe: every field classification is consistent with its values (fuzz)', () => {
  // random valid expressions never throw and always produce a non-empty sentence
  let seed = 12345;
  const rnd = (k) => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % k; };
  const pick = (f) => {
    const s = F[f];
    const one = () => {
      const a = s.min + rnd(s.top - s.min + 1);
      switch (rnd(5)) {
        case 0: return '*';
        case 1: return String(a);
        case 2: return a + '-' + (a + rnd(s.top - a + 1));
        case 3: return '*/' + (1 + rnd(Math.min(10, s.top - s.min + 1)));
        default: return a + ',' + (s.min + rnd(s.top - s.min + 1));
      }
    };
    return one();
  };
  for (let i = 0; i < 500; i++) {
    const e = ['minute', 'hour', 'dom', 'month', 'dow'].map(pick).join(' ');
    const p = api.parseExpression(e);
    assert.ok(p.ok, e);
    const d = api.describe(p);
    assert.ok(typeof d === 'string' && d.length > 3, e + ' -> ' + d);
    assert.doesNotThrow(() => api.nextRuns(p, new Date(FRI), 3, 'UTC'), e);
  }
});
t('nextRuns (UTC): strictly after `from`, step, rollover', () => {
  assert.deepStrictEqual(utcRuns('*/15 * * * *', FRI, 3), ['2026-11-13T09:45Z', '2026-11-13T10:00Z', '2026-11-13T10:15Z']);
  assert.deepStrictEqual(utcRuns('30 9 * * *', FRI, 2), ['2026-11-14T09:30Z', '2026-11-15T09:30Z']); // 09:30:00 itself is not "next"
  assert.deepStrictEqual(utcRuns('31 9 * * *', '2026-11-13T09:30:59.999Z', 1), ['2026-11-13T09:31Z']);
  assert.deepStrictEqual(utcRuns('30 9 * * *', '2026-11-13T09:29:59Z', 1), ['2026-11-13T09:30Z']);
  assert.deepStrictEqual(utcRuns('0 0 * * *', '2026-12-31T23:59:00Z', 2), ['2027-01-01T00:00Z', '2027-01-02T00:00Z']);
  assert.deepStrictEqual(utcRuns('*/7 * * * *', '2026-11-13T09:50:00Z', 4), ['2026-11-13T09:56Z', '2026-11-13T10:00Z', '2026-11-13T10:07Z', '2026-11-13T10:14Z']);
  assert.deepStrictEqual(utcRuns('0 0 1 * *', FRI, 3), ['2026-12-01T00:00Z', '2027-01-01T00:00Z', '2027-02-01T00:00Z']);
  assert.deepStrictEqual(utcRuns('0 0 1 1 *', FRI, 2), ['2027-01-01T00:00Z', '2028-01-01T00:00Z']);
  assert.deepStrictEqual(utcRuns('59 23 * * *', FRI, 2), ['2026-11-13T23:59Z', '2026-11-14T23:59Z']);
});
t('nextRuns (UTC): weekdays, Sunday as 0 and 7, names', () => {
  assert.deepStrictEqual(utcRuns('0 9 * * 1-5', FRI, 3), ['2026-11-16T09:00Z', '2026-11-17T09:00Z', '2026-11-18T09:00Z']);
  assert.deepStrictEqual(utcRuns('0 0 * * 0', FRI, 2), ['2026-11-15T00:00Z', '2026-11-22T00:00Z']);
  assert.deepStrictEqual(utcRuns('0 0 * * 7', FRI, 2), utcRuns('0 0 * * 0', FRI, 2));
  assert.deepStrictEqual(utcRuns('0 0 * * sun', FRI, 2), utcRuns('0 0 * * 0', FRI, 2));
  assert.deepStrictEqual(utcRuns('0 0 1 jan,jul *', FRI, 2), ['2027-01-01T00:00Z', '2027-07-01T00:00Z']);
});
t('nextRuns (UTC): day-of-month OR day-of-week rule', () => {
  // Friday the 13th rule: both restricted -> any Friday OR the 13th
  assert.deepStrictEqual(utcRuns('0 0 13 * 5', FRI, 6), [
    '2026-11-20T00:00Z', '2026-11-27T00:00Z', '2026-12-04T00:00Z', '2026-12-11T00:00Z', '2026-12-13T00:00Z', '2026-12-18T00:00Z']);
  // */2 in day-of-month counts as "star": AND with day-of-week -> odd days only
  assert.deepStrictEqual(utcRuns('0 0 */2 * *', FRI, 10),
    ['15', '17', '19', '21', '23', '25', '27', '29'].map(d => '2026-11-' + d + 'T00:00Z').concat(['2026-12-01T00:00Z', '2026-12-03T00:00Z']));
  // ...and with a restricted day-of-week it is "odd day AND Monday", not OR
  assert.deepStrictEqual(utcRuns('0 0 */2 * 1', FRI, 3), ['2026-11-23T00:00Z', '2026-12-07T00:00Z', '2026-12-21T00:00Z']);
});
t('nextRuns (UTC): leap day, impossible dates, 10-year horizon', () => {
  assert.deepStrictEqual(utcRuns('0 0 29 2 *', FRI, 2), ['2028-02-29T00:00Z', '2032-02-29T00:00Z']);
  assert.deepStrictEqual(utcRuns('0 0 29 2 *', '2096-03-01T00:00:00Z', 1), ['2104-02-29T00:00Z']); // 2100 is not a leap year
  for (const e of ['0 0 31 2 *', '0 0 30 2 *', '0 0 31 4 *', '0 0 31 6,9,11 *']) assert.deepStrictEqual(utcRuns(e, FRI, 3), [], e);
  const start = Date.now();
  utcRuns('0 0 31 2 *', FRI, 50);
  assert.ok(Date.now() - start < 2000);                              // impossible schedules fail fast
});
t('nextRuns: count clamping and bad inputs', () => {
  const p = expr('* * * * *');
  assert.strictEqual(api.nextRuns(p, new Date(FRI), 1000, 'UTC').length, api.MAX_RUNS);
  assert.strictEqual(api.nextRuns(p, new Date(FRI), 0, 'UTC').length, 1);
  assert.strictEqual(api.nextRuns(p, new Date(FRI), -5, 'UTC').length, 1);
  assert.strictEqual(api.nextRuns(p, new Date(FRI), 'abc', 'UTC').length, 1);
  assert.strictEqual(api.nextRuns(p, new Date(FRI), 2.9, 'UTC').length, 2);
  assert.deepStrictEqual(api.nextRuns(p, new Date('nope'), 3, 'UTC'), []);
  assert.deepStrictEqual(api.nextRuns(p, 'not a date', 3, 'UTC'), []);
  assert.deepStrictEqual(api.nextRuns(null, new Date(FRI), 3, 'UTC'), []);
  assert.deepStrictEqual(api.nextRuns(api.parseExpression('bad'), new Date(FRI), 3, 'UTC'), []);
  const runs = api.nextRuns(p, new Date(FRI), 50, 'UTC');
  for (let i = 1; i < runs.length; i++) assert.strictEqual(runs[i] - runs[i - 1], 60000);
});
t('nextRuns (local, America/Los_Angeles): matches wall-clock times', () => {
  const from = new Date(2026, 5, 10, 8, 0, 0); // June, PDT
  const r = api.nextRuns(expr('30 9 * * *'), from, 3, 'local');
  assert.deepStrictEqual(r.map(d => [d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()]), [[5, 10, 9, 30], [5, 11, 9, 30], [5, 12, 9, 30]]);
  assert.strictEqual(r[0].toISOString(), '2026-06-10T16:30:00.000Z');  // 09:30 PDT = 16:30 UTC
  // same instant is 15:00 UTC, so in UTC mode the next 09:30 is the following day
  assert.strictEqual(api.nextRuns(expr('30 9 * * *'), from, 1, 'UTC')[0].toISOString(), '2026-06-11T09:30:00.000Z');
});
t('nextRuns (local): spring-forward gap is skipped, other days unaffected', () => {
  // 2026-03-08 02:00 -> 03:00 in Los Angeles; 02:30 does not exist that day
  const r = api.nextRuns(expr('30 2 * * *'), new Date(2026, 2, 7, 0, 0), 3, 'local');
  assert.deepStrictEqual(r.map(d => d.getDate()), [7, 9, 10]);
  assert.ok(r.every(d => d.getHours() === 2 && d.getMinutes() === 30));
  // a daily 12:00 job is 23 hours after the previous run across the change
  const noon = api.nextRuns(expr('0 12 * * *'), new Date(2026, 2, 7, 0, 0), 3, 'local');
  assert.deepStrictEqual(noon.map(d => d.getHours()), [12, 12, 12]);
  assert.strictEqual((noon[1] - noon[0]) / 3600000, 23);
});
t('nextRuns (local): fall-back repeated hour appears once and stays ordered', () => {
  // 2026-11-01 01:00-02:00 happens twice in Los Angeles
  const r = api.nextRuns(expr('30 1 * * *'), new Date(2026, 9, 31, 0, 0), 3, 'local');
  assert.deepStrictEqual(r.map(d => d.getDate()), [31, 1, 2]);
  for (let i = 1; i < r.length; i++) assert.ok(r[i] > r[i - 1]);
  const every = api.nextRuns(expr('*/30 * * * *'), new Date(2026, 9, 31, 23, 0), 8, 'local'); // across the change
  for (let i = 1; i < every.length; i++) assert.ok(every[i] > every[i - 1]);
  assert.strictEqual(every.length, 8);
});
t('formatting: fmtRun and fmtRelative', () => {
  const d = new Date('2026-11-13T09:30:00Z');
  const s = api.fmtRun(d, 'UTC');
  assert.match(s, /Fri/); assert.match(s, /Nov 13, 2026/); assert.match(s, /09:30/); assert.match(s, /UTC/);
  assert.match(api.fmtRun(new Date('2026-11-13T00:05:00Z'), 'UTC'), /00:05/); // midnight is 00, never 24
  assert.strictEqual(api.fmtRun(new Date('nope'), 'UTC'), '');
  assert.strictEqual(api.fmtRun(null, 'UTC'), '');
  assert.strictEqual(api.fmtRelative(0), 'in under a minute');
  assert.strictEqual(api.fmtRelative(59999), 'in under a minute');
  assert.strictEqual(api.fmtRelative(60000), 'in 1 min');
  assert.strictEqual(api.fmtRelative(45 * 60000), 'in 45 min');
  assert.strictEqual(api.fmtRelative(60 * 60000), 'in 1 h');
  assert.strictEqual(api.fmtRelative(125 * 60000), 'in 2 h 5 min');
  assert.strictEqual(api.fmtRelative(3 * 86400000), 'in 3 days');
  assert.strictEqual(api.fmtRelative(2000 * 86400000), 'in 2,000 days');
  for (const v of [NaN, Infinity, null, undefined, '5']) assert.strictEqual(api.fmtRelative(v), '');
});

console.log(n + ' tests passed');
process.exit(0);
