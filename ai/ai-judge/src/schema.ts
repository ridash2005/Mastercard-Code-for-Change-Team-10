// Zod schema for the AI Judge's structured output (§4.2). The LLM must
// select one of the four fixed performance levels per criterion — never a
// free numeric score.

import { z } from "zod";
import { PERFORMANCE_LEVELS } from "@katalyst/shared-types";
import type { GeminiResponseSchema } from "@katalyst/ai-client";

export const AiJudgeOutputSchema = z.object({
  criteria_levels: z
    .array(
      z.object({
        criterion_key: z.string().min(1),
        level_key: z.enum(PERFORMANCE_LEVELS),
        justification: z.string().min(1)
      })
    )
    .min(1),
  confidence: z.number().min(0).max(1),
  flags: z.array(z.string()).default([]),
  suggested_bonus: z.string().default("none"),
  student_feedback: z.string().min(1)
});

export type AiJudgeOutput = z.infer<typeof AiJudgeOutputSchema>;

/**
 * Gemini `responseSchema` counterpart to `AiJudgeOutputSchema` above - same
 * field names, expressed as the OpenAPI-subset object Gemini's
 * `generationConfig.responseSchema` accepts. Constrains the provider to emit
 * exactly this shape instead of the model guessing plausible-but-wrong key
 * names (e.g. `criteria_evaluations` / `criterion_id` / `level`) that would
 * then fail `AiJudgeOutputSchema`'s validation every time - `criterion_key`'s
 * valid values are pinned per-call via `validCriterionKeys` since the rubric
 * varies by module type.
 */
export function buildAiJudgeResponseSchema(validCriterionKeys: string[]): GeminiResponseSchema {
  return {
    type: "object",
    properties: {
      criteria_levels: {
        type: "array",
        items: {
          type: "object",
          properties: {
            criterion_key: { type: "string", enum: validCriterionKeys },
            level_key: { type: "string", enum: [...PERFORMANCE_LEVELS] },
            justification: { type: "string", description: "Concrete evidence cited from the submission." }
          },
          required: ["criterion_key", "level_key", "justification"]
        }
      },
      confidence: { type: "number", description: "Between 0 and 1." },
      flags: { type: "array", items: { type: "string" } },
      suggested_bonus: { type: "string", description: 'Advisory only, e.g. "none".' },
      student_feedback: { type: "string", description: "Warm, specific, 3-5 sentence feedback for the student." }
    },
    required: ["criteria_levels", "confidence", "student_feedback"]
  };
}
