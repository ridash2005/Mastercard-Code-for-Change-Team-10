// Structured output for the agentic Chatbot (services/ai/chatbotService.js).
// Same two-layer pattern as schemas.js/courseSchemas.js: a Gemini
// `responseSchema` to constrain the provider's output shape, plus a
// hand-rolled `.safeParse` as the actual trust boundary.

const INTENTS = [
  'enroll',
  'start_activity',
  'submit_feedback',
  'submit_complaint',
  'mark_notifications_read',
  'reschedule_meeting',
  'create_course',
  'general_chat'
];

const CHATBOT_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: INTENTS },
    reply: { type: 'string', description: "The chatbot's conversational reply to show the student, plain text." },
    activity_id: {
      type: 'string',
      nullable: true,
      description: 'For enroll/start_activity - the id of the matching activity from the provided list, or null if none matches.'
    },
    meeting_id: {
      type: 'string',
      nullable: true,
      description: 'For reschedule_meeting - the id of the matching meeting from the provided list, or null if none matches.'
    },
    slot: {
      type: 'string',
      nullable: true,
      description: "For reschedule_meeting - one of the matched meeting's candidateSlots (ISO datetime), or null."
    },
    feedback_rating: { type: 'integer', nullable: true, description: 'For submit_feedback - 1 to 5.' },
    feedback_message: { type: 'string', nullable: true, description: 'For submit_feedback.' },
    feedback_category: { type: 'string', nullable: true, description: 'For submit_feedback, e.g. "platform", "course".' },
    complaint_subject: { type: 'string', nullable: true, description: 'For submit_complaint - short subject line.' },
    complaint_description: { type: 'string', nullable: true, description: 'For submit_complaint - full detail.' },
    complaint_priority: { type: 'string', enum: ['low', 'medium', 'high'], nullable: true },
    complaint_category: { type: 'string', nullable: true, description: 'For submit_complaint, e.g. "technical", "academic".' },
    course_description: {
      type: 'string',
      nullable: true,
      description: 'For create_course - the topic/description to design a course for, cleaned up from the student\'s message.'
    }
  },
  required: ['intent', 'reply']
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
  return trimmed ? trimmed.slice(0, max) : null;
}

const chatbotResponseSchema = {
  safeParse(value) {
    if (!value || typeof value !== 'object') return fail('expected an object');
    if (!INTENTS.includes(value.intent)) return fail(`invalid intent: ${JSON.stringify(value.intent)}`);

    const reply = cleanString(value.reply, 2000);
    if (!reply) return fail('missing "reply"');

    return ok({
      intent: value.intent,
      reply,
      activity_id: cleanString(value.activity_id, 64),
      meeting_id: cleanString(value.meeting_id, 64),
      slot: cleanString(value.slot, 64),
      feedback_rating:
        Number.isInteger(value.feedback_rating) && value.feedback_rating >= 1 && value.feedback_rating <= 5
          ? value.feedback_rating
          : null,
      feedback_message: cleanString(value.feedback_message, 1000),
      feedback_category: cleanString(value.feedback_category, 60) || 'platform',
      complaint_subject: cleanString(value.complaint_subject, 160),
      complaint_description: cleanString(value.complaint_description, 2000),
      complaint_priority: ['low', 'medium', 'high'].includes(value.complaint_priority) ? value.complaint_priority : 'medium',
      complaint_category: cleanString(value.complaint_category, 60) || 'general',
      course_description: cleanString(value.course_description, 500)
    });
  }
};

module.exports = { INTENTS, CHATBOT_RESPONSE_SCHEMA, chatbotResponseSchema };
