const mongoose = require('mongoose');

const collaborationResponseSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending'
    }
  },
  { _id: false }
);

const collaborationSchema = new mongoose.Schema(
  {
    studentIds: {
      type: [String],
      required: true,
      validate: (v) => Array.isArray(v) && v.length >= 2
    },
    projectTitle: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    adminRationale: {
      type: String,
      default: '',
      trim: true
    },
    // Shown to students - deliberately generic (see routes/collaborationRoutes.js)
    // rather than the admin's full skill-matching rationale.
    studentMessage: {
      type: String,
      default: 'Your skill sets complement each other.'
    },
    responses: {
      type: [collaborationResponseSchema],
      default: []
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

collaborationSchema.index({ studentIds: 1 });

const Collaboration = mongoose.models.Collaboration || mongoose.model('Collaboration', collaborationSchema);

module.exports = Collaboration;
