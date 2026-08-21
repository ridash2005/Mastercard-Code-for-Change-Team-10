const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true }
  },
  { _id: false }
);

const activitySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Activity title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['course', 'training', 'mentoring', 'project', 'assignment', 'milestone'],
      required: [true, 'Activity type is required']
    },
    domain: {
      type: String,
      enum: [
        'Software Engineering',
        'Data & AI',
        'Product',
        'Payments & Trust',
        'Communication',
        'Leadership'
      ],
      default: 'Software Engineering'
    },
    problemDomain: {
      type: String,
      enum: [
        'Financial Inclusion',
        'Digital Payments',
        'Cybersecurity',
        'Women in STEM',
        'Campus Employability',
        'Climate & Cities'
      ],
      default: 'Campus Employability'
    },
    category: {
      type: String,
      default: 'General'
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    xpReward: {
      type: Number,
      default: 50,
      min: 0
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    durationHours: {
      type: Number,
      default: 1
    },
    requirement: {
      type: String,
      enum: ['mandatory', 'optional'],
      default: 'optional'
    },
    certificate: {
      type: Boolean,
      default: false
    },
    participation: {
      type: String,
      enum: ['individual', 'team'],
      default: 'individual'
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    instructions: {
      type: String,
      default: ''
    },
    createdBy: {
      type: String,
      default: null
    },
    // Type-specific extensions
    modules: {
      type: [String],
      default: []
    }, // Course
    location: {
      type: String,
      default: ''
    }, // Training session
    slots: {
      type: [String],
      default: []
    }, // Training / Mentoring slots
    mentor: {
      type: String,
      default: ''
    }, // Mentoring session
    repoHint: {
      type: String,
      default: ''
    }, // Project
    maxScore: {
      type: Number,
      default: 100
    }, // Assignment
    checkpoint: {
      type: String,
      default: ''
    }, // Milestone
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id ? ret._id.toString() : ret.id;
        if (ret.startDate) ret.startDate = ret.startDate.toISOString().slice(0, 10);
        if (ret.dueDate) ret.dueDate = ret.dueDate.toISOString().slice(0, 10);
        return ret;
      }
    }
  }
);

activitySchema.index({ type: 1, domain: 1, requirement: 1, dueDate: 1 });

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

module.exports = Activity;
