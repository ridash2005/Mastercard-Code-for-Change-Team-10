// Output guardrail: nothing an LLM returns reaches the HTTP response (or a
// DB write) without passing through here. Mirrors the input side - fails
// closed, and specifically defends against the model leaking its own system
// prompt or emitting markup that would execute in the frontend.

const { MARKUP_INJECTION_PATTERNS } = require('./regexPatterns');

const SYSTEM_PROMPT_LEAK_PATTERNS = [
  /you are the katalyst ai coach/i,
  /rules you must follow exactly/i,
  /you never invent xp totals/i
];

const CHATBOT_PROMPT_LEAK_PATTERNS = [
  /you are the katalyst chatbot/i,
  /pick exactly one "?intent"?/i,
  /you never fabricate xp totals/i
];

const FALLBACK_REPLY =
  "I can't share that. Ask me about your progress, XP, missions, or anything you're studying instead!";

class OutputGuardrailError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'OutputGuardrailError';
    this.code = code;
  }
}

function stripMarkup(text) {
  let clean = text;
  for (const pattern of MARKUP_INJECTION_PATTERNS) {
    clean = clean.replace(pattern, '');
  }
  return clean;
}

/**
 * @param {string} reply
 * @returns {string} a reply safe to send to the client
 */
function guardCoachReply(reply) {
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new OutputGuardrailError('AI Coach returned an empty reply', 'empty_output');
  }

  const leaked = SYSTEM_PROMPT_LEAK_PATTERNS.some((re) => re.test(reply));
  if (leaked) return FALLBACK_REPLY;

  return stripMarkup(reply).trim();
}

/**
 * Judge output has already passed schema validation (schemas.js) by the time
 * it gets here - this pass only re-checks the free-text `student_feedback`
 * field for the same markup/leak classes as the Coach reply, and rejects
 * outright (rather than substituting) since a bad feedback string should
 * route the submission to pending_review, not silently ship a placeholder.
 */
function guardJudgeOutput(output) {
  const leaked = SYSTEM_PROMPT_LEAK_PATTERNS.some((re) => re.test(output.student_feedback));
  const hasMarkup = MARKUP_INJECTION_PATTERNS.some((re) => re.test(output.student_feedback));
  if (leaked || hasMarkup) {
    throw new OutputGuardrailError('student_feedback failed output guardrails', 'unsafe_output');
  }
  return output;
}

/**
 * Same shape as guardCoachReply, for the Chatbot's free-text "reply" field
 * (services/ai/chatbotService.js) - separate leak-pattern list since the
 * two features have different system prompts to guard against leaking.
 */
function guardChatbotReply(reply) {
  if (typeof reply !== 'string' || !reply.trim()) {
    throw new OutputGuardrailError('Chatbot returned an empty reply', 'empty_output');
  }

  const leaked = CHATBOT_PROMPT_LEAK_PATTERNS.some((re) => re.test(reply));
  if (leaked) return FALLBACK_REPLY;

  return stripMarkup(reply).trim();
}

module.exports = { guardCoachReply, guardChatbotReply, guardJudgeOutput, OutputGuardrailError };
