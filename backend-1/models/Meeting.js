const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    mentorName: {
      type: String,
      required: [true, 'Mentor name is required'],
      trim: true
    },
    studentId: {
      type: String,
      ref: 'User',
      required: true
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required']
    },
    durationMinutes: {
      type: Number,
      default: 30
    },
    meetingMode: {
      type: String,
      enum: ['online', 'offline', 'hybrid'],
      default: 'online'
    },
    meetingLink: {
      type: String,
      default: ''
    },
    location: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['scheduled', 'rescheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    reschedulable: {
      type: Boolean,
      default: true
    },
    candidateSlots: {
      type: [Date],
      default: []
    },
    rescheduleDeadline: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
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

meetingSchema.index({ studentId: 1, scheduledAt: 1 });

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', meetingSchema);

module.exports = Meeting;
