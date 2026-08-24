// Validators for the AI Course Designer's structured output, in the same
// hand-rolled `.safeParse(value)` style as services/ai/schemas.js (no zod, so
// backend/api stays plain CommonJS with guardrail logic that's auditable
// line-by-line). Two layers, same as the Judge:
//
//   COURSE_DESIGN_RESPONSE_SCHEMA - Gemini's `generationConfig.responseSchema`,
//     constraining the provider to emit this exact JSON shape.
//   courseDesignSchema            - the safety net that runs on whatever came
//     back regardless, because a constrained provider is not a trusted one.

const LEVEL_KEYS = ['beginner', 'intermediate', 'advanced'];

const MIN_MODULES = 3;
const MAX_MODULES = 6;
const MIN_LESSONS_PER_MODULE = 2;
const MAX_LESSONS_PER_MODULE = 4;
const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 12;
const OPTIONS_PER_QUESTION = 4;

/** Gemini `responseSchema` for a designed course. */
const COURSE_DESIGN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Course title, under 80 characters.' },
    description: { type: 'string', description: 'Two or three sentences on what the learner will be able to do.' },
    level: { type: 'string', enum: LEVEL_KEYS },
    tags: { type: 'array', items: { type: 'string' }, description: '3-6 short topic tags.' },
    estimatedMinutes: { type: 'integer', description: 'Realistic total study time in minutes.' },
    modules: {
      type: 'array',
      description: `${MIN_MODULES}-${MAX_MODULES} modules, in teaching order.`,
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          summary: { type: 'string', description: 'One sentence on what this module covers.' },
          lessons: {
            type: 'array',
            description: `${MIN_LESSONS_PER_MODULE}-${MAX_LESSONS_PER_MODULE} lessons.`,
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                content: {
                  type: 'string',
                  description: 'The actual teaching text, 120-350 words, plain prose. This is what the student reads.'
                },
                keyPoints: { type: 'array', items: { type: 'string' }, description: '2-4 takeaways.' }
              },
              required: ['title', 'content', 'keyPoints']
            }
          }
        },
        required: ['title', 'summary', 'lessons']
      }
    },
    quiz: {
      type: 'array',
      description: `${MIN_QUESTIONS}-${MAX_QUESTIONS} multiple-choice questions covering the modules above.`,
      items: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          options: {
            type: 'array',
            items: { type: 'string' },
            description: `Exactly ${OPTIONS_PER_QUESTION} answer options.`
          },
          correctIndex: {
            type: 'integer',
            description: `0-based index into options of the single correct answer (0-${OPTIONS_PER_QUESTION - 1}).`
          },
          explanation: { type: 'string', description: 'Why the correct answer is correct.' }
        },
        required: ['prompt', 'options', 'correctIndex', 'explanation']
      }
    }
  },
  required: ['title', 'description', 'level', 'tags', 'estimatedMinutes', 'modules', 'quiz']
};

function fail(message) {
  return { success: false, error: { message } };
}

function ok(data) {
  return { success: true, data };
}

function cleanString(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function cleanStringArray(value, { max, maxLen }) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const entry of value) {
    const cleaned = cleanString(entry, maxLen);
    if (cleaned) out.push(cleaned);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Validates a designed course. Rejects (rather than repairs) anything that
 * would produce an unattemptable course or an ungradable quiz - a malformed
 * `correctIndex` in particular, since that is the single value the whole
 * pass/fail and certificate decision rests on.
 */
const courseDesignSchema = {
  safeParse(value) {
    if (!value || typeof value !== 'object') return fail('expected an object');

    const title = cleanString(value.title, 120);
    if (!title) return fail('missing "title"');

    const description = cleanString(value.description, 800);
    if (!description) return fail('missing "description"');

    const level = LEVEL_KEYS.includes(value.level) ? value.level : 'beginner';

    if (!Array.isArray(value.modules) || value.modules.length < MIN_MODULES) {
      return fail(`modules must be an array of at least ${MIN_MODULES} entries`);
    }

    const modules = [];
    for (const [i, mod] of value.modules.slice(0, MAX_MODULES).entries()) {
      if (!mod || typeof mod !== 'object') return fail(`module ${i} is not an object`);
      const modTitle = cleanString(mod.title, 160);
      if (!modTitle) return fail(`module ${i} is missing a title`);

      if (!Array.isArray(mod.lessons) || mod.lessons.length < MIN_LESSONS_PER_MODULE) {
        return fail(`module ${i} ("${modTitle}") needs at least ${MIN_LESSONS_PER_MODULE} lessons`);
      }

      const lessons = [];
      for (const [j, lesson] of mod.lessons.slice(0, MAX_LESSONS_PER_MODULE).entries()) {
        if (!lesson || typeof lesson !== 'object') return fail(`module ${i} lesson ${j} is not an object`);
        const lessonTitle = cleanString(lesson.title, 160);
        const content = cleanString(lesson.content, 6000);
        if (!lessonTitle) return fail(`module ${i} lesson ${j} is missing a title`);
        if (!content) return fail(`module ${i} lesson ${j} ("${lessonTitle}") has no content`);
        lessons.push({
          title: lessonTitle,
          content,
          keyPoints: cleanStringArray(lesson.keyPoints, { max: 6, maxLen: 300 })
        });
      }

      modules.push({
        title: modTitle,
        summary: cleanString(mod.summary, 400) || '',
        lessons
      });
    }

    if (!Array.isArray(value.quiz) || value.quiz.length < MIN_QUESTIONS) {
      return fail(`quiz must be an array of at least ${MIN_QUESTIONS} questions`);
    }

    const quiz = [];
    for (const [i, q] of value.quiz.slice(0, MAX_QUESTIONS).entries()) {
      if (!q || typeof q !== 'object') return fail(`quiz question ${i} is not an object`);

      const prompt = cleanString(q.prompt, 1000);
      if (!prompt) return fail(`quiz question ${i} is missing a prompt`);

      if (!Array.isArray(q.options) || q.options.length !== OPTIONS_PER_QUESTION) {
        return fail(`quiz question ${i} must have exactly ${OPTIONS_PER_QUESTION} options`);
      }
      const options = [];
      for (const [j, opt] of q.options.entries()) {
        const cleaned = cleanString(opt, 500);
        if (!cleaned) return fail(`quiz question ${i} option ${j} is empty`);
        options.push(cleaned);
      }
      if (new Set(options.map((o) => o.toLowerCase())).size !== options.length) {
        return fail(`quiz question ${i} has duplicate options`);
      }

      // The one field the pass/fail decision depends on - no coercion, no
      // defaulting to 0. A bad index means the whole course is rejected and
      // regenerated rather than silently mis-grading a student.
      const correctIndex = q.correctIndex;
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= OPTIONS_PER_QUESTION) {
        return fail(`quiz question ${i} has an out-of-range correctIndex: ${JSON.stringify(correctIndex)}`);
      }

      quiz.push({
        id: `q${i + 1}`,
        prompt,
        options,
        correctIndex,
        explanation: cleanString(q.explanation, 1000) || ''
      });
    }

    const estimatedMinutes =
      Number.isFinite(value.estimatedMinutes) && value.estimatedMinutes > 0
        ? Math.min(Math.round(value.estimatedMinutes), 24 * 60)
        : modules.reduce((sum, m) => sum + m.lessons.length * 8, 0);

    return ok({
      title,
      description,
      level,
      tags: cleanStringArray(value.tags, { max: 6, maxLen: 40 }),
      estimatedMinutes,
      modules,
      quiz
    });
  }
};

module.exports = {
  courseDesignSchema,
  COURSE_DESIGN_RESPONSE_SCHEMA,
  LEVEL_KEYS,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  OPTIONS_PER_QUESTION
};
