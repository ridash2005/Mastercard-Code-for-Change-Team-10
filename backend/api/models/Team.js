const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true
    },
    projectTitle: {
      type: String,
      default: '',
      trim: true
    },
    rank: {
      type: Number,
      default: 1
    },
    cohort: {
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

const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);

module.exports = Team;
