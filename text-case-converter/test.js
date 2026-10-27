// Run: timeout 60 node text-case-converter/test.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const src = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const core = src.split('// CORE-START')[1].split('// CORE-END')[0];
const api = new Function(core + '; return { tokenize, capitalize, FORMATS, convert };')();

let n = 0;
const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const all = (text) => Object.fromEntries(api.FORMATS.map(f => [f.id, api.convert(text, f.id)]));

t('tokenize: separators, camel, acronyms', () => {
  assert.deepStrictEqual(api.tokenize('hello world'), ['hello', 'world']);
  assert.deepStrictEqual(api.tokenize('helloWorld'), ['hello', 'World']);
  assert.deepStrictEqual(api.tokenize('HelloWorld'), ['Hello', 'World']);
  assert.deepStrictEqual(api.tokenize('parseHTTPResponse'), ['parse', 'HTTP', 'Response']);
  assert.deepStrictEqual(api.tokenize('my_var-name.here/ok'), ['my', 'var', 'name', 'here', 'ok']);
  assert.deepStrictEqual(api.tokenize('  __a--b  '), ['a', 'b']);
  assert.deepStrictEqual(api.tokenize('HTTP'), ['HTTP']);
});
t('empty / whitespace / punctuation-only / null input', () => {
  for (const v of ['', '   ', '\t', '---___', '!!!', null, undefined]) {
    assert.deepStrictEqual(api.tokenize(v), []);
    for (const f of api.FORMATS) assert.strictEqual(api.convert(v, f.id), '');
  }
});
t('all formats from mixed input', () => {
  assert.deepStrictEqual(all('parseHTTPResponse for my_user-id'), {
    camel: 'parseHttpResponseForMyUserId',
    pascal: 'ParseHttpResponseForMyUserId',
    snake: 'parse_http_response_for_my_user_id',
    kebab: 'parse-http-response-for-my-user-id',
    constant: 'PARSE_HTTP_RESPONSE_FOR_MY_USER_ID',
    dot: 'parse.http.response.for.my.user.id',
    title: 'Parse Http Response For My User Id',
    sentence: 'Parse http response for my user id'
  });
});
t('single word', () => {
  assert.strictEqual(api.convert('HELLO', 'camel'), 'hello');
  assert.strictEqual(api.convert('hello', 'pascal'), 'Hello');
  assert.strictEqual(api.convert('hello', 'sentence'), 'Hello');
  assert.strictEqual(api.convert('HELLO', 'title'), 'Hello');
  assert.strictEqual(api.convert('hELLO', 'title'), 'H Ello'); // lower->upper is a camel boundary
});
t('numbers stay attached; not split from letters', () => {
  assert.strictEqual(api.convert('utf8Decode', 'snake'), 'utf8_decode');
  assert.strictEqual(api.convert('version 2 beta', 'camel'), 'version2Beta');
  assert.strictEqual(api.convert('123 abc', 'constant'), '123_ABC');
  assert.strictEqual(api.convert('HTML5Parser', 'kebab'), 'html5-parser');
  assert.strictEqual(api.convert('3.14', 'snake'), '3_14');
});
t('apostrophes dropped inside words (ASCII and curly)', () => {
  assert.strictEqual(api.convert("don't stop", 'snake'), 'dont_stop');
  assert.strictEqual(api.convert('it’s fine', 'title'), 'Its Fine');
});
t('Unicode letters: accents, Greek, Cyrillic, CJK', () => {
  assert.strictEqual(api.convert('café au lait', 'pascal'), 'CaféAuLait');
  assert.strictEqual(api.convert('Ünïcödé Text', 'snake'), 'ünïcödé_text');
  assert.strictEqual(api.convert('élan vital', 'title'), 'Élan Vital');
  assert.strictEqual(api.convert('привет мир', 'title'), 'Привет Мир');
  assert.strictEqual(api.convert('привет мир', 'constant'), 'ПРИВЕТ_МИР');
  assert.strictEqual(api.convert('καλημέρα κόσμε', 'camel'), 'καλημέραΚόσμε');
  assert.strictEqual(api.convert('helloÉcole', 'kebab'), 'hello-école');
  // CJK has no case; words split on whitespace, characters preserved
  assert.strictEqual(api.convert('你好 世界', 'snake'), '你好_世界');
  assert.strictEqual(api.convert('你好 世界', 'title'), '你好 世界');
});
t('Unicode: combining marks stay with their letter', () => {
  const decomposed = 'café latte'; // e + combining acute
  assert.deepStrictEqual(api.tokenize(decomposed), ['café', 'latte']);
  assert.strictEqual(api.convert(decomposed, 'snake'), 'café_latte');
});
t('Unicode: astral characters (surrogate pairs) not corrupted', () => {
  assert.strictEqual(api.capitalize('\u{1D4D0}bc'), '\u{1D4D0}bc'); // math script A: no case mapping
  assert.strictEqual(api.convert('\u{10428}bc def', 'title'), '\u{10400}bc Def'); // Deseret small -> capital
  assert.strictEqual(api.convert('hello \u{1F600} world', 'snake'), 'hello_world'); // emoji is a separator
  assert.strictEqual(api.convert('\u{1F600}', 'snake'), '');
});
t('Unicode: ß and Turkish dotted I do not throw', () => {
  assert.strictEqual(api.convert('straße', 'constant'), 'STRASSE');
  assert.doesNotThrow(() => all('İstanbul ıspanak'));
});
t('multi-line: per line, blank lines and CRLF preserved', () => {
  assert.strictEqual(api.convert('foo bar\n\nbazQux', 'snake'), 'foo_bar\n\nbaz_qux');
  assert.strictEqual(api.convert('a b\r\nc d\re f', 'kebab'), 'a-b\nc-d\ne-f');
  assert.strictEqual(api.convert('x\n', 'snake'), 'x\n');
});
t('idempotent: converting a format\'s output again keeps it', () => {
  for (const f of api.FORMATS) {
    if (f.id === 'title' || f.id === 'sentence') continue; // whitespace-separated: also stable, checked below
    const once = api.convert('parseHTTPResponse for my_user-id 42', f.id);
    assert.strictEqual(api.convert(once, f.id), once, f.id);
  }
  const s = api.convert('one two three', 'sentence'); assert.strictEqual(api.convert(s, 'sentence'), s);
});
t('round trip between formats', () => {
  const snake = api.convert('someVariableName', 'snake');
  assert.strictEqual(api.convert(snake, 'camel'), 'someVariableName');
  assert.strictEqual(api.convert(api.convert(snake, 'constant'), 'kebab'), 'some-variable-name');
});
t('unknown format throws', () => assert.throws(() => api.convert('x', 'nope')));
t('large input is fast', () => {
  const big = Array.from({ length: 20000 }, (_, i) => 'someWord' + i).join(' ');
  const start = Date.now(); api.convert(big, 'snake'); assert(Date.now() - start < 2000);
});

console.log(n + ' tests passed');
process.exit(0);
