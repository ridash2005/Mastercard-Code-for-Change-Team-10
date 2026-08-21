// Append-only audit trail (KATALYST_BACKEND_SPEC.md §3.25), used here to log
// every request that reaches the AI gateway - allowed or blocked - so the
// guardrail layer's decisions are traceable. No route ever updates/deletes
// a document in this collection.

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true // e.g. 'ai_coach_message', 'ai_coach_blocked', 'ai_judge_score', 'ai_judge_blocked'
    },
    entityType: {
      type: String,
      required: true // e.g. 'ai_coach', 'ai_judge'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    diff: {
      type: mongoose.Schema.Types.Mixed,
      default: {} // never store passwords/tokens/provider secrets here
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
