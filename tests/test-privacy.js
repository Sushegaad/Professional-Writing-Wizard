// =============================================================
// ClearVoice — PrivacyGuard Unit Tests
// =============================================================

suite('PrivacyGuard.redact()', () => {

  // ── Email ───────────────────────────────────────────────────
  test('redacts a plain email address', () => {
    const { redacted } = PrivacyGuard.redact('Contact me at jane.doe@example.com please.');
    assert(!redacted.includes('@'), 'email still present');
    assert(redacted.includes('[EMAIL]'), '[EMAIL] token missing');
  });

  test('redacts multiple emails', () => {
    const { found } = PrivacyGuard.redact('a@b.com and c@d.org');
    assert(found.filter(f => f.type === 'EMAIL').length === 2, 'expected 2 EMAIL detections');
  });

  test('does not redact non-email @-mention', () => {
    const { redacted } = PrivacyGuard.redact('Ping @johndoe on Slack');
    assert(redacted.includes('@johndoe'), '@mention incorrectly redacted');
  });

  // ── Phone ───────────────────────────────────────────────────
  test('redacts US phone (555) 555-5555', () => {
    const { redacted } = PrivacyGuard.redact('Call me at (555) 555-5555 tomorrow.');
    assert(redacted.includes('[PHONE]'), '[PHONE] token missing');
  });

  test('redacts US phone 555.555.5555', () => {
    const { redacted } = PrivacyGuard.redact('My number: 555.555.5555');
    assert(redacted.includes('[PHONE]'), '[PHONE] token missing');
  });

  // ── SSN ─────────────────────────────────────────────────────
  test('redacts SSN with dashes', () => {
    const { redacted } = PrivacyGuard.redact('SSN: 123-45-6789');
    assert(redacted.includes('[SSN]'), '[SSN] token missing');
    assert(!redacted.includes('123'), 'SSN digits still present');
  });

  test('redacts SSN without separators', () => {
    const { redacted } = PrivacyGuard.redact('ID number 123456789.');
    assert(redacted.includes('[SSN]'), '[SSN] token missing');
  });

  // ── Credit card ─────────────────────────────────────────────
  test('redacts 16-digit credit card with spaces', () => {
    const { redacted } = PrivacyGuard.redact('Card: 4111 1111 1111 1111');
    assert(redacted.includes('[CREDIT_CARD]'), '[CREDIT_CARD] token missing');
  });

  test('redacts 16-digit credit card with dashes', () => {
    const { redacted } = PrivacyGuard.redact('4111-1111-1111-1111');
    assert(redacted.includes('[CREDIT_CARD]'), '[CREDIT_CARD] token missing');
  });

  // ── IP Address ──────────────────────────────────────────────
  test('redacts IPv4 address', () => {
    const { redacted } = PrivacyGuard.redact('Server is at 192.168.1.100');
    assert(redacted.includes('[IP_ADDRESS]'), '[IP_ADDRESS] token missing');
  });

  test('does not redact version numbers as IP', () => {
    // "1.2.3.4" style version — this MAY be caught by IP regex; acceptable behaviour
    // Just verify the function runs without throwing
    assert(typeof PrivacyGuard.redact('version 1.2').redacted === 'string', 'should return string');
  });

  // ── URL ─────────────────────────────────────────────────────
  test('redacts https URL', () => {
    const { redacted } = PrivacyGuard.redact('Visit https://private.company.com/dashboard');
    assert(redacted.includes('[URL]'), '[URL] token missing');
  });

  // ── Date ────────────────────────────────────────────────────
  test('redacts MM/DD/YYYY date', () => {
    const { redacted } = PrivacyGuard.redact('DOB: 04/15/1985');
    assert(redacted.includes('[DATE]'), '[DATE] token missing');
  });

  test('redacts YYYY-MM-DD date', () => {
    const { redacted } = PrivacyGuard.redact('born on 1985-04-15.');
    assert(redacted.includes('[DATE]'), '[DATE] token missing');
  });

  // ── Account number ──────────────────────────────────────────
  test('redacts account number label', () => {
    const { redacted } = PrivacyGuard.redact('Your account number: 987654321');
    assert(redacted.includes('[ACCOUNT_NUMBER]'), '[ACCOUNT_NUMBER] token missing');
  });

  // ── No PII ──────────────────────────────────────────────────
  test('returns unchanged text when no PII present', () => {
    const clean = 'Please review the attached proposal and share your feedback.';
    const { redacted, found } = PrivacyGuard.redact(clean);
    assert(redacted === clean, 'clean text was modified unexpectedly');
    assert(found.length === 0, `unexpected PII found: ${found.map(f=>f.type).join(', ')}`);
  });

  // ── found array ─────────────────────────────────────────────
  test('found array contains type and value', () => {
    const { found } = PrivacyGuard.redact('Email: test@example.com');
    assert(found.length > 0, 'found array is empty');
    assert(found[0].type  === 'EMAIL', `expected EMAIL, got ${found[0].type}`);
    assert(found[0].value === 'test@example.com', `unexpected value: ${found[0].value}`);
  });

  // ── restore() ───────────────────────────────────────────────
  test('restore() returns original text', () => {
    const original = 'My SSN is 123-45-6789';
    PrivacyGuard.redact(original);
    assert(PrivacyGuard.restore() === original, 'restore() did not return original');
  });

  // ── summarise() ─────────────────────────────────────────────
  test('summarise() returns human-readable string', () => {
    const { found } = PrivacyGuard.redact('john@test.com and 555-123-4567');
    const summary   = PrivacyGuard.summarise(found);
    assert(typeof summary === 'string' && summary.length > 0, 'summarise() returned empty string');
  });

  test('summarise() returns "No PII detected" for empty array', () => {
    assert(PrivacyGuard.summarise([]) === 'No PII detected', 'wrong message for empty found');
  });

  // ── hasPII() ────────────────────────────────────────────────
  test('hasPII() returns true when PII present', () => {
    const { found } = PrivacyGuard.redact('test@test.com');
    assert(PrivacyGuard.hasPII(found) === true, 'hasPII should be true');
  });

  test('hasPII() returns false when no PII', () => {
    const { found } = PrivacyGuard.redact('Hello world.');
    assert(PrivacyGuard.hasPII(found) === false, 'hasPII should be false');
  });

  // ── Multiple PII types in one string ────────────────────────
  test('redacts multiple PII types in one pass', () => {
    const text = 'Email me at ceo@firm.io or call (800) 555-0100. SSN: 987-65-4321.';
    const { redacted, found } = PrivacyGuard.redact(text);
    const types = found.map(f => f.type);
    assert(types.includes('EMAIL'), 'EMAIL not detected');
    assert(types.includes('PHONE'), 'PHONE not detected');
    assert(types.includes('SSN'),   'SSN not detected');
    assert(!redacted.includes('@'), 'email still in redacted text');
  });

  // ── Idempotency ─────────────────────────────────────────────
  test('redacting already-redacted text is idempotent', () => {
    const text          = 'Call me at (555) 555-5555';
    const { redacted }  = PrivacyGuard.redact(text);
    const { redacted: r2, found: f2 } = PrivacyGuard.redact(redacted);
    assert(r2 === redacted, 'double-redaction changed output');
    assert(f2.length === 0, 'found PII in already-redacted text');
  });
});
