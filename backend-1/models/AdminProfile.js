const mongoose = require('mongoose');

const adminProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    department: {
      type: String,
      default: 'Programme Operations',
      trim: true
    },
    title: {
      type: String,
      default: 'Programme Manager',
      trim: true
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

const AdminProfile = mongoose.models.AdminProfile || mongoose.model('AdminProfile', adminProfileSchema);

module.exports = AdminProfile;
