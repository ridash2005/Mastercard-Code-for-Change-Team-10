const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    audience: {
      type: String,
      enum: ['student', 'admin'],
      required: true
    },
    userId: {
      type: String,
      default: null,
      ref: 'User'
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    kind: {
      type: String,
      enum: [
        'deadline',
        'feedback',
        'xp',
        'achievement',
        'team',
        'streak',
        'reschedule',
        'ai',
        'review',
        'overdue',
        'risk',
        'participation'
      ],
      default: 'deadline'
    },
    read: {
      type: Boolean,
      default: false
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

notificationSchema.index({ audience: 1, userId: 1, read: 1 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification;
