const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config');
const { connectDB } = require('./config/db');
const routes = require('./routes');
const loggerMiddleware = require('./middleware/loggerMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Database Connection
connectDB();

// Core Middleware
app.use(
  cors({
    origin: config.clientUrl || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(loggerMiddleware);
}

// Welcome Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Katalyst Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Protected)',
        onboarding: 'POST /api/auth/onboarding (Protected)'
      },
      users: {
        profile: 'GET /api/users/profile | PUT /api/users/profile (Protected)',
        list: 'GET /api/users (Admin)',
        atRisk: 'GET /api/users/students/at-risk (Admin)'
      },
      activities: {
        list: 'GET /api/activities',
        detail: 'GET /api/activities/:id',
        create: 'POST /api/activities (Admin)',
        update: 'PUT /api/activities/:id (Admin)',
        delete: 'DELETE /api/activities/:id (Admin)'
      },
      enrollments: {
        list: 'GET /api/enrollments (Protected)',
        enroll: 'POST /api/enrollments (Protected)',
        start: 'PATCH /api/enrollments/:activityId/start (Protected)',
        detail: 'GET /api/enrollments/:activityId (Protected)'
      },
      submissions: {
        list: 'GET /api/submissions (Protected)',
        detail: 'GET /api/submissions/:id (Protected)',
        submit: 'POST /api/submissions (Protected)',
        review: 'POST /api/submissions/:id/review (Admin)'
      },
      meetings: {
        list: 'GET /api/meetings (Protected)',
        detail: 'GET /api/meetings/:id (Protected)',
        create: 'POST /api/meetings (Admin)',
        update: 'PUT /api/meetings/:id (Admin)',
        delete: 'DELETE /api/meetings/:id (Admin)',
        reschedule: 'POST /api/meetings/:id/reschedule (Protected)'
      },
      gamification: {
        dashboard: 'GET /api/gamification/dashboard (Protected)',
        leaderboard: 'GET /api/gamification/leaderboard',
        achievements: 'GET /api/gamification/achievements (Protected)',
        missions: 'GET /api/gamification/missions',
        xpTransactions: 'GET /api/gamification/xp-transactions (Protected)'
      },
      teams: {
        list: 'GET /api/teams',
        detail: 'GET /api/teams/:id',
        create: 'POST /api/teams (Admin)',
        addMember: 'POST /api/teams/:id/members (Admin)'
      },
      notifications: {
        list: 'GET /api/notifications (Protected)',
        markRead: 'PATCH /api/notifications/:id/read (Protected)',
        markAllRead: 'PATCH /api/notifications/read-all (Protected)'
      },
      feedback: {
        list: 'GET /api/feedback (Protected)',
        create: 'POST /api/feedback (Protected)'
      },
      complaints: {
        list: 'GET /api/complaints (Protected)',
        create: 'POST /api/complaints (Protected)',
        updateStatus: 'PATCH /api/complaints/:id/status (Admin)'
      },
      certificates: {
        list: 'GET /api/certificates (Protected)',
        detail: 'GET /api/certificates/:id (Protected)'
      },
      extracurricular: {
        list: 'GET /api/extracurricular',
        detail: 'GET /api/extracurricular/:id',
        create: 'POST /api/extracurricular (Admin)'
      },
      contact: {
        submit: 'POST /api/contact',
        list: 'GET /api/contact (Admin)'
      },
      analytics: {
        overview: 'GET /api/admin/analytics/overview (Admin)',
        reports: 'GET /api/admin/analytics/reports (Admin)'
      }
    }
  });
});

// API Routes
app.use('/api', routes);

// 404 and Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server if run directly
let server;
if (require.main === module) {
  server = app.listen(config.port, () => {
    console.log(`=========================================`);
    console.log(`🚀 Katalyst Backend running in [${config.nodeEnv}] mode`);
    console.log(`📡 Server listening on: http://localhost:${config.port}`);
    console.log(`🏥 Health check at:     http://localhost:${config.port}/api/health`);
    console.log(`=========================================`);
  });

  // Graceful Shutdown
  const handleShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('💥 Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

module.exports = app;
