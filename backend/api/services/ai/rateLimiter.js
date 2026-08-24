// In-memory sliding-window rate limiter, scoped per authenticated user per
// route. Good enough for a single-process hackathon deployment; swap for a
// Redis-backed limiter (Upstash, per the backend spec) before scaling past
// one instance.

function createRateLimiter({ windowMs, max, keyPrefix }) {
  /** @type {Map<string, number[]>} */
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const subject = req.user && req.user._id ? String(req.user._id) : req.ip;
    const key = `${keyPrefix}:${subject}`;
    const now = Date.now();

    const timestamps = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        message: `Rate limit exceeded for ${keyPrefix} - try again shortly.`
      });
    }

    timestamps.push(now);
    hits.set(key, timestamps);
    next();
  };
}

// AI Coach: conversational, but still bounded - protects against abuse and
// unbounded LLM API spend from a single account.
const aiCoachLimiter = createRateLimiter({ windowMs: 60_000, max: 15, keyPrefix: 'ai_coach' });

// AI Judge scoring: admin-only and internal-key-gated already, but still
// rate-limited so a compromised admin session/key can't be used to flood the
// LLM provider.
const aiJudgeLimiter = createRateLimiter({ windowMs: 60_000, max: 30, keyPrefix: 'ai_judge' });

// Chatbot: can trigger real writes (enroll, submit feedback/complaints,
// reschedule, create a draft course), so kept tighter than the
// conversational-only Coach - protects against both LLM spend and
// action-spam from a single account.
const aiChatbotLimiter = createRateLimiter({ windowMs: 60_000, max: 10, keyPrefix: 'ai_chatbot' });

module.exports = { createRateLimiter, aiCoachLimiter, aiJudgeLimiter, aiChatbotLimiter };
