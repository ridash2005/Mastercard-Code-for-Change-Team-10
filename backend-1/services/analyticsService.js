const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const Activity = require('../models/Activity');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const Certificate = require('../models/Certificate');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');

const getOverview = async () => {
  const [
    totalStudents,
    totalActivities,
    pendingSubmissions,
    atRiskStudents,
    inactiveStudents,
    totalCertificates,
    openComplaints,
    allEnrollments
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Activity.countDocuments({ status: { $ne: 'archived' } }),
    Submission.countDocuments({ status: { $in: ['submitted', 'under_review'] } }),
    StudentProfile.countDocuments({ atRisk: true }),
    StudentProfile.countDocuments({ inactive: true }),
    Certificate.countDocuments(),
    Complaint.countDocuments({ status: { $ne: 'resolved' } }),
    Enrollment.find()
  ]);

  const completedEnrollments = allEnrollments.filter((e) =>
    ['completed', 'approved'].includes(e.status)
  ).length;

  const completionRate = allEnrollments.length
    ? Math.round((completedEnrollments / allEnrollments.length) * 100)
    : 0;

  return {
    totalStudents,
    totalActivities,
    pendingSubmissions,
    atRiskStudents,
    inactiveStudents,
    totalCertificates,
    openComplaints,
    totalEnrollments: allEnrollments.length,
    completedEnrollments,
    completionRate
  };
};

const getReports = async (query = {}) => {
  const { cohort } = query;

  let userFilter = { role: 'student' };
  if (cohort) userFilter.cohort = cohort;

  const students = await User.find(userFilter);
  const studentIds = students.map((s) => s.id);

  const [profiles, enrollments, submissions] = await Promise.all([
    StudentProfile.find({ userId: { $in: studentIds } }),
    Enrollment.find({ studentId: { $in: studentIds } }),
    Submission.find({ studentId: { $in: studentIds } })
  ]);

  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const studentReports = students.map((st) => {
    const p = profileMap.get(st.id);
    const studentEnrollments = enrollments.filter((e) => e.studentId === st.id);
    const studentSubmissions = submissions.filter((s) => s.studentId === st.id);
    const completed = studentEnrollments.filter((e) =>
      ['completed', 'approved'].includes(e.status)
    ).length;

    return {
      studentId: st.id,
      name: st.name,
      email: st.email,
      college: st.college || p?.collegeName || '',
      programme: st.programme || '',
      xp: p?.xp || 0,
      streak: p?.streak || 0,
      atRisk: p?.atRisk || false,
      inactive: p?.inactive || false,
      enrollmentsCount: studentEnrollments.length,
      completedCount: completed,
      completionRate: studentEnrollments.length
        ? Math.round((completed / studentEnrollments.length) * 100)
        : 0,
      submissionsCount: studentSubmissions.length
    };
  });

  return studentReports;
};

module.exports = {
  getOverview,
  getReports
};
