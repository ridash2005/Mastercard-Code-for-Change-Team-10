const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    target: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['activities', 'xp', 'projects'],
      default: 'activities'
    },
    period: {
      type: String,
      enum: ['week', 'month', 'open'],
      default: 'week'
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

const Mission = mongoose.models.Mission || mongoose.model('Mission', missionSchema);

module.exports = Mission;
