const mongoose = require('mongoose');

const extracurricularSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    kind: {
      type: String,
      enum: [
        'club',
        'competition',
        'volunteering',
        'leadership',
        'sports',
        'cultural',
        'hackathon',
        'public_speaking'
      ],
      required: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    xpReward: {
      type: Number,
      default: 20
    },
    date: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.date) ret.date = ret.date.toISOString().slice(0, 10);
        return ret;
      }
    }
  }
);

const Extracurricular =
  mongoose.models.Extracurricular || mongoose.model('Extracurricular', extracurricularSchema);

module.exports = Extracurricular;
