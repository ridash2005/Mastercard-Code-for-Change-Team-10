// AI Coach - guarded, tool-free slice.
//
// NOTE on scope: KATALYST_AI_SPEC.md §3.1 specs a full tool-calling Coach
// (get_student_progress, get_leaderboard, search_knowledge_base, etc.) with
// tool *execution* wired to backend repository functions. That requires the
// submissions/reviews/xp_ledger Mongo models this backend doesn't have yet.
// This service wires the guardrail + auth + routing pattern end-to-end for
// one real call (generateJson against @katalyst/ai-client), honestly scoped
// to conversational replies only - it never fabricates progress data
// because the prompt (coachPrompt.js) explicitly forbids it. Swapping this
// for the full tool-calling loop later is additive, not a rewrite: the
// guardrail/auth/rate-limit layers around it don't change.

const { getLlmClient } = require('./aiClientBridge');
const { coachReplySchema } = require('./schemas');
const { guardCoachReply, OutputGuardrailError } = require('./outputGuard');
const { AI_COACH_SYSTEM_PROMPT } = require('./coachPrompt');

class AiCoachError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'AiCoachError';
    this.cause = cause;
  }
}

/**
 * @param {string} guardedUserMessage - already sanitized by inputGuard
 * @returns {Promise<string>} guardrail-checked reply text
 */
async function getCoachReply(guardedUserMessage) {
  const client = await getLlmClient();

  // generateJson() sets responseMimeType: "application/json" but does not
  // pin a response schema on the provider side (ai/ai-client's GeminiClient
  // has no responseSchema support) - so the exact JSON shape has to be
  // spelled out in-prompt, or the model returns arbitrary JSON that fails
  // coachReplySchema every time. This was caught by an end-to-end test that
  // actually called the live model rather than trusting the fixture path.
  const userPrompt = `${guardedUserMessage}\n\nRespond with ONLY a JSON object of the exact shape {"reply": "<your reply text>"} - no other keys, no markdown fences, no prose outside the JSON.`;

  let result;
  try {
    result = await client.generateJson({
      systemPrompt: AI_COACH_SYSTEM_PROMPT,
      userPrompt,
      schema: coachReplySchema,
      temperature: 0.4
    });
  } catch (err) {
    throw new AiCoachError('AI Coach did not return a valid reply', err);
  }

  try {
    return guardCoachReply(result.reply);
  } catch (err) {
    if (err instanceof OutputGuardrailError) throw err;
    throw new AiCoachError('AI Coach reply failed output guardrails', err);
  }
}

module.exports = { getCoachReply, AiCoachError };
