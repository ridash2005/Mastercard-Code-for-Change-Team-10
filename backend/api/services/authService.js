const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AdminProfile = require('../models/AdminProfile');
const PasswordResetToken = require('../models/PasswordResetToken');
const OAuthLoginCode = require('../models/OAuthLoginCode');
const config = require('../config');
const { sendPasswordResetEmail, isEmailConfigured } = require('./emailService');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h
const OAUTH_LOGIN_CODE_TTL_MS = 2 * 60 * 1000; // 2m - just long enough for the browser redirect round trip

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

const register = async (userData) => {
  const { name, email, password, role, college, programme, cohort, batchYear } = userData;

  // No silent default password - a real sign-up form always collects one.
  // (An OAuth sign-up goes through findOrCreateOAuthUser below instead,
  // which never calls this function.)
  if (!password || password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error(
      existingUser.authProvider !== 'local' && !existingUser.passwordHash
        ? `This email is already registered via ${existingUser.authProvider === 'google' ? 'Google' : 'GitHub'} sign-in. Use that instead, or reset your password to add one.`
        : 'A user with this email already exists'
    );
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
    passwordHash: password,
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

  // Same generic message whether the email doesn't exist or the password
  // is wrong - never reveal which one it was (that would let an attacker
  // enumerate registered emails).
  const invalidCredentials = () => {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    return error;
  };

  if (!user) {
    throw invalidCredentials();
  }

  if (!user.passwordHash) {
    // OAuth-only account (never set a password) - a *different*, specific
    // message here is fine (not a credentials-enumeration leak): the user
    // just proved they know a real registered email by typing it into this
    // form, so telling them how they actually signed up is just good UX,
    // matching how real sites handle this case.
    const error = new Error(
      `This account signs in with ${user.authProvider === 'google' ? 'Google' : 'GitHub'} - use that button instead of a password.`
    );
    error.statusCode = 400;
    throw error;
  }

  // password is guaranteed present here - authController.login requires it.
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw invalidCredentials();
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

/**
 * Always succeeds from the caller's point of view regardless of whether the
 * email matches an account - never reveals account existence. When Resend
 * isn't configured (RESEND_API_KEY unset), the raw reset link is returned
 * directly instead of emailed, for local dev only (see emailService.js).
 */
const forgotPassword = async (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return { sent: false, devResetUrl: null };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash: hashToken(rawToken),
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS)
  });

  const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

  if (isEmailConfigured()) {
    try {
      await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (err) {
      // Never let an email-provider hiccup (sandbox restrictions, a
      // transient outage, ...) turn into a 500 here - that status-code
      // difference from the "no such account" case would itself leak
      // whether the account exists, on top of just being a broken UX for
      // a real account. Log it and still respond as if it went out; the
      // token is already stored so a retry (or an admin manually sharing
      // the link) still works.
      console.error('sendPasswordResetEmail failed:', err);
    }
    return { sent: true, devResetUrl: null };
  }

  // Dev-mode fallback - no email provider configured. Never do this in
  // production; the whole point of email delivery is that only the account
  // owner (who controls the inbox) sees the link.
  return { sent: false, devResetUrl: resetUrl };
};

const resetPassword = async (rawToken, newPassword) => {
  const record = await PasswordResetToken.findOne({
    tokenHash: hashToken(rawToken),
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    const error = new Error('This reset link is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(record.userId);
  if (!user) {
    const error = new Error('This reset link is invalid or has expired');
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = newPassword; // re-hashed by User's pre-save hook
  await user.save();

  record.used = true;
  await record.save();

  // Invalidate any other outstanding reset requests for this user.
  await PasswordResetToken.updateMany({ userId: user._id, used: false }, { used: true });

  return { email: user.email };
};

/**
 * Finds an existing account to sign into, or provisions a brand-new one -
 * the "Sign in with Google/GitHub" backing for both login AND signup (OAuth
 * doesn't distinguish the two the way a password form does; the first time
 * someone uses it IS the signup). Called by controllers/oauthController.js
 * after it's already exchanged the provider's code for a verified profile.
 *
 * Account linking: if a *local* account already exists with this email, the
 * provider id gets attached to it instead of creating a duplicate account -
 * same behavior real sites use, and safe here specifically because the
 * email came back from Google/GitHub itself (they only report verified
 * emails through the userinfo endpoints this app requests), not from
 * user-supplied input.
 */
const findOrCreateOAuthUser = async ({ provider, providerId, email, name, avatarUrl }) => {
  const providerField = provider === 'google' ? 'googleId' : 'githubId';

  let user = await User.findOne({ [providerField]: providerId });

  if (!user && email) {
    const normalizedEmail = email.toLowerCase().trim();
    user = await User.findOne({ email: normalizedEmail });
    if (user && !user[providerField]) {
      user[providerField] = providerId;
      await user.save();
    }
  }

  let profile;
  let isNewUser = false;

  if (!user) {
    if (!email) {
      const error = new Error(
        `Your ${provider === 'google' ? 'Google' : 'GitHub'} account has no accessible email address to sign up with.`
      );
      error.statusCode = 400;
      throw error;
    }

    isNewUser = true;
    const avatarInitials = (name || email)
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    user = await User.create({
      name: name || email,
      email: email.toLowerCase().trim(),
      role: 'student', // OAuth self-signup always creates a student account - admin accounts are provisioned separately
      college: '',
      programme: 'Katalyst Fellows 2026',
      avatar: avatarInitials,
      onboardingCompleted: false,
      authProvider: provider,
      [providerField]: providerId
    });

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
      collegeName: '',
      notificationPreferences: {
        emailNotificationsEnabled: true,
        courseRecommendationEmails: true,
        meetingUpdateEmails: true
      }
    });
  } else {
    profile =
      user.role === 'student'
        ? await StudentProfile.findOne({ userId: user._id })
        : await AdminProfile.findOne({ userId: user._id });
  }

  return { user, profile, isNewUser };
};

/**
 * A short-lived, single-use code the OAuth callback redirects the browser
 * to the frontend with (?code=...) instead of ever putting the real JWT in
 * a URL. exchangeOAuthLoginCode below is the other half.
 */
const createOAuthLoginCode = async (userId) => {
  const rawCode = crypto.randomBytes(32).toString('hex');
  await OAuthLoginCode.create({
    userId,
    codeHash: hashToken(rawCode),
    expiresAt: new Date(Date.now() + OAUTH_LOGIN_CODE_TTL_MS)
  });
  return rawCode;
};

const exchangeOAuthLoginCode = async (rawCode) => {
  const record = await OAuthLoginCode.findOne({
    codeHash: hashToken(rawCode),
    used: false,
    expiresAt: { $gt: new Date() }
  });

  if (!record) {
    const error = new Error('This sign-in link is invalid or has expired. Please try again.');
    error.statusCode = 400;
    throw error;
  }

  record.used = true;
  await record.save();

  const user = await User.findById(record.userId);
  if (!user) {
    const error = new Error('This account no longer exists.');
    error.statusCode = 404;
    throw error;
  }

  let profile = null;
  if (user.role === 'student') {
    profile = await StudentProfile.findOne({ userId: user._id });
  } else {
    profile = await AdminProfile.findOne({ userId: user._id });
  }

  const token = generateToken(user._id);

  return { user, profile, token };
};

module.exports = {
  generateToken,
  register,
  login,
  getMe,
  completeOnboarding,
  findOrCreateOAuthUser,
  createOAuthLoginCode,
  exchangeOAuthLoginCode,
  forgotPassword,
  resetPassword
};
