const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    skills: {
      type: [String],
      default: []
    },
    interests: {
      type: [String],
      default: []
    },
    careerGoal: {
      type: String,
      default: ''
    },
    xp: {
      type: Number,
      default: 0
    },
    streak: {
      type: Number,
      default: 0
    },
    lastActiveAt: {
      type: Date,
      default: Date.now
    },
    teamId: {
      type: String,
      default: null
    },
    completedCourseIds: {
      type: [String],
      default: []
    },
    inactive: {
      type: Boolean,
      default: false
    },
    atRisk: {
      type: Boolean,
      default: false
    },
    onboarded: {
      type: Boolean,
      default: false
    },
    collegeName: {
      type: String,
      default: null,
      trim: true
    },
    dateOfBirth: {
      type: Date,
      default: null
    },
    academicField: {
      type: String,
      default: null,
      trim: true
    },
    programmeYear: {
      type: Number,
      min: 1,
      max: 4,
      default: null
    },
    bio: {
      type: String,
      default: null,
      maxlength: 1000
    },
    notificationPreferences: {
      emailNotificationsEnabled: { type: Boolean, default: true },
      courseRecommendationEmails: { type: Boolean, default: true },
      meetingUpdateEmails: { type: Boolean, default: true }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        ret.userId = ret.userId ? ret.userId.toString() : ret.userId;
        return ret;
      }
    }
  }
);

const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', studentProfileSchema);

module.exports = StudentProfile;
