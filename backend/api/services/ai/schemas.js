// Minimal, dependency-free schema validators shaped to match `@katalyst/ai-client`'s
// `GenerateJsonOptions.schema` contract (an object with `.safeParse(value)` ->
// `{ success: true, data }` | `{ success: false, error: { message } }`).
// Kept hand-rolled (no zod) so backend/api stays a plain CommonJS service with
// guardrail logic that's easy to audit line-by-line.

const PERFORMANCE_LEVEL_KEYS = ['not_demonstrated', 'developing', 'proficient', 'excellent'];

function fail(message) {
  return { success: false, error: { message } };
}

function ok(data) {
  return { success: true, data };
}

/** Schema for the AI Coach's structured reply: `{ reply: string }` only. */
const coachReplySchema = {
  safeParse(value) {
    if (!value || typeof value !== 'object') return fail('expected an object');
    if (typeof value.reply !== 'string' || !value.reply.trim()) {
      return fail('expected a non-empty "reply" string');
    }
    if (value.reply.length > 2000) return fail('reply exceeds 2000 characters');
    return ok({ reply: value.reply });
  }
};

/**
 * Schema for the AI Judge's structured output (KATALYST_AI_SPEC.md §2.2).
 * `validCriterionKeys` is the rubric actually sent for this submission - every
 * `criterion_key` the model returns must exist in it, or the whole response
 * is rejected (never persisted, never trusted).
 */
function judgeOutputSchema(validCriterionKeys) {
  return {
    safeParse(value) {
      if (!value || typeof value !== 'object') return fail('expected an object');
      if (!Array.isArray(value.criteria_levels) || value.criteria_levels.length === 0) {
        return fail('criteria_levels must be a non-empty array');
      }
      for (const level of value.criteria_levels) {
        if (!level || typeof level.criterion_key !== 'string') {
          return fail('each criteria_levels entry needs a criterion_key string');
        }
        if (!validCriterionKeys.includes(level.criterion_key)) {
          return fail(`unknown criterion_key: "${level.criterion_key}"`);
        }
        if (!PERFORMANCE_LEVEL_KEYS.includes(level.level_key)) {
          return fail(`invalid level_key: "${level.level_key}"`);
        }
        if (typeof level.justification !== 'string' || !level.justification.trim()) {
          return fail(`missing justification for criterion "${level.criterion_key}"`);
        }
      }
      if (typeof value.confidence !== 'number' || value.confidence < 0 || value.confidence > 1) {
        return fail('confidence must be a number between 0 and 1');
      }
      if (typeof value.student_feedback !== 'string' || !value.student_feedback.trim()) {
        return fail('missing student_feedback');
      }
      return ok({
        criteria_levels: value.criteria_levels,
        confidence: value.confidence,
        flags: Array.isArray(value.flags) ? value.flags : [],
        suggested_bonus: typeof value.suggested_bonus === 'string' ? value.suggested_bonus : 'none',
        student_feedback: value.student_feedback
      });
    }
  };
}

module.exports = { coachReplySchema, judgeOutputSchema, PERFORMANCE_LEVEL_KEYS };
