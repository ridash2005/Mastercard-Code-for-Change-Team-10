const mongoose = require('mongoose');

const volunteerApplicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    interests: { type: [String], default: [] },
    skills: { type: [String], default: [] },
    college: { type: String, default: '', trim: true },
    message: { type: String, default: '', trim: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
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

volunteerApplicationSchema.index({ status: 1 });

const VolunteerApplication =
  mongoose.models.VolunteerApplication || mongoose.model('VolunteerApplication', volunteerApplicationSchema);

module.exports = VolunteerApplication;
