const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AdminProfile = require('../models/AdminProfile');

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let profile = null;
  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else {
    profile = await AdminProfile.findOne({ userId: user._id });
  }

  return { user, profile };
};

const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const { name, college, programme, cohort, batchYear, skills, interests, careerGoal, bio, studentProfile } =
    updateData;

  if (name !== undefined) {
    user.name = name;
    user.avatar = name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (college !== undefined) user.college = college;
  if (programme !== undefined) user.programme = programme;
  if (cohort !== undefined) user.cohort = cohort;
  if (batchYear !== undefined) user.batchYear = batchYear;

  await user.save();

  let profile = null;
  if (user.role === 'student') {
    const profilePatch = {};
    if (skills !== undefined) profilePatch.skills = skills;
    if (interests !== undefined) profilePatch.interests = interests;
    if (careerGoal !== undefined) profilePatch.careerGoal = careerGoal;
    if (bio !== undefined) profilePatch.bio = bio;
    if (college !== undefined) profilePatch.collegeName = college;

    if (studentProfile) {
      if (studentProfile.skills !== undefined) profilePatch.skills = studentProfile.skills;
      if (studentProfile.interests !== undefined) profilePatch.interests = studentProfile.interests;
      if (studentProfile.careerGoal !== undefined) profilePatch.careerGoal = studentProfile.careerGoal;
      if (studentProfile.collegeName !== undefined) profilePatch.collegeName = studentProfile.collegeName;
      if (studentProfile.academicField !== undefined) profilePatch.academicField = studentProfile.academicField;
      if (studentProfile.programmeYear !== undefined) profilePatch.programmeYear = studentProfile.programmeYear;
      if (studentProfile.bio !== undefined) profilePatch.bio = studentProfile.bio;
      if (studentProfile.notificationPreferences !== undefined)
        profilePatch.notificationPreferences = studentProfile.notificationPreferences;
    }

    profile = await StudentProfile.findOneAndUpdate(
      { userId: user._id },
      { $set: profilePatch },
      { new: true, upsert: true }
    );
  } else {
    profile = await AdminProfile.findOne({ userId: user._id });
  }

  return { user, profile };
};

const listUsers = async (query = {}) => {
  const { role, cohort, search, page = 1, limit = 50 } = query;
  const filter = {};

  if (role) filter.role = role;
  if (cohort) filter.cohort = cohort;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { college: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    User.find(filter).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);

  const userIds = users.map((u) => u._id);
  const profiles = await StudentProfile.find({ userId: { $in: userIds } });
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  const data = users.map((u) => ({
    user: u,
    profile: profileMap.get(u._id.toString()) || null
  }));

  return {
    users: data,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit))
  };
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  let profile = null;
  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else {
    profile = await AdminProfile.findOne({ userId: user._id });
  }

  return { user, profile };
};

const getAtRiskStudents = async () => {
  const profiles = await StudentProfile.find({ $or: [{ atRisk: true }, { inactive: true }] });
  const userIds = profiles.map((p) => p.userId);
  const users = await User.find({ _id: { $in: userIds } });
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  return profiles.map((p) => ({
    profile: p,
    user: userMap.get(p.userId.toString()) || null
  }));
};

module.exports = {
  getProfile,
  updateProfile,
  listUsers,
  getUserById,
  getAtRiskStudents
};
