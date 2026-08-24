// The only controller that talks to `/ai` (via services/ai/*). Every
// handler here: (1) requires an authenticated user (enforced by the router,
// see routes/aiRoutes.js), (2) runs input through the guardrail layer before
// any LLM call, (3) audit-logs the outcome, (4) runs output through the
// guardrail layer before it ever reaches the response body.

const { sanitizeAndValidateInput, GuardrailError } = require('../services/ai/inputGuard');
const { getCoachReply, AiCoachError } = require('../services/ai/aiCoachService');
const { scoreSubmission, AiJudgeError } = require('../services/ai/aiJudgeService');
const { getChatbotReply, ChatbotError } = require('../services/ai/chatbotService');
const { OutputGuardrailError } = require('../services/ai/outputGuard');
const AuditLog = require('../models/AuditLog');

async function logAudit(actorUserId, action, entityType, diff) {
  try {
    await AuditLog.create({ actorUserId, action, entityType, diff });
  } catch (err) {
    // Audit logging must never fail the request it's logging.
    console.error('AuditLog write failed:', err.message);
  }
}

exports.coachMessage = async (req, res) => {
  const { message } = req.body;

  let guard;
  try {
    guard = sanitizeAndValidateInput(message);
  } catch (err) {
    if (err instanceof GuardrailError) {
      return res.status(400).json({ success: false, message: err.message, code: err.code });
    }
    throw err;
  }

  if (guard.blockedReason) {
    await logAudit(req.user._id, 'ai_coach_blocked', 'ai_coach', {
      reason: guard.blockedReason,
      intent: guard.intent
    });
    return res.status(422).json({
      success: false,
      message: 'Your message was blocked by AI safety guardrails.',
      reason: guard.blockedReason
    });
  }

  try {
    const reply = await getCoachReply(guard.clean);
    await logAudit(req.user._id, 'ai_coach_message', 'ai_coach', {
      intent: guard.intent,
      flags: guard.flags
    });
    return res.json({ success: true, data: { reply, intent: guard.intent } });
  } catch (err) {
    await logAudit(req.user._id, 'ai_coach_error', 'ai_coach', { error: err.message });
    const status = err instanceof AiCoachError || err instanceof OutputGuardrailError ? 502 : 500;
    return res.status(status).json({
      success: false,
      message: 'AI Coach is temporarily unavailable. Please try again shortly.'
    });
  }
};

exports.chatbotMessage = async (req, res) => {
  const { message } = req.body;

  let guard;
  try {
    guard = sanitizeAndValidateInput(message);
  } catch (err) {
    if (err instanceof GuardrailError) {
      return res.status(400).json({ success: false, message: err.message, code: err.code });
    }
    throw err;
  }

  if (guard.blockedReason) {
    await logAudit(req.user._id, 'ai_chatbot_blocked', 'ai_chatbot', {
      reason: guard.blockedReason,
      intent: guard.intent
    });
    return res.status(422).json({
      success: false,
      message: 'Your message was blocked by AI safety guardrails.',
      reason: guard.blockedReason
    });
  }

  try {
    const { reply, intent } = await getChatbotReply(guard.clean, req.user);
    await logAudit(req.user._id, 'ai_chatbot_message', 'ai_chatbot', { intent });
    return res.json({ success: true, data: { reply, intent } });
  } catch (err) {
    await logAudit(req.user._id, 'ai_chatbot_error', 'ai_chatbot', { error: err.message });
    const status = err instanceof ChatbotError || err instanceof OutputGuardrailError ? 502 : 500;
    return res.status(status).json({
      success: false,
      message: 'The chatbot is temporarily unavailable. Please try again shortly.'
    });
  }
};

exports.judgeScoreSubmission = async (req, res) => {
  const { submission_text: submissionText, rubric_criteria: rubricCriteria } = req.body;

  if (!Array.isArray(rubricCriteria) || rubricCriteria.length === 0) {
    return res.status(400).json({ success: false, message: 'rubric_criteria must be a non-empty array' });
  }
  for (const criterion of rubricCriteria) {
    if (!criterion || typeof criterion.key !== 'string' || typeof criterion.weightPct !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'each rubric_criteria entry needs a string "key" and numeric "weightPct"'
      });
    }
  }

  let guard;
  try {
    guard = sanitizeAndValidateInput(submissionText, { maxLen: 20000 });
  } catch (err) {
    if (err instanceof GuardrailError) {
      return res.status(400).json({ success: false, message: err.message, code: err.code });
    }
    throw err;
  }

  if (guard.blockedReason) {
    await logAudit(req.user._id, 'ai_judge_blocked', 'ai_judge', {
      reason: guard.blockedReason,
      intent: guard.intent
    });
    return res.status(422).json({
      success: false,
      message: 'Submission text was blocked by AI safety guardrails.',
      reason: guard.blockedReason,
      status: 'pending_review',
      flags: [guard.blockedReason]
    });
  }

  try {
    const result = await scoreSubmission(guard.clean, rubricCriteria);
    await logAudit(req.user._id, 'ai_judge_score', 'ai_judge', {
      confidence: result.confidence,
      flags: result.flags
    });
    // XP is intentionally NOT computed here - the deterministic XP formula
    // (ai/ai-judge/src/xp.ts) is a pure service-layer function the caller
    // must run against these validated levels; this endpoint only returns
    // guardrail-checked criterion levels, never a number to trust as-is.
    return res.json({ success: true, data: result });
  } catch (err) {
    await logAudit(req.user._id, 'ai_judge_error', 'ai_judge', { error: err.message });
    if (err instanceof AiJudgeError) {
      // Mirrors KATALYST_AI_SPEC.md §2.2: malformed/unknown-key output after
      // retry routes straight to pending_review with ai_parse_error.
      return res.status(200).json({
        success: false,
        status: 'pending_review',
        flags: ['ai_parse_error'],
        message: err.message
      });
    }
    return res.status(500).json({ success: false, message: 'AI Judge scoring failed unexpectedly.' });
  }
};
