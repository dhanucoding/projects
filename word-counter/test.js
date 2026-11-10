// Run: timeout 60 node word-counter/test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(core + '; return { words, graphemes, sentenceCount, paragraphCount, lineCount, syllables, duration, fmt, analyze };')();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

t('empty / whitespace / null input', () => {
  for (const v of ['', '   ', '\n\n\t', null, undefined]) {
    const r = api.analyze(v);
    assert.strictEqual(r.words, 0);
    assert.strictEqual(r.sentences, 0);
    assert.strictEqual(r.paragraphs, 0);
    assert.strictEqual(r.unique, 0);
    assert.strictEqual(r.flesch, null);
    assert.strictEqual(r.grade, null);
    assert.strictEqual(r.avgWordLength, null);
    assert.strictEqual(r.longestWord, '');
  }
  assert.strictEqual(api.analyze('').lines, 0);
  assert.strictEqual(api.analyze('   ').characters, 3);
  assert.strictEqual(api.analyze('   ').charactersNoSpaces, 0);
});
t('basic counts', () => {
  const r = api.analyze('The cat sat. The dog ran!');
  assert.strictEqual(r.words, 6);
  assert.strictEqual(r.sentences, 2);
  assert.strictEqual(r.unique, 5);
  assert.strictEqual(r.characters, 25);
  assert.strictEqual(r.charactersNoSpaces, 20);
  assert.strictEqual(r.longestWord, 'The');
});
t('contractions, hyphens, numbers stay sensible', () => {
  assert.strictEqual(api.words("don't stop").length, 2);
  assert.strictEqual(api.words('it’s fine').length, 2);
  assert.strictEqual(api.words('Pay $1,000.50 now').length, 3);
  assert.strictEqual(api.words('3.14 is pi').length, 3);
  assert.strictEqual(api.words('!!! --- ...').length, 0);
});
t('sentences: abbreviations, decimals, ellipsis, no terminator', () => {
  assert.strictEqual(api.sentenceCount('Dr. Smith met Mr. Jones. They talked.'), 2);
  assert.strictEqual(api.sentenceCount('Pi is 3.14 roughly. Yes.'), 2);
  assert.strictEqual(api.sentenceCount('Use tools, e.g. a hammer. Then rest.'), 2);
  assert.strictEqual(api.sentenceCount('Wait... what?! Really.'), 3);
  assert.strictEqual(api.sentenceCount('no terminator here'), 1);
  assert.strictEqual(api.sentenceCount('...'), 0);
  assert.strictEqual(api.sentenceCount('He said "Stop." Then left.'), 2);
});
t('paragraphs and lines (CRLF, blank lines)', () => {
  assert.strictEqual(api.paragraphCount('a\n\nb\n\n\nc'), 3);
  assert.strictEqual(api.paragraphCount('a\r\n\r\nb'), 2);
  assert.strictEqual(api.paragraphCount('a\nb'), 1);
  assert.strictEqual(api.lineCount('a\nb\r\nc\rd'), 4);
  assert.strictEqual(api.lineCount('a\n'), 2);
});
t('Unicode: accents, Cyrillic, CJK, emoji, combining marks', () => {
  assert.strictEqual(api.analyze('café au lait').words, 3);
  assert.strictEqual(api.analyze('Привет мир').words, 2);
  assert.ok(api.analyze('今日は天気がいいです。').words >= 2);
  assert.strictEqual(api.analyze('今日は天気がいいです。明日も晴れ。').sentences, 2);
  assert.strictEqual(api.analyze('👨‍👩‍👧').characters, 1);          // ZWJ family = one grapheme
  assert.strictEqual(api.analyze('é').characters, 1);          // e + combining acute
  assert.strictEqual(api.analyze('hello 😀 world').words, 2);        // emoji is not a word
  assert.strictEqual(api.analyze('Ünïcödé Text').unique, 2);
});
t('case-insensitive unique words', () => {
  assert.strictEqual(api.analyze('Word word WORD').unique, 1);
});
t('syllable heuristic', () => {
  const cases = { cat: 1, the: 1, make: 1, table: 2, reading: 2, beautiful: 3, wanted: 2, jumped: 1, readability: 5, 'café': 2, 2024: 1 };
  for (const [w, s] of Object.entries(cases)) assert.strictEqual(api.syllables(String(w)), s, w);
  assert.strictEqual(api.syllables(''), 0);
});
t('readability: easy vs hard text, known Flesch value', () => {
  const easy = api.analyze('The cat sat on the mat. The dog ran to the log.');
  // 12 words, 2 sentences, 12 syllables: 206.835 - 1.015*6 - 84.6*1 = 116.1
  assert.strictEqual(easy.flesch, 116.1);
  assert.strictEqual(easy.ease, 'Very easy');
  assert.ok(easy.grade < 0);
  const hard = api.analyze('Notwithstanding considerable organizational complexities, interdepartmental collaboration necessitates comprehensive methodological standardization.');
  assert.ok(hard.flesch < 0 && hard.grade > 20, JSON.stringify(hard));
  assert.strictEqual(hard.ease, 'Very difficult');
});
t('readability skipped for non-Latin text, kept for mixed majority-Latin', () => {
  const ja = api.analyze('今日は天気がいいです。');
  assert.strictEqual(ja.flesch, null);
  assert.strictEqual(ja.grade, null);
  const ru = api.analyze('Привет мир. Как дела?');
  assert.strictEqual(ru.flesch, null);
  assert.notStrictEqual(api.analyze('Hello world 世界. Fine day.').flesch, null);
});
t('numbers-only text does not break readability', () => {
  const r = api.analyze('12345 67890');
  assert.strictEqual(r.words, 2);
  assert.ok(Number.isFinite(r.flesch));
});
t('time formatting', () => {
  assert.strictEqual(api.duration(0), '0 sec');
  assert.strictEqual(api.duration(59.6), '1 min');
  assert.strictEqual(api.duration(45), '45 sec');
  assert.strictEqual(api.duration(60), '1 min');
  assert.strictEqual(api.duration(200), '3 min 20 sec');
  assert.strictEqual(api.analyze('word '.repeat(238)).readSeconds, 60);
  assert.strictEqual(api.analyze('word '.repeat(150)).speakSeconds, 60);
});
t('number formatting uses en-US grouping, guards non-finite', () => {
  assert.strictEqual(api.fmt(0), '0');
  assert.strictEqual(api.fmt(1234567), '1,234,567');
  assert.strictEqual(api.fmt(NaN), '—');
  assert.strictEqual(api.fmt(null), '—');
  assert.strictEqual(api.fmt(Infinity), '—');
  assert.strictEqual(api.analyze('a '.repeat(1500)).words, 1500);
});
t('average word length and longest word', () => {
  const r = api.analyze('a bb cccc');
  assert.strictEqual(r.avgWordLength, 2.3);
  assert.strictEqual(r.longestWord, 'cccc');
});
t('large input is fast', () => {
  const big = 'The quick brown fox jumps over the lazy dog. '.repeat(20000);
  const start = Date.now();
  const r = api.analyze(big);
  assert.strictEqual(r.words, 180000);
  assert.strictEqual(r.sentences, 20000);
  assert.ok(Date.now() - start < 5000, 'took ' + (Date.now() - start) + 'ms');
});

console.log(n + ' tests passed');
process.exit(0);
