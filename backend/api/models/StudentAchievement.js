const mongoose = require('mongoose');

const studentAchievementSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      ref: 'User'
    },
    achievementId: {
      type: String,
      required: true,
      ref: 'Achievement'
    },
    unlockedAt: {
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
        if (ret.unlockedAt) ret.unlockedAt = ret.unlockedAt.toISOString().slice(0, 10);
        return ret;
      }
    }
  }
);

studentAchievementSchema.index({ studentId: 1, achievementId: 1 }, { unique: true });

const StudentAchievement =
  mongoose.models.StudentAchievement || mongoose.model('StudentAchievement', studentAchievementSchema);

module.exports = StudentAchievement;
