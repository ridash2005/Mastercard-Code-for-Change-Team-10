const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema(
  {
    teamId: {
      type: String,
      required: true,
      ref: 'Team'
    },
    studentId: {
      type: String,
      required: true,
      ref: 'User'
    },
    role: {
      type: String,
      enum: [
        'Frontend Developer',
        'Backend Developer',
        'Database Developer',
        'QA Engineer',
        'Product Analyst'
      ],
      default: 'Frontend Developer'
    },
    contribution: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
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

teamMemberSchema.index({ teamId: 1, studentId: 1 }, { unique: true });

const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);

module.exports = TeamMember;
