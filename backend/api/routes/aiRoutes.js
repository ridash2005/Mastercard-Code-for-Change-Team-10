// The ONLY HTTP surface for AI functionality. The frontend is only ever
// allowed to reach this router (never `/ai` directly - that package has no
// HTTP server and is only imported in-process by services/ai/aiClientBridge.js).
//
// Policing, in order, for every request that lands here:
//   1. authenticate      - valid JWT required (no anonymous access at all)
//   2. authorize/internal - route-specific role + service-key checks
//   3. rate limiter       - per-user request cap
//   4. controller         - input guardrail -> AI call -> output guardrail

const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/authMiddleware');
const { requireInternalServiceKey } = require('../middleware/aiAccessMiddleware');
const { aiCoachLimiter, aiJudgeLimiter, aiChatbotLimiter } = require('../services/ai/rateLimiter');
const aiController = require('../controllers/aiController');

router.use(authenticate);

// Any authenticated student or admin can talk to the Coach.
router.post('/coach/message', aiCoachLimiter, aiController.coachMessage);

// General chatbot - conversational, but can also trigger real actions
// (enroll, submit feedback/complaint, reschedule, draft a course) - see
// services/ai/chatbotService.js. Any authenticated student or admin.
router.post('/chatbot/message', aiChatbotLimiter, aiController.chatbotMessage);

// Not client-facing (KATALYST_AI_SPEC.md §2.1) - admin role AND the internal
// service key are both required, so a browser admin session alone can't
// trigger scoring; only a trusted server-side caller that knows the secret can.
router.post(
  '/judge/score-submission',
  authorize('admin'),
  requireInternalServiceKey,
  aiJudgeLimiter,
  aiController.judgeScoreSubmission
);

module.exports = router;
