// Orchestrator: builds the prompt, calls the LLM, validates against the
// rubric, computes XP deterministically, and routes the review. This is the
// function the score-submission job (§4.1) calls.

import type { LlmClient } from "@katalyst/ai-client";
import type {
  ModuleRecord,
  PerformanceLevelKey,
  Review,
  RubricCriterion
} from "@katalyst/shared-types";
import { AiJudgeOutputSchema, buildAiJudgeResponseSchema } from "./schema.js";
import { AI_JUDGE_SYSTEM_PROMPT, buildAiJudgeUserPrompt } from "./prompt.js";
import { computeXp } from "./xp.js";
import { routeReview } from "./routing.js";
import type { Submission } from "@katalyst/shared-types";

export class AiJudgeParseError extends Error {}

export interface ScoreSubmissionInput {
  llmClient: LlmClient;
  module: Pick<ModuleRecord, "type" | "mode" | "due_date" | "title" | "xp_weight">;
  criteria: RubricCriterion[];
  rubricId: string;
  confidenceThreshold: number;
  submission: Submission;
  routingHints?: {
    isPureAutoGraded?: boolean;
    attendanceOnly?: boolean;
    requiresMentorConfirmation?: boolean;
  };
}

export async function scoreSubmission(input: ScoreSubmissionInput): Promise<Review> {
  const { llmClient, module, criteria, submission } = input;
  const validKeys = new Set(criteria.map((c) => c.key));

  const userPrompt = buildAiJudgeUserPrompt({ module, criteria, submission });

  let output;
  try {
    output = await llmClient.generateJson({
      systemPrompt: AI_JUDGE_SYSTEM_PROMPT,
      userPrompt,
      schema: AiJudgeOutputSchema,
      responseSchema: buildAiJudgeResponseSchema([...validKeys])
    });
  } catch {
    return buildParseErrorReview(input);
  }

  // Every criterion_key must exist in the rubric; every criterion must be covered.
  const returnedKeys = new Set(output.criteria_levels.map((c) => c.criterion_key));
  const allKeysValid = output.criteria_levels.every((c) => validKeys.has(c.criterion_key));
  const allCriteriaCovered = [...validKeys].every((k) => returnedKeys.has(k));

  if (!allKeysValid || !allCriteriaCovered) {
    return buildParseErrorReview(input);
  }

  const { criteria_levels, total_earned_pct, xp_awarded } = computeXp({
    criteria,
    selectedLevels: output.criteria_levels.map((c) => ({
      criterion_key: c.criterion_key,
      level_key: c.level_key as PerformanceLevelKey,
      justification: c.justification
    })),
    moduleXpWeight: module.xp_weight
  });

  const routed = routeReview({
    moduleType: module.type,
    confidence: output.confidence,
    confidenceThreshold: input.confidenceThreshold,
    flags: output.flags ?? [],
    isPureAutoGraded: input.routingHints?.isPureAutoGraded,
    attendanceOnly: input.routingHints?.attendanceOnly,
    requiresMentorConfirmation: input.routingHints?.requiresMentorConfirmation
  });

  return {
    id: crypto.randomUUID(),
    submission_id: submission.id,
    reviewer_type: "ai_judge",
    reviewer_user_id: null,
    criteria_levels,
    total_earned_pct,
    xp_awarded,
    feedback_text: output.student_feedback,
    confidence: output.confidence,
    flags: routed.flags as Review["flags"],
    suggested_bonus: output.suggested_bonus as Review["suggested_bonus"],
    rubric_id: input.rubricId,
    status: routed.status
  };
}

function buildParseErrorReview(input: ScoreSubmissionInput): Review {
  return {
    id: crypto.randomUUID(),
    submission_id: input.submission.id,
    reviewer_type: "ai_judge",
    reviewer_user_id: null,
    criteria_levels: [],
    total_earned_pct: 0,
    xp_awarded: 0,
    feedback_text: "",
    confidence: 0,
    flags: ["ai_parse_error"],
    suggested_bonus: "none",
    rubric_id: input.rubricId,
    status: "pending_review"
  };
}
