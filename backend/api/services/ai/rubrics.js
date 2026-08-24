// Ported from ai/ai-judge/src/rubrics.ts (verbatim from
// KATALYST_AI_SPEC.md §11.1-§11.8) - backend/api can't import that TS
// package directly (only services/ai/aiClientBridge.js dynamically imports
// the compiled @katalyst/ai-client, not @katalyst/ai-judge), so this is a
// deliberate plain-JS port of the same data, not a reimplementation of the
// scoring logic. Keep these two files in sync if the spec's rubrics change.

const RUBRIC_CRITERIA = {
  training_session: [
    { key: 'attendance', name: 'Attendance', weight_pct: 40, description: 'Physical/virtual presence for the session.' },
    { key: 'participation', name: 'Participation', weight_pct: 25, description: 'Active engagement during the session.' },
    { key: 'quiz_activity', name: 'Quiz / Activity', weight_pct: 25, description: 'Performance on in-session quiz or activity.' },
    { key: 'reflection_feedback', name: 'Reflection / Feedback', weight_pct: 10, description: 'Post-session reflection or feedback submitted.' }
  ],
  online_course: [
    { key: 'course_completion', name: 'Course Completion', weight_pct: 35, description: 'Modules/units completed.' },
    { key: 'assessment_score', name: 'Assessment Score', weight_pct: 30, description: 'Score on embedded assessments/quizzes.' },
    { key: 'certificate_evidence', name: 'Certificate Evidence', weight_pct: 15, description: 'Proof of completion certificate.' },
    { key: 'learning_reflection', name: 'Learning Reflection', weight_pct: 10, description: 'Reflection on what was learned.' },
    { key: 'timeliness', name: 'Timeliness', weight_pct: 10, description: 'Completed by the due date.' }
  ],
  assignment: [
    { key: 'requirement_completion', name: 'Requirement Completion', weight_pct: 25, description: 'All stated requirements addressed.' },
    { key: 'quality_accuracy', name: 'Quality / Accuracy', weight_pct: 30, description: 'Correctness and quality of the work.' },
    { key: 'application_of_learning', name: 'Application of Learning', weight_pct: 25, description: 'Demonstrated application of taught concepts.' },
    { key: 'originality_problem_solving', name: 'Originality / Problem Solving', weight_pct: 10, description: 'Original thinking or problem-solving approach.' },
    { key: 'timeliness', name: 'Timeliness', weight_pct: 10, description: 'Submitted by the due date.' }
  ],
  mentoring: [
    { key: 'session_attendance', name: 'Session Attendance', weight_pct: 20, description: 'Attended the mentoring session.' },
    { key: 'preparation', name: 'Preparation', weight_pct: 15, description: 'Came prepared with questions/updates.' },
    { key: 'participation', name: 'Participation', weight_pct: 20, description: 'Active engagement during the session.' },
    { key: 'action_item_completion', name: 'Action Item Completion', weight_pct: 30, description: 'Completed previously agreed action items.' },
    { key: 'reflection_progress_update', name: 'Reflection / Progress Update', weight_pct: 15, description: 'Reflected on progress since last session.' }
  ],
  project: [
    { key: 'problem_understanding', name: 'Problem Understanding', weight_pct: 15, description: 'Grasp of the problem being solved.' },
    { key: 'quality_of_solution', name: 'Quality of Solution', weight_pct: 25, description: 'Technical/creative quality of the solution.' },
    { key: 'practical_implementation', name: 'Practical Implementation', weight_pct: 20, description: 'Working, usable implementation.' },
    { key: 'documentation_presentation', name: 'Documentation / Presentation', weight_pct: 10, description: 'Clarity of documentation/presentation.' },
    { key: 'milestone_completion', name: 'Milestone Completion', weight_pct: 15, description: 'Milestones met on schedule.' },
    { key: 'collaboration', name: 'Collaboration / Individual Initiative', weight_pct: 15, description: "Team collaboration or individual initiative." }
  ],
  other: [
    { key: 'completion', name: 'Completion', weight_pct: 60, description: 'The activity was completed as described.' },
    { key: 'quality', name: 'Quality', weight_pct: 40, description: 'Quality of the completed work.' }
  ]
};

// backend/api's Activity.type enum (course/training/mentoring/project/
// assignment/milestone) doesn't line up 1:1 with the spec's ModuleType
// (§11) - this maps each real activity type to the closest seed rubric.
const ACTIVITY_TYPE_TO_RUBRIC = {
  course: 'online_course',
  training: 'training_session',
  mentoring: 'mentoring',
  project: 'project',
  assignment: 'assignment',
  milestone: 'other'
};

function getRubricCriteria(activityType) {
  return RUBRIC_CRITERIA[ACTIVITY_TYPE_TO_RUBRIC[activityType]] || RUBRIC_CRITERIA.other;
}

/** @returns {string|null} an error message if invalid, else null. Weights
 * must sum to 100 - same invariant as the fixed seed rubrics (see
 * ai/ai-judge's assertWeightsSumTo100) - since computeXp.js scales XP off
 * that total. */
function validateCustomRubric(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return 'customRubric must be a non-empty array';
  }
  const keys = new Set();
  let total = 0;
  for (const c of criteria) {
    if (!c || typeof c.key !== 'string' || !c.key.trim()) return 'each criterion needs a non-empty "key"';
    if (!c.name || typeof c.name !== 'string') return 'each criterion needs a non-empty "name"';
    if (typeof c.weightPct !== 'number' || c.weightPct < 0 || c.weightPct > 100) {
      return `criterion "${c.key}" needs a numeric weightPct between 0 and 100`;
    }
    if (keys.has(c.key)) return `duplicate criterion key: "${c.key}"`;
    keys.add(c.key);
    total += c.weightPct;
  }
  if (Math.abs(total - 100) > 0.01) return `criteria weights must sum to 100, got ${total}`;
  return null;
}

/** The rubric to actually use for scoring this activity - its own
 * customRubric when set and valid, else the fixed rubric for its type. An
 * invalid stored customRubric (shouldn't happen - validated on write, see
 * activityService.js) still falls back safely rather than breaking scoring. */
function getEffectiveRubric(activity) {
  if (Array.isArray(activity.customRubric) && activity.customRubric.length > 0) {
    if (!validateCustomRubric(activity.customRubric)) return activity.customRubric;
  }
  return getRubricCriteria(activity.type);
}

const PERFORMANCE_LEVEL_PERCENTAGES = {
  not_demonstrated: 0,
  developing: 50,
  proficient: 75,
  excellent: 100
};

module.exports = {
  RUBRIC_CRITERIA,
  ACTIVITY_TYPE_TO_RUBRIC,
  getRubricCriteria,
  getEffectiveRubric,
  validateCustomRubric,
  PERFORMANCE_LEVEL_PERCENTAGES
};
