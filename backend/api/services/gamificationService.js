const StudentProfile = require('../models/StudentProfile');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Activity = require('../models/Activity');
const Achievement = require('../models/Achievement');
const StudentAchievement = require('../models/StudentAchievement');
const Mission = require('../models/Mission');
const XPTransaction = require('../models/XPTransaction');
const Team = require('../models/Team');

const XP_PER_LEVEL = 400;

const levelFromXp = (xp) => {
  const safe = Math.max(0, xp || 0);
  const level = Math.floor(safe / XP_PER_LEVEL) + 1;
  const intoLevel = safe % XP_PER_LEVEL;
  const nextLevelXp = level * XP_PER_LEVEL;
  return {
    level,
    intoLevel,
    nextLevelXp,
    xpToNext: XP_PER_LEVEL - intoLevel,
    progress: (intoLevel / XP_PER_LEVEL) * 100,
    xpPerLevel: XP_PER_LEVEL
  };
};

const getLeaderboard = async (query = {}) => {
  const { limit = 50, cohort } = query;

  let userFilter = { role: 'student' };
  if (cohort) {
    userFilter.cohort = cohort;
  }

  const students = await User.find(userFilter);
  const studentIds = students.map((s) => s._id.toString());

  const profiles = await StudentProfile.find({
    userId: { $in: studentIds }
  }).sort({ xp: -1 });

  const userMap = new Map(students.map((u) => [u.id, u]));

  return profiles.slice(0, parseInt(limit)).map((p, index) => {
    const u = userMap.get(p.userId.toString());
    const lvl = levelFromXp(p.xp);
    return {
      rank: index + 1,
      userId: p.userId,
      name: u?.name || 'Student',
      email: u?.email || '',
      avatar: u?.avatar || '',
      college: u?.college || p.collegeName || '',
      programme: u?.programme || '',
      xp: p.xp,
      level: lvl.level,
      streak: p.streak,
      teamId: p.teamId
    };
  });
};

const getDashboard = async (studentId) => {
  const [user, profile, allProfiles, enrollments, activities, unlocked] = await Promise.all([
    User.findById(studentId),
    StudentProfile.findOne({ userId: studentId }),
    StudentProfile.find().sort({ xp: -1 }),
    Enrollment.find({ studentId }),
    Activity.find().sort({ dueDate: 1 }),
    StudentAchievement.find({ studentId })
  ]);

  const userXp = profile?.xp || 0;
  const lvl = levelFromXp(userXp);

  // Compute global rank
  const rankIndex = allProfiles.findIndex((p) => p.userId.toString() === studentId.toString());
  const rank = rankIndex !== -1 ? rankIndex + 1 : allProfiles.length + 1;

  // Completion calculation
  const completedCount = enrollments.filter(
    (e) => e.status === 'completed' || e.status === 'approved'
  ).length;
  const pendingCount = enrollments.filter(
    (e) => !['completed', 'approved'].includes(e.status)
  ).length;
  const completion = enrollments.length
    ? Math.round((completedCount / enrollments.length) * 100)
    : 0;

  // Continue learning items
  const continueEnrollments = enrollments.filter(
    (e) => e.status === 'in_progress' || e.status === 'needs_resubmission'
  );
  const continueActivityIds = continueEnrollments.map((e) => e.activityId);
  const continueActivities = activities
    .filter((a) => continueActivityIds.includes(a.id))
    .map((a) => {
      const en = continueEnrollments.find((e) => e.activityId === a.id);
      const obj = a.toJSON();
      obj.status = en?.status;
      return obj;
    });

  // Upcoming deadlines (enrolled, not completed)
  const openEnrolledIds = enrollments
    .filter((e) => !['completed', 'approved'].includes(e.status))
    .map((e) => e.activityId);
  const upcomingDeadlines = activities
    .filter((a) => openEnrolledIds.includes(a.id))
    .slice(0, 4);

  // Recommended activities (not enrolled)
  const enrolledIds = new Set(enrollments.map((e) => e.activityId));
  const recommendations = activities.filter((a) => !enrolledIds.has(a.id)).slice(0, 4);

  // Top 5 leaderboard preview
  const topLeaderboard = await getLeaderboard({ limit: 5 });

  // Unlocked achievements
  const achievementIds = unlocked.map((u) => u.achievementId);
  const achievements = await Achievement.find({ _id: { $in: achievementIds } });

  // Team info
  let team = null;
  if (profile?.teamId) {
    team = await Team.findById(profile.teamId);
  }

  return {
    user,
    profile,
    gamification: {
      xp: userXp,
      level: lvl.level,
      xpToNext: lvl.xpToNext,
      progress: lvl.progress,
      streak: profile?.streak || 0,
      rank,
      completion,
      completedCount,
      pendingCount
    },
    continueActivities,
    upcomingDeadlines,
    recommendations,
    leaderboardPreview: topLeaderboard,
    achievements,
    team
  };
};

const getAchievements = async (studentId = null) => {
  const allAchievements = await Achievement.find();

  if (!studentId) {
    return allAchievements;
  }

  const unlocked = await StudentAchievement.find({ studentId });
  const unlockedMap = new Map(unlocked.map((u) => [u.achievementId, u.unlockedAt]));

  return allAchievements.map((ach) => {
    const obj = ach.toJSON();
    obj.unlocked = unlockedMap.has(ach.id) || unlockedMap.has(ach.key);
    obj.unlockedAt = unlockedMap.get(ach.id) || unlockedMap.get(ach.key) || null;
    return obj;
  });
};

const getMissions = async () => {
  return Mission.find();
};

const getXPTransactions = async (studentId) => {
  return XPTransaction.find({ studentId }).sort({ createdAt: -1 });
};

module.exports = {
  levelFromXp,
  getLeaderboard,
  getDashboard,
  getAchievements,
  getMissions,
  getXPTransactions
};
