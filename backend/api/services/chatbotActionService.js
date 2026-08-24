// Executes the real action the Chatbot's intent-classification chose (see
// services/ai/chatbotService.js) - reuses the same domain services every
// REST route already calls, so a chat-triggered enroll/submit-feedback/etc.
// goes through identical business logic (notifications, validation, side
// effects) as the equivalent button click.

const enrollmentService = require('./enrollmentService');
const feedbackService = require('./feedbackService');
const complaintService = require('./complaintService');
const notificationService = require('./notificationService');
const meetingService = require('./meetingService');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const { designCourse, CourseDesignError } = require('./ai/courseDesignService');

/** @returns {Promise<{ summary: string }>} a short, human confirmation to append to the chatbot's reply */
async function executeIntent(classification, user) {
  const { intent } = classification;

  switch (intent) {
    case 'enroll': {
      if (!classification.activity_id) return { summary: null };
      const enrollment = await enrollmentService.enroll(classification.activity_id, user._id.toString());
      const activity = await Activity.findById(classification.activity_id);
      return { summary: `✅ Enrolled you in "${activity?.title ?? 'that activity'}".`, enrollment };
    }

    case 'start_activity': {
      if (!classification.activity_id) return { summary: null };
      await enrollmentService.startActivity(classification.activity_id, user._id.toString());
      const activity = await Activity.findById(classification.activity_id);
      return { summary: `▶️ Marked "${activity?.title ?? 'that activity'}" as started.` };
    }

    case 'submit_feedback': {
      if (!classification.feedback_message) return { summary: null };
      await feedbackService.createFeedback(
        {
          category: classification.feedback_category || 'platform',
          rating: classification.feedback_rating || 5,
          message: classification.feedback_message
        },
        user._id.toString()
      );
      return { summary: '✅ Feedback submitted, thank you!' };
    }

    case 'submit_complaint': {
      if (!classification.complaint_description) return { summary: null };
      await complaintService.createComplaint(
        {
          category: classification.complaint_category || 'general',
          subject: classification.complaint_subject || 'Complaint via chatbot',
          description: classification.complaint_description,
          priority: classification.complaint_priority || 'medium'
        },
        user._id.toString()
      );
      return { summary: '✅ Complaint filed - programme staff have been notified.' };
    }

    case 'mark_notifications_read': {
      await notificationService.markAllAsRead(user);
      return { summary: '✅ All notifications marked as read.' };
    }

    case 'reschedule_meeting': {
      if (!classification.meeting_id || !classification.slot) return { summary: null };
      await meetingService.rescheduleMeeting(classification.meeting_id, user._id.toString(), classification.slot);
      return { summary: `✅ Session rescheduled to ${new Date(classification.slot).toLocaleString('en-IN')}.` };
    }

    case 'create_course': {
      if (!classification.course_description) return { summary: null };
      let design;
      try {
        design = await designCourse(classification.course_description);
      } catch (err) {
        if (err instanceof CourseDesignError) {
          return { summary: "⚠️ I couldn't design that course right now - try rephrasing the topic." };
        }
        throw err;
      }

      const isAdmin = user.role === 'admin';
      const activity = await Activity.create({
        title: design.title,
        description: design.description,
        type: 'course',
        difficulty: design.level,
        category: (design.tags && design.tags[0]) || 'AI-designed',
        xpReward: Math.min(800, Math.max(50, Math.round(design.estimatedMinutes / 2))),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        durationHours: Math.max(1, Math.round(design.estimatedMinutes / 60)),
        requirement: 'optional',
        certificate: false,
        participation: 'individual',
        instructions: design.description,
        modules: (design.modules || []).map((m) => m.title),
        courseContent: design,
        createdBy: user._id.toString(),
        // A student-suggested course lands as a draft for admin review; an
        // admin generating one via chat gets it published immediately, same
        // as using the "Create activity" form.
        status: isAdmin ? 'published' : 'draft'
      });

      if (!isAdmin) {
        await Notification.create({
          audience: 'admin',
          title: 'AI-suggested course pending review',
          body: `${user.name} asked the chatbot to design "${design.title}" - review it in Activities.`,
          kind: 'review',
          read: false
        });
      }

      return {
        summary: isAdmin
          ? `✅ Published "${design.title}" (${design.modules.length} modules, ${design.quiz.length} quiz questions).`
          : `✅ Drafted "${design.title}" and sent it to programme staff for review - you'll be notified once it's live.`,
        activity: activity.toJSON()
      };
    }

    case 'general_chat':
    default:
      return { summary: null };
  }
}

module.exports = { executeIntent };
