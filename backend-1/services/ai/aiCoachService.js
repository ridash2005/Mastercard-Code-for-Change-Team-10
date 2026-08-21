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

  let result;
  try {
    result = await client.generateJson({
      systemPrompt: AI_COACH_SYSTEM_PROMPT,
      userPrompt: guardedUserMessage,
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
