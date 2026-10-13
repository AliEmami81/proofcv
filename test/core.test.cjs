const test = require('node:test');
const assert = require('node:assert/strict');
const cv = require('../core.js');
const sample = { basics: { name: 'Ada Example', summary: 'Builds React interfaces.' }, work: [{ name: 'Example', position: 'Developer', highlights: ['Added Playwright tests.', 'Maintained CSS layouts.', 'Built a React view using TypeScript.'] }], skills: [{ name: 'Tools', keywords: ['C++', 'Git'] }] };
test('validation clones input, preserves unsupported JSON sections and rejects malformed supported fields', () => {
  const input = { ...sample, awards: [{ title: 'Example award' }] }, result = cv.validate(input);
  result.basics.name = 'Changed'; assert.equal(input.basics.name, 'Ada Example'); assert.deepEqual(result.awards, input.awards);
  for (const bad of [null, [], { basics: [] }, { basics: { name: 2 } }, { basics: {}, work: [{}], skills: 'a' }, { basics: {}, work: [{ highlights: [2] }] }]) assert.throws(() => cv.validate(bad));
});
test('literal term matching handles aliases and punctuation without substring collisions', () => {
  assert.deepEqual(cv.terms('C++ C# Python JavaScript React TypeScript'), ['JavaScript', 'TypeScript', 'Python', 'C++', 'C#', 'React']);
  assert.ok(!cv.terms('JavaScript').includes('Java'));
  assert.ok(!cv.terms('reactive statement gitlab').includes('React'));
  assert.ok(!cv.terms('reactive statement gitlab').includes('Git'));
  assert.ok(cv.terms('CPP and k8s, nodejs').includes('C++'));
});
test('job coverage has exact original source paths and absent skills stay absent', () => {
  const r = cv.analyze(sample, 'React Playwright Docker');
  assert.equal(r.total, 3); assert.equal(r.matched, 2); assert.equal(r.coverage, 67);
  assert.equal(r.requirements.find(x => x.term === 'Playwright').sources[0].path, 'work[0].highlights[0]');
  assert.deepEqual(r.requirements.find(x => x.term === 'Docker').sources, []);
});
test('excluded bullets are excluded from coverage evidence', () => {
  const r = cv.analyze(sample, 'Playwright', ['work[0].highlights[0]']);
  assert.equal(r.matched, 0); assert.equal(r.coverage, 0);
  assert.equal(cv.analyze(sample, 'Unrecognized custom term').coverage, null);
  assert.throws(() => cv.analyze(sample, 'x'.repeat(30001)));
});
test('focus sorting reorders exact wording without rewriting or mutating the source profile', () => {
  const before = JSON.stringify(sample), html = cv.resumeMarkup(sample, { job: 'React TypeScript', focus: true });
  assert.ok(html.indexOf('Built a React view') < html.indexOf('Added Playwright tests.'));
  assert.equal(JSON.stringify(sample), before);
  const bullets = cv.rankedBullets(sample, 'Docker'); assert.ok(bullets.every(b => b.matches.length === 0));
});
test('excluded bullets disappear from the rendered export but remain in the source profile', () => {
  const html = cv.exportHtml(sample, { excluded: ['work[0].highlights[1]'] });
  assert.ok(!html.includes('Maintained CSS layouts.')); assert.ok(sample.work[0].highlights.includes('Maintained CSS layouts.'));
});
test('hostile profile content stays text; unsafe URL schemes never become links', () => {
  const r = cv.validate({ basics: { name: '</h1><script>alert(1)</script>', summary: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)' }, work: [{ highlights: ['<svg onload=alert(1)>'] }] });
  const html = cv.exportHtml(r);
  assert.ok(!html.includes('<script>')); assert.ok(!html.includes('<img')); assert.ok(!html.includes('href="javascript:'));
  assert.match(html, /&lt;script&gt;/); assert.match(html, /default-src 'none'/);
  assert.equal(cv.safeUrl('data:text/html,hi'), null); assert.ok(cv.safeUrl('https://example.com'));
});
test('non-Latin text and empty profiles render without fabricated bullets or numeric metrics', () => {
  const fa = cv.exportHtml({ basics: { name: 'نمونه فارسی', summary: 'برنامه‌نویس پایتون' } });
  assert.ok(fa.includes('نمونه فارسی')); assert.match(fa, /dir="auto"/);
  const blank = cv.resumeMarkup({ basics: {} }); assert.ok(!blank.includes('<li')); assert.ok(!blank.includes('Experience'));
});
