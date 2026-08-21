const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User'
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    attachmentName: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'in_progress', 'resolved'],
      default: 'submitted'
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

complaintSchema.index({ userId: 1, status: 1 });

const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

module.exports = Complaint;
