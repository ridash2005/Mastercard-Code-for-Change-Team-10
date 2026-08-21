const mongoose = require('mongoose');

const submissionAttemptSchema = new mongoose.Schema(
  {
    submittedAt: {
      type: Date,
      default: Date.now
    },
    text: {
      type: String,
      default: ''
    },
    link: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    fileName: {
      type: String,
      default: ''
    }
  },
  {
    _id: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        return ret;
      }
    }
  }
);

const submissionSchema = new mongoose.Schema(
  {
    activityId: {
      type: String,
      required: true,
      ref: 'Activity'
    },
    studentId: {
      type: String,
      required: true,
      ref: 'User'
    },
    enrollmentId: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: [
        'submitted',
        'under_review',
        'approved',
        'needs_resubmission',
        'completed'
      ],
      default: 'submitted'
    },
    attempts: {
      type: [submissionAttemptSchema],
      default: []
    },
    score: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: ''
    },
    xpAwarded: {
      type: Number,
      default: 0
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewerId: {
      type: String,
      default: null
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

submissionSchema.index({ activityId: 1, studentId: 1 });

const Submission = mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

module.exports = Submission;
