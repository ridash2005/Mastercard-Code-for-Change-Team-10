// Agentic Chatbot - classifies the student's message into an intent (and
// extracts the parameters that intent needs) via a guarded LLM call, then
// hands off to services/chatbotActionService.js to actually perform it.
// Same guarded-LLM-call pattern as aiCoachService.js/aiJudgeService.js.

const { getLlmClient } = require('./aiClientBridge');
const { chatbotResponseSchema, CHATBOT_RESPONSE_SCHEMA } = require('./chatbotSchemas');
const { guardChatbotReply, OutputGuardrailError } = require('./outputGuard');
const { CHATBOT_SYSTEM_PROMPT } = require('./chatbotPrompt');
const { executeIntent } = require('../chatbotActionService');
const Activity = require('../../models/Activity');
const Meeting = require('../../models/Meeting');

class ChatbotError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'ChatbotError';
    this.cause = cause;
  }
}

const MAX_CONTEXT_ITEMS = 25;

/** Builds the "here's what's available to act on" context the model needs
 * to resolve activity/meeting names to real ids - see chatbotPrompt.js
 * rule 2. Kept small and role/user-scoped, never a full data dump. */
async function buildContext(user) {
  const isAdmin = user.role === 'admin';

  const activities = await Activity.find(isAdmin ? {} : { status: { $ne: 'draft' } })
    .sort({ createdAt: -1 })
    .limit(MAX_CONTEXT_ITEMS)
    .select('title type');

  const meetings = await Meeting.find(isAdmin ? {} : { studentId: user._id.toString() })
    .sort({ scheduledAt: 1 })
    .limit(MAX_CONTEXT_ITEMS)
    .select('title candidateSlots reschedulable');

  return {
    activitiesText: activities.length
      ? activities.map((a) => `- id=${a.id} title="${a.title}" type=${a.type}`).join('\n')
      : '(none available)',
    meetingsText: meetings.length
      ? meetings
          .filter((m) => m.reschedulable !== false)
          .map((m) => `- id=${m.id} title="${m.title}" candidateSlots=${JSON.stringify(m.candidateSlots || [])}`)
          .join('\n')
      : '(none scheduled)'
  };
}

/**
 * @param {string} guardedMessage - already sanitized by inputGuard
 * @param {object} user - the authenticated req.user (Mongoose User doc)
 * @returns {Promise<{ reply: string, intent: string, actionResult?: object }>}
 */
async function getChatbotReply(guardedMessage, user) {
  const client = await getLlmClient();
  const { activitiesText, meetingsText } = await buildContext(user);

  const userPrompt = `Student message: "${guardedMessage}"

Available activities (for enroll/start_activity):
${activitiesText}

Available meetings (for reschedule_meeting):
${meetingsText}

Caller role: ${user.role}`;

  let classification;
  try {
    classification = await client.generateJson({
      systemPrompt: CHATBOT_SYSTEM_PROMPT,
      userPrompt,
      schema: chatbotResponseSchema,
      responseSchema: CHATBOT_RESPONSE_SCHEMA,
      temperature: 0.3
    });
  } catch (err) {
    throw new ChatbotError('Chatbot did not return schema-valid output', err);
  }

  let reply;
  try {
    reply = guardChatbotReply(classification.reply);
  } catch (err) {
    if (err instanceof OutputGuardrailError) throw err;
    throw new ChatbotError('Chatbot reply failed output guardrails', err);
  }

  // submit_complaint intentionally never auto-executes for anything that
  // sounds like a safety/emergency issue - the model is instructed to
  // route those to general_chat (chatbotPrompt.js rule), so no separate
  // check is needed here; this is a second line of defense on the intent
  // itself rather than re-parsing free text.
  let actionResult = null;
  let actionError = null;
  try {
    actionResult = await executeIntent(classification, user);
  } catch (err) {
    // Never let a failed action pass silently under a reply that (per the
    // prompt) may still read as "in progress" - the model can't know yet
    // whether this will succeed, so the real outcome below is always what
    // the student actually sees happened, not what the model predicted.
    console.error('Chatbot action execution failed:', err);
    actionError = err.message || 'that action failed';
  }

  // Every action intent (anything but general_chat, where no action was
  // attempted) gets an explicit, authoritative outcome line appended -
  // success or failure - so the model's necessarily-uncertain "in
  // progress" phrasing is never left uncorrected.
  let finalReply = reply;
  if (classification.intent !== 'general_chat') {
    if (actionResult?.summary) {
      finalReply = `${reply}\n\n${actionResult.summary}`;
    } else if (actionError) {
      finalReply = `${reply}\n\n⚠️ That didn't go through: ${actionError}`;
    } else {
      // No summary and no error means executeIntent's own early-return
      // path (e.g. no matching activity_id/meeting_id was resolved).
      finalReply = `${reply}\n\n⚠️ I couldn't find a clear match to act on - could you be more specific?`;
    }
  }

  return { reply: finalReply, intent: classification.intent };
}

module.exports = { getChatbotReply, ChatbotError };
