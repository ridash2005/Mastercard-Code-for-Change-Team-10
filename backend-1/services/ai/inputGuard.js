// Input guardrail: every string headed toward an LLM call passes through
// here first. Fails closed - malformed/oversized/malicious input never
// reaches `aiClientBridge`, regardless of who's calling.

const { PII_PATTERNS, MARKUP_INJECTION_PATTERNS } = require('./regexPatterns');
const { classifyIntent } = require('./intentClassifier');

const DEFAULT_MAX_LEN = 4000;
const MIN_LEN = 1;

// Matches C0/C1 control characters except tab (\x09), newline (\x0A) and
// carriage return (\x0D), which can otherwise smuggle injection payloads or
// break downstream logging/storage.
const CONTROL_CHAR_PATTERN = new RegExp(
  '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]',
  'g'
);

class GuardrailError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GuardrailError';
    this.code = code;
  }
}

function stripControlChars(text) {
  return text.replace(CONTROL_CHAR_PATTERN, '');
}

function redactPii(text) {
  let redacted = text;
  let piiFound = false;
  for (const [label, pattern] of Object.entries(PII_PATTERNS)) {
    if (pattern.test(redacted)) {
      piiFound = true;
      redacted = redacted.replace(pattern, `[REDACTED_${label.toUpperCase()}]`);
    }
  }
  return { redacted, piiFound };
}

/**
 * @param {unknown} rawInput
 * @param {{ maxLen?: number }} [opts]
 * @returns {{ clean: string, intent: string, flags: string[], blockedReason: string|null }}
 */
function sanitizeAndValidateInput(rawInput, opts = {}) {
  const maxLen = opts.maxLen ?? DEFAULT_MAX_LEN;

  if (typeof rawInput !== 'string') {
    throw new GuardrailError('Message must be a string', 'invalid_type');
  }

  const trimmed = stripControlChars(rawInput).trim();

  if (trimmed.length < MIN_LEN) {
    throw new GuardrailError('Message must not be empty', 'empty_message');
  }
  if (trimmed.length > maxLen) {
    throw new GuardrailError(`Message exceeds ${maxLen} characters`, 'message_too_long');
  }

  const hasMarkupInjection = MARKUP_INJECTION_PATTERNS.some((re) => re.test(trimmed));
  const { redacted, piiFound } = redactPii(trimmed);
  const { intent, isInjectionAttempt, isUnsafe } = classifyIntent(trimmed);

  const flags = [];
  if (piiFound) flags.push('pii_redacted');
  if (hasMarkupInjection) flags.push('markup_injection');

  let blockedReason = null;
  if (isInjectionAttempt) blockedReason = 'prompt_injection_attempt';
  else if (isUnsafe) blockedReason = 'unsafe_content';
  else if (hasMarkupInjection) blockedReason = 'markup_injection';

  return { clean: redacted, intent, flags, blockedReason };
}

module.exports = { sanitizeAndValidateInput, GuardrailError };
