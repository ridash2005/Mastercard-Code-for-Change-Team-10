const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    externalId: {
      type: String,
      default: null,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    // Not required at the schema level - an OAuth-only account (Google/
    // GitHub, see authProvider/googleId/githubId below) never sets this.
    // authService.register enforces the "password required for local
    // sign-up" rule itself, with a clean error message instead of a raw
    // Mongoose validation error.
    passwordHash: {
      type: String,
      default: null,
      minlength: 6
    },
    // 'local' = signed up with email+password. An OAuth account also gets
    // 'google'/'github' recorded as how it was FIRST created, but a local
    // account can still link a provider later (matched by email) - see
    // authService.findOrCreateOAuthUser - so this is informational, not a
    // hard gate on which sign-in methods work.
    authProvider: {
      type: String,
      enum: ['local', 'google', 'github'],
      default: 'local'
    },
    // No `default: null` deliberately - the sparse unique index below only
    // skips a document where the field is truly absent, not one where it's
    // explicitly set to null. Every user would otherwise collide on
    // `githubId: null` the moment a second one existed.
    googleId: {
      type: String
    },
    githubId: {
      type: String
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student'
    },
    college: {
      type: String,
      default: '',
      trim: true
    },
    programme: {
      type: String,
      default: 'Katalyst Fellows 2026',
      trim: true
    },
    avatar: {
      type: String,
      default: ''
    },
    cohort: {
      type: String,
      default: null
    },
    batchYear: {
      type: Number,
      min: 1,
      max: 4,
      default: null
    },
    onboardingCompleted: {
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
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

// Sparse so any number of users can have no googleId/githubId (the common
// case - local accounts), while still enforcing uniqueness once one is set.
userSchema.index({ googleId: 1 }, { unique: true, sparse: true });
userSchema.index({ githubId: 1 }, { unique: true, sparse: true });

// Hash password before saving. Never runs for an OAuth-only account (no
// passwordHash ever set -> isModified stays false).
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash') || !this.passwordHash) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password helper - false (not a crash) for an OAuth-only account
// that has no passwordHash to compare against.
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
