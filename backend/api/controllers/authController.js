const authService = require('../services/authService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, college, programme, cohort, batchYear } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email'
      });
    }

    const result = await authService.register({
      name,
      email,
      password,
      role,
      college,
      programme,
      cohort,
      batchYear
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password'
      });
    }

    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current authenticated user info
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const result = await authService.getMe(req.user._id);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Complete onboarding
// @route   POST /api/auth/onboarding
// @access  Private
const completeOnboarding = async (req, res, next) => {
  try {
    const result = await authService.completeOnboarding(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide an email address' });
    }

    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      // Always the same message regardless of whether the account exists -
      // don't let this endpoint be used to enumerate registered emails.
      message: 'If an account exists for that email, a reset link has been sent.',
      // Only present when RESEND_API_KEY isn't configured (local dev) - see
      // authService.js's forgotPassword.
      ...(result.devResetUrl && { devResetUrl: result.devResetUrl })
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using a token from the email link
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'token and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'password must be at least 6 characters' });
    }

    await authService.resetPassword(token, password);

    res.status(200).json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  completeOnboarding,
  forgotPassword,
  resetPassword
};
