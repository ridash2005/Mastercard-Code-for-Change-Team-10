const mongoose = require('mongoose');

const xpTransactionSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'User'
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    activityId: {
      type: String,
      default: null,
      ref: 'Activity'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      }
    }
  }
);

xpTransactionSchema.index({ studentId: 1, createdAt: -1 });

const XPTransaction = mongoose.models.XPTransaction || mongoose.model('XPTransaction', xpTransactionSchema);

module.exports = XPTransaction;
