// =============================================================
// ClearVoice — Core Function Unit Tests
// Tests: parseAIResponse, buildHeatmap, xEsc, getRunCount
// =============================================================

// ── parseAIResponse ─────────────────────────────────────────
suite('parseAIResponse()', () => {

  test('parses valid JSON string', () => {
    const raw = JSON.stringify({ variations: [], coaching: [], toneAnalysis: [], overallScore: {} });
    const obj = parseAIResponse(raw);
    assert(Array.isArray(obj.variations), 'variations should be array');
    assert(Array.isArray(obj.coaching),   'coaching should be array');
  });

  test('strips markdown code fences', () => {
    const raw = '```json\n{"variations":[],"coaching":[],"toneAnalysis":[],"overallScore":{}}\n```';
    const obj = parseAIResponse(raw);
    assert(typeof obj === 'object', 'should parse object from fenced JSON');
  });

  test('extracts JSON from surrounding text', () => {
    const raw = 'Here is the result: {"variations":[],"coaching":[],"toneAnalysis":[],"overallScore":{}} Done.';
    const obj = parseAIResponse(raw);
    assert(typeof obj === 'object', 'should extract JSON from messy response');
  });

  test('throws on completely invalid input', () => {
    let threw = false;
    try { parseAIResponse('This is definitely not JSON!!!'); }
    catch (_) { threw = true; }
    assert(threw, 'should throw on unparseable input');
  });

  test('handles nested objects in overallScore', () => {
    const raw = JSON.stringify({ variations: [], coaching: [], toneAnalysis: [],
      overallScore: { clarity: 72, confidence: 68, professionalism: 80, impact: 65 } });
    const { overallScore } = parseAIResponse(raw);
    assert(overallScore.clarity === 72, 'clarity score wrong');
    assert(overallScore.impact  === 65, 'impact score wrong');
  });
});

// ── buildHeatmap ─────────────────────────────────────────────
suite('buildHeatmap()', () => {

  const tone = [
    { phrase: 'just wanted to', issue: 'Hedge language', type: 'waffle', severity: 1 },
    { phrase: 'I think',        issue: 'Low confidence',  type: 'passive', severity: 1 },
    { phrase: 'results',        issue: 'Strong word',     type: 'strong',  severity: 1 },
  ];

  test('wraps matched phrase in .ht span', () => {
    const html = buildHeatmap('I just wanted to share the results.', tone);
    assert(html.includes('ht-waffle'),  'waffle class missing');
    assert(html.includes('ht-strong'),  'strong class missing');
  });

  test('wraps longer phrase first (no double-wrapping)', () => {
    // "just wanted to" contains "just" — ensure "just wanted to" is wrapped, not "just"
    const toneOverlap = [
      { phrase: 'just wanted to', issue: 'Hedge', type: 'waffle', severity: 1 },
      { phrase: 'just',           issue: 'Filler', type: 'vague', severity: 1 },
    ];
    const html = buildHeatmap('I just wanted to follow up.', toneOverlap);
    const matches = (html.match(/class="ht /g) || []).length;
    assert(matches === 1, `expected 1 span wrapper, got ${matches}`);
  });

  test('converts newlines to <br>', () => {
    const html = buildHeatmap('Line one\nLine two', []);
    assert(html.includes('<br>'), 'newlines not converted to <br>');
  });

  test('HTML-escapes text before inserting', () => {
    const html = buildHeatmap('<script>alert(1)</script>', []);
    assert(!html.includes('<script>'), 'raw script tag leaked through');
    assert(html.includes('&lt;script&gt;'), 'script not escaped');
  });

  test('skips phrases not found in text', () => {
    const html = buildHeatmap('Clean professional text here.', tone);
    // None of the tone phrases appear in the text — should produce no ht spans
    assert(!html.includes('class="ht '), 'unexpected ht span in clean text');
  });

  test('returns string for empty text', () => {
    const html = buildHeatmap('', tone);
    assert(typeof html === 'string', 'should return string for empty text');
  });
});

// ── xEsc ─────────────────────────────────────────────────────
suite('xEsc()', () => {

  test('escapes & < > "', () => {
    const out = xEsc('<div class="a">&amp;</div>');
    assert(out.includes('&lt;'),  '< not escaped');
    assert(out.includes('&gt;'),  '> not escaped');
    assert(out.includes('&quot;'), '" not escaped');
    assert(out.includes('&amp;'), '& not escaped');
    assert(!out.includes('<div'), 'raw < still present');
  });

  test('returns empty string for null/undefined', () => {
    assert(xEsc(null)      === '', 'null should return empty string');
    assert(xEsc(undefined) === '', 'undefined should return empty string');
  });

  test('returns plain text unchanged', () => {
    assert(xEsc('hello world') === 'hello world', 'plain text was modified');
  });
});

// ── Usage counter helpers ─────────────────────────────────────
suite('getRunCount() / bumpRunCount()', () => {

  test('getRunCount returns number', () => {
    assert(typeof getRunCount() === 'number', 'should return number');
  });

  test('bumpRunCount increments by 1', () => {
    const before = getRunCount();
    bumpRunCount();
    const after  = getRunCount();
    // Restore original value so tests are side-effect-free
    localStorage.setItem('cv_run_count', String(before));
    assert(after === before + 1, `expected ${before + 1}, got ${after}`);
  });
});
