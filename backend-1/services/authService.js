const jwt = require('jsonwebtoken');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AdminProfile = require('../models/AdminProfile');
const config = require('../config');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const register = async (userData) => {
  const { name, email, password, role, college, programme, cohort, batchYear } = userData;

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('A user with this email already exists');
    error.statusCode = 400;
    throw error;
  }

  const userRole = role === 'admin' ? 'admin' : 'student';
  const avatar = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password || 'katalyst123',
    role: userRole,
    college: college || (userRole === 'admin' ? 'Katalyst HQ' : ''),
    programme: programme || (userRole === 'admin' ? 'Programme Operations' : 'Katalyst Fellows 2026'),
    avatar,
    cohort: cohort || null,
    batchYear: batchYear || null,
    onboardingCompleted: false
  });

  let profile = null;
  if (userRole === 'student') {
    profile = await StudentProfile.create({
      userId: user._id,
      skills: [],
      interests: [],
      careerGoal: '',
      xp: 0,
      streak: 0,
      teamId: null,
      completedCourseIds: [],
      inactive: false,
      atRisk: false,
      onboarded: false,
      collegeName: college || '',
      notificationPreferences: {
        emailNotificationsEnabled: true,
        courseRecommendationEmails: true,
        meetingUpdateEmails: true
      }
    });
  } else {
    profile = await AdminProfile.create({
      userId: user._id,
      department: 'Programme Operations',
      title: 'Programme Manager'
    });
  }

  const token = generateToken(user._id);

  return { user, profile, token };
};

const login = async (email, password) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Check password (if provided)
  if (password) {
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }
  }

  const token = generateToken(user._id);

  let profile = null;
  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else {
    profile = await AdminProfile.findOne({ userId: user._id });
  }

  return { user, profile, token };
};

const getMe = async (userId) => {
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

const completeOnboarding = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  user.onboardingCompleted = true;
  if (data.college) user.college = data.college;
  if (data.programme) user.programme = data.programme;
  await user.save();

  let profile = await StudentProfile.findOne({ userId: user._id });
  if (profile) {
    if (data.skills) profile.skills = data.skills;
    if (data.interests) profile.interests = data.interests;
    if (data.careerGoal) profile.careerGoal = data.careerGoal;
    if (data.collegeName || data.college) profile.collegeName = data.collegeName || data.college;
    if (data.academicField) profile.academicField = data.academicField;
    if (data.programmeYear) profile.programmeYear = data.programmeYear;
    if (data.bio) profile.bio = data.bio;
    profile.onboarded = true;
    await profile.save();
  }

  return { user, profile };
};

module.exports = {
  generateToken,
  register,
  login,
  getMe,
  completeOnboarding
};
