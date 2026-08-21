const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'User'
    },
    activityId: {
      type: String,
      required: true,
      ref: 'Activity'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    issuedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.issuedAt) ret.issuedAt = ret.issuedAt.toISOString().slice(0, 10);
        return ret;
      }
    }
  }
);

certificateSchema.index({ studentId: 1, activityId: 1 });

const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
