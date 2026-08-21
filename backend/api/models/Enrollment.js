const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    status: {
      type: String,
      enum: [
        'not_started',
        'in_progress',
        'submitted',
        'under_review',
        'approved',
        'needs_resubmission',
        'completed'
      ],
      default: 'not_started'
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.startedAt) ret.startedAt = ret.startedAt.toISOString().slice(0, 10);
        if (ret.completedAt) ret.completedAt = ret.completedAt.toISOString().slice(0, 10);
        return ret;
      }
    }
  }
);

enrollmentSchema.index({ activityId: 1, studentId: 1 }, { unique: true });

const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
