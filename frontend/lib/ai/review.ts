export type AiReview = {
  strengths: string[];
  weaknesses: string[];
  suggestedScore: number;
  suggestedFeedback: string;
};

/** Mock faculty copilot. Isolated so an LLM can replace it later. */
export function reviewSubmissionDraft(text: string, activityTitle: string): AiReview {
  const long = text.length > 80;
  return {
    strengths: [
      long ? "Enough narrative to judge intent." : "Prompt is acknowledged.",
      `Tied to ${activityTitle} rather than a generic essay.`,
    ],
    weaknesses: [
      long ? "Could cite one source or dataset assumption." : "Too thin to award full XP.",
      "Missing a clear next-step or limitation.",
    ],
    suggestedScore: long ? 84 : 62,
    suggestedFeedback: long
      ? "Solid pass. Add one limitation and a merchant/user quote, then I would approve."
      : "Expand the artefact. Right now this reads as notes, not a submission.",
  };
}
