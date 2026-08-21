// Source-of-truth regex patterns for the AI guardrail layer.
// Every pattern here is deliberately conservative (favors false positives
// over false negatives) — this gate protects the only path into `/ai`, so
// it must fail closed, not open.

// --- Prompt injection / jailbreak attempts -------------------------------
// Catches the common "override the system prompt" phrasings. Case-insensitive.
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /disregard\s+(the\s+)?(system\s+)?prompt/i,
  /forget\s+(everything|all)\s+(you\s+)?(were\s+told|know)/i,
  /you\s+are\s+now\s+(a|an)\s+\w+/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(a|an)\s+(different|new|unrestricted)/i,
  /reveal\s+(your\s+)?(system\s+)?prompt/i,
  /print\s+(your\s+)?(instructions|system\s+prompt)/i,
  /\bjailbreak\b/i,
  /\bdan\s+mode\b/i,
  /developer\s+mode/i,
  /no\s+(restrictions|rules|limits|filters)/i,
  /bypass\s+(your\s+)?(guardrails|safety|filters|restrictions)/i,
  /pretend\s+(you\s+have\s+no|there\s+are\s+no)\s+(rules|restrictions)/i,
  /repeat\s+(the\s+words?\s+)?above/i,
  /what\s+(is|are)\s+your\s+(system\s+)?(prompt|instructions)/i
];

// --- Unsafe content (escalate, never answer) -----------------------------
const UNSAFE_CONTENT_PATTERNS = [
  /\b(kill|hurt|harm)\s+(myself|yourself|themselves|others)\b/i,
  /\bsuicid(e|al)\b/i,
  /\bself[-\s]?harm\b/i,
  /\bhow\s+to\s+make\s+a\s+(bomb|weapon|explosive)\b/i
];

// --- PII (redact before it reaches a model or a log) ---------------------
const PII_PATTERNS = {
  email: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
  phone: /\b(\+?\d{1,3}[\s.-]?)?\(?\d{3,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g,
  creditCard: /\b(?:\d[ -]*?){13,16}\b/g,
  apiKey: /\b(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,})\b/g
};

// --- Markup/script injection (sanitize before storage/render) ------------
const MARKUP_INJECTION_PATTERNS = [
  /<\s*script[^>]*>/i,
  /on\w+\s*=\s*["'][^"']*["']/i,
  /javascript\s*:/i,
  /<\s*iframe[^>]*>/i
];

// --- Intent classification keyword sets -----------------------------------
const INTENT_KEYWORDS = {
  progress_query: /\b(xp|rank|streak|level|leaderboard|progress|points|badge)\b/i,
  content_question: /\b(explain|understand|how does|what is|help me with|teach me|don't get|confused about)\b/i,
  mission_query: /\b(mission|enroll|module|course|assignment|due|deadline)\b/i,
  greeting: /^\s*(hi|hey|hello|good\s(morning|afternoon|evening))\b/i
};

module.exports = {
  PROMPT_INJECTION_PATTERNS,
  UNSAFE_CONTENT_PATTERNS,
  PII_PATTERNS,
  MARKUP_INJECTION_PATTERNS,
  INTENT_KEYWORDS
};
