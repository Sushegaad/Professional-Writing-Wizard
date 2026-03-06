// =============================================================
// ClearVoice — Semantic Privacy Guard (Browser Port)
// Detects and redacts PII in text before sending to AI providers.
// Mirrors the pattern-based approach of Sushegaad/Semantic-Privacy-Guard.
// =============================================================

const PrivacyGuard = (() => {

  // ── Detection Rules ─────────────────────────────────────────
  // Each rule: { type, label, pattern }
  // Patterns must be recreated per call (avoid shared lastIndex state).
  const RULE_DEFS = [
    {
      type   : 'EMAIL',
      label  : '[EMAIL]',
      src    : String.raw`\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,7}\b`,
      flags  : 'g',
    },
    {
      type   : 'PHONE',
      label  : '[PHONE]',
      // US: (555) 555-5555 / 555.555.5555 / +1-555-555-5555
      src    : String.raw`(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s])\d{3}[-.\s]\d{4}`,
      flags  : 'g',
    },
    {
      type   : 'PHONE_INTL',
      label  : '[PHONE]',
      // International: +44 7911 123456
      src    : String.raw`\+(?:[0-9][-.\s]?){6,14}[0-9]`,
      flags  : 'g',
    },
    {
      type   : 'SSN',
      label  : '[SSN]',
      src    : String.raw`\b\d{3}[- ]?\d{2}[- ]?\d{4}\b`,
      flags  : 'g',
    },
    {
      type   : 'CREDIT_CARD',
      label  : '[CREDIT_CARD]',
      // 16-digit card with optional separators (Luhn not checked — pattern only)
      src    : String.raw`\b(?:\d{4}[-\s]?){3}\d{4}\b`,
      flags  : 'g',
    },
    {
      type   : 'IP_V4',
      label  : '[IP_ADDRESS]',
      src    : String.raw`\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b`,
      flags  : 'g',
    },
    {
      type   : 'IP_V6',
      label  : '[IP_ADDRESS]',
      src    : String.raw`(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}`,
      flags  : 'g',
    },
    {
      type   : 'URL',
      label  : '[URL]',
      src    : String.raw`https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9()@:%_+.~#?&\/=]*)`,
      flags  : 'g',
    },
    {
      type   : 'DATE',
      label  : '[DATE]',
      // MM/DD/YYYY, MM-DD-YYYY, YYYY-MM-DD
      src    : String.raw`\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b`,
      flags  : 'g',
    },
    {
      type   : 'PASSPORT',
      label  : '[PASSPORT]',
      // A–Z{1-2} followed by 6-9 digits (common US, UK, Indian patterns)
      src    : String.raw`\b[A-Z]{1,2}\d{6,9}\b`,
      flags  : 'g',
    },
    {
      type   : 'NATIONAL_ID',
      label  : '[NATIONAL_ID]',
      src    : String.raw`\b(?:EIN|TIN|NI|NINO|Aadhaar?|PAN)\s*[:#]?\s*[\w\d\-]{6,15}\b`,
      flags  : 'gi',
    },
    {
      type   : 'IBAN',
      label  : '[IBAN]',
      src    : String.raw`\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]{0,16})\b`,
      flags  : 'g',
    },
    {
      type   : 'ACCOUNT_NUMBER',
      label  : '[ACCOUNT_NUMBER]',
      src    : String.raw`\baccount\s+(?:number|#|no\.?)\s*[:#]?\s*[\w\d\-]{4,20}\b`,
      flags  : 'gi',
    },
    {
      type   : 'ROUTING_NUMBER',
      label  : '[ROUTING_NUMBER]',
      src    : String.raw`\brouting\s+(?:number|#|no\.?)\s*[:#]?\s*\d{9}\b`,
      flags  : 'gi',
    },
    {
      type   : 'MEDICAL_RECORD',
      label  : '[MEDICAL_RECORD]',
      src    : String.raw`\b(?:MRN|Medical\s+Record\s*(?:Number)?|Patient\s+ID)\s*[:#]?\s*[\w\d\-]{4,}\b`,
      flags  : 'gi',
    },
    {
      type   : 'GPS_COORDINATES',
      label  : '[COORDINATES]',
      // Decimal: 37.7749, -122.4194
      src    : String.raw`[-+]?(?:[0-8]?\d(?:\.\d+)?|90(?:\.0+)?),\s*[-+]?(?:1[0-7]\d(?:\.\d+)?|180(?:\.0+)?|\d{1,2}(?:\.\d+)?)`,
      flags  : 'g',
    },
  ];

  // ── Internal State ──────────────────────────────────────────
  let _lastResult = null;

  // ── Helpers ─────────────────────────────────────────────────

  /** Creates a fresh RegExp for a rule (avoids shared lastIndex bugs). */
  function makeRe(def) {
    return new RegExp(def.src, def.flags);
  }

  // ── Public API ───────────────────────────────────────────────

  return {

    /**
     * Redacts all detected PII in the supplied text.
     * @param {string} text
     * @returns {{ redacted: string, found: Array<{type,value}>, original: string }}
     */
    redact(text) {
      const found = [];
      let redacted = text;

      for (const def of RULE_DEFS) {
        const re = makeRe(def);
        redacted  = redacted.replace(re, (match) => {
          found.push({ type: def.type, value: match });
          return def.label;
        });
      }

      _lastResult = { original: text, redacted, found };
      return _lastResult;
    },

    /**
     * Returns the original unredacted text from the last redact() call.
     */
    restore() {
      return _lastResult?.original ?? '';
    },

    /**
     * Human-readable summary of detected PII types and counts.
     * @param {Array} found
     * @returns {string}
     */
    summarise(found) {
      if (!found || !found.length) return 'No PII detected';
      const counts = {};
      found.forEach(f => {
        const key = f.type.toLowerCase().replace(/_/g, ' ');
        counts[key] = (counts[key] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([t, n]) => `${n}\u00a0${t}${n > 1 ? 's' : ''}`)
        .join(', ');
    },

    /**
     * Returns true if any PII was found in a redact() call result.
     * @param {Array} found
     */
    hasPII(found) {
      return found && found.length > 0;
    },

    /** Exposes rule definitions for testing purposes. */
    get rules() { return RULE_DEFS; },
  };
})();
