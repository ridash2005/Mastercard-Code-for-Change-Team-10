// Minimal, dependency-free schema validators shaped to match `@katalyst/ai-client`'s
// `GenerateJsonOptions.schema` contract (an object with `.safeParse(value)` ->
// `{ success: true, data }` | `{ success: false, error: { message } }`).
// Kept hand-rolled (no zod) so backend/api stays a plain CommonJS service with
// guardrail logic that's easy to audit line-by-line.

const PERFORMANCE_LEVEL_KEYS = ['not_demonstrated', 'developing', 'proficient', 'excellent'];

/**
 * Gemini `responseSchema` (generationConfig) for the Coach's `{ reply }`
 * shape. Constrains the provider to this exact JSON so `coachReplySchema`
 * below isn't relying solely on prose instructions in the prompt.
 */
const COACH_REPLY_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: "The coach's reply to the student, plain text." }
  },
  required: ['reply']
};

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
/**
 * Gemini `responseSchema` counterpart to `judgeOutputSchema` below - same
 * field names (`criteria_levels`, `criterion_key`, `level_key`, ...),
 * expressed as the OpenAPI-subset object Gemini's `generationConfig.
 * responseSchema` accepts, so the provider is constrained to emit exactly
 * this shape instead of the model guessing plausible-but-wrong key names
 * (e.g. `criteria_evaluations` / `criterion_id` / `level`) that would then
 * fail `judgeOutputSchema`'s validation every time.
 */
function judgeResponseSchema(validCriterionKeys) {
  return {
    type: 'object',
    properties: {
      criteria_levels: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            criterion_key: { type: 'string', enum: validCriterionKeys },
            level_key: { type: 'string', enum: PERFORMANCE_LEVEL_KEYS },
            justification: { type: 'string', description: 'Concrete evidence cited from the submission.' }
          },
          required: ['criterion_key', 'level_key', 'justification']
        }
      },
      confidence: { type: 'number', description: 'Between 0 and 1.' },
      flags: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['possible_plagiarism', 'incomplete', 'off_topic', 'late_submission', 'none']
        }
      },
      suggested_bonus: { type: 'string', description: 'Advisory only, e.g. "none".' },
      student_feedback: { type: 'string', description: 'Warm, specific, 3-5 sentence feedback for the student.' }
    },
    required: ['criteria_levels', 'confidence', 'student_feedback']
  };
}

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

module.exports = {
  coachReplySchema,
  judgeOutputSchema,
  judgeResponseSchema,
  COACH_REPLY_RESPONSE_SCHEMA,
  PERFORMANCE_LEVEL_KEYS
};
