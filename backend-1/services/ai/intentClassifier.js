// Regex-based intent identification for messages headed into `/ai`.
// This runs *before* any LLM call — it's cheap, deterministic, and gives the
// guardrail layer something to key blocking/logging decisions on without
// ever needing to trust the model itself to self-report intent.

const { INTENT_KEYWORDS, PROMPT_INJECTION_PATTERNS, UNSAFE_CONTENT_PATTERNS } = require('./regexPatterns');

/**
 * @param {string} text
 * @returns {{ intent: string, isInjectionAttempt: boolean, isUnsafe: boolean }}
 */
function classifyIntent(text) {
  const isInjectionAttempt = PROMPT_INJECTION_PATTERNS.some((re) => re.test(text));
  const isUnsafe = UNSAFE_CONTENT_PATTERNS.some((re) => re.test(text));

  if (isInjectionAttempt) return { intent: 'injection_attempt', isInjectionAttempt, isUnsafe };
  if (isUnsafe) return { intent: 'unsafe_content', isInjectionAttempt, isUnsafe };

  if (INTENT_KEYWORDS.greeting.test(text)) return { intent: 'greeting', isInjectionAttempt, isUnsafe };
  if (INTENT_KEYWORDS.progress_query.test(text)) return { intent: 'progress_query', isInjectionAttempt, isUnsafe };
  if (INTENT_KEYWORDS.mission_query.test(text)) return { intent: 'mission_query', isInjectionAttempt, isUnsafe };
  if (INTENT_KEYWORDS.content_question.test(text)) return { intent: 'content_question', isInjectionAttempt, isUnsafe };

  return { intent: 'general_chat', isInjectionAttempt, isUnsafe };
}

module.exports = { classifyIntent };
