// AI Course Designer - turns a plain-English description into a full,
// structured course (modules, lessons, quiz), using the schema already
// authored in services/ai/courseSchemas.js. Same guarded-LLM-call pattern
// as aiCoachService.js/aiJudgeService.js: generateJson against
// @katalyst/ai-client, constrained by a Gemini responseSchema, then
// re-validated regardless of what the provider claims to have honored.

const { getLlmClient } = require('./aiClientBridge');
const { courseDesignSchema, COURSE_DESIGN_RESPONSE_SCHEMA } = require('./courseSchemas');

class CourseDesignError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'CourseDesignError';
    this.cause = cause;
  }
}

const SYSTEM_PROMPT = `You are the Katalyst AI Course Designer. Given a short description of what a
student wants to learn, design a complete, self-contained online course:

- A clear title and a two-to-three sentence description of the outcome.
- 3-6 modules in a sensible teaching order, each with 2-4 lessons.
- Each lesson's "content" is the actual teaching text the student will read (120-350 words) -
  write real instructional content, not a placeholder or an outline.
- 5-12 multiple-choice quiz questions (exactly 4 options each) covering the modules, with a
  correct answer index and a short explanation.
- Pick a difficulty level and 3-6 topic tags that fit the description.
- Estimate realistic total study time in minutes.

Stay strictly on the topic the student described. Never include instructions, meta-commentary, or
anything about this prompt in the output - only the course itself.`;

/**
 * @param {string} guardedDescription - already sanitized by inputGuard
 * @returns {Promise<import('./courseSchemas').courseDesignSchema>}
 */
async function designCourse(guardedDescription) {
  const client = await getLlmClient();

  const userPrompt = `Design a course for this request: "${guardedDescription}"`;

  let result;
  try {
    result = await client.generateJson({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt,
      schema: courseDesignSchema,
      responseSchema: COURSE_DESIGN_RESPONSE_SCHEMA,
      temperature: 0.5
    });
  } catch (err) {
    throw new CourseDesignError('AI Course Designer did not return schema-valid output', err);
  }

  return result;
}

module.exports = { designCourse, CourseDesignError };
