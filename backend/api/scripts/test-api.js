const http = require('http');
const mongoose = require('mongoose');
const config = require('../config');
const app = require('../server');

// Helper to make HTTP requests against local Express app
const makeRequest = (server, options, body = null) => {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const reqOptions = {
      hostname: '127.0.0.1',
      port,
      path: options.path,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
};

// Matches scripts/seed.js's default password for demo accounts.
const DEMO_PASSWORD = process.env.BACKEND_DEMO_PASSWORD || 'katalyst-demo-bridge-2026';

const runTests = async () => {
  console.log('🧪 Starting Katalyst Backend-1 API Verification Test Suite...\n');

  let server;
  let testsPassed = 0;
  let testsFailed = 0;

  const assert = (condition, name, details = '') => {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`  ❌ [FAIL] ${name} ${details}`);
      testsFailed++;
    }
  };

  try {
    // Wait for DB connection
    await mongoose.connect(config.mongoUri);

    server = app.listen(0);
    const port = server.address().port;
    console.log(`📡 Test server running on ephemeral port ${port}\n`);

    // 1. Health Check
    console.log('--- 1. System & Health API ---');
    const healthRes = await makeRequest(server, { path: '/api/health' });
    assert(healthRes.status === 200, 'GET /api/health returns 200 OK');
    assert(healthRes.data.success === true, 'Health check reports success: true');

    const rootRes = await makeRequest(server, { path: '/' });
    assert(rootRes.status === 200, 'GET / returns 200 Welcome & API directory');

    // 2. Authentication & Onboarding
    console.log('\n--- 2. Authentication & Onboarding ---');
    const studentLogin = await makeRequest(server, {
      path: '/api/auth/login',
      method: 'POST'
    }, {
      email: 'ananya@katalyst.edu',
      password: DEMO_PASSWORD
    });
    assert(studentLogin.status === 200, 'POST /api/auth/login succeeds for demo student');
    assert(studentLogin.data.data && studentLogin.data.data.token, 'Student login returns JWT token');
    const studentToken = studentLogin.data.data ? studentLogin.data.data.token : null;
    const studentId = studentLogin.data.data ? studentLogin.data.data.user.id : null;

    const adminLogin = await makeRequest(server, {
      path: '/api/auth/login',
      method: 'POST'
    }, {
      email: 'priya.admin@katalyst.edu',
      password: DEMO_PASSWORD
    });
    assert(adminLogin.status === 200, 'POST /api/auth/login succeeds for admin');
    const adminToken = adminLogin.data.data ? adminLogin.data.data.token : null;

    // Register a new test student
    const testEmail = `test.student.${Date.now()}@katalyst.edu`;
    const regRes = await makeRequest(server, {
      path: '/api/auth/register',
      method: 'POST'
    }, {
      name: 'Test Student',
      email: testEmail,
      password: 'password123',
      role: 'student',
      college: 'IIT Bombay',
      programme: 'Katalyst Fellows 2026'
    });
    assert(regRes.status === 201, 'POST /api/auth/register creates new student');

    const testToken = regRes.data.data?.token;

    // GET /api/auth/me
    const meRes = await makeRequest(server, {
      path: '/api/auth/me',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(meRes.status === 200, 'GET /api/auth/me returns current user profile');
    assert(meRes.data.data.user.email === 'ananya@katalyst.edu', 'me returns correct user data');

    // POST /api/auth/onboarding
    const onboardRes = await makeRequest(server, {
      path: '/api/auth/onboarding',
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` }
    }, {
      skills: ['Python', 'Django'],
      interests: ['Web Development', 'AI'],
      careerGoal: 'Full Stack Engineer',
      academicField: 'Computer Science',
      programmeYear: 3
    });
    assert(onboardRes.status === 200, 'POST /api/auth/onboarding completes onboarding');

    // 3. User & Profiles
    console.log('\n--- 3. Users & Profile Management ---');
    const getProfileRes = await makeRequest(server, {
      path: '/api/users/profile',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(getProfileRes.status === 200, 'GET /api/users/profile returns student profile');

    const updateProfileRes = await makeRequest(server, {
      path: '/api/users/profile',
      method: 'PUT',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      skills: ['React', 'Node.js', 'System Design'],
      bio: 'Aspiring software architect'
    });
    assert(updateProfileRes.status === 200, 'PUT /api/users/profile updates profile');

    const adminUsersRes = await makeRequest(server, {
      path: '/api/users',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(adminUsersRes.status === 200, 'GET /api/users (Admin) lists all users');

    const atRiskRes = await makeRequest(server, {
      path: '/api/users/students/at-risk',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(atRiskRes.status === 200, 'GET /api/users/students/at-risk returns at-risk fellows');

    // 4. Activities & Explore
    console.log('\n--- 4. Activities & Catalog ---');
    const activitiesRes = await makeRequest(server, {
      path: '/api/activities?domain=Payments%20%26%20Trust',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(activitiesRes.status === 200, 'GET /api/activities with domain filter succeeds');
    assert(activitiesRes.data.data.length > 0, 'Returns filtered activities');
    const sampleActivity = activitiesRes.data.data[0];

    const activityDetailRes = await makeRequest(server, {
      path: `/api/activities/${sampleActivity.id}`,
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(activityDetailRes.status === 200, 'GET /api/activities/:id returns activity details');

    // Admin create activity
    const createActRes = await makeRequest(server, {
      path: '/api/activities',
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      title: 'Advanced Cloud Architecture Workshop',
      description: 'Design resilient distributed applications on AWS/GCP.',
      type: 'training',
      domain: 'Software Engineering',
      problemDomain: 'Campus Employability',
      category: 'Cloud Studio',
      difficulty: 'intermediate',
      xpReward: 100,
      startDate: '2026-09-01',
      dueDate: '2026-09-15',
      durationHours: 4,
      requirement: 'optional',
      certificate: true,
      participation: 'individual'
    });
    assert(createActRes.status === 201, 'POST /api/activities (Admin) creates new activity');
    const createdActId = createActRes.data.data?.id;

    // 5. Enrollments
    console.log('\n--- 5. Activity Enrollment Lifecycle ---');
    const enrollRes = await makeRequest(server, {
      path: '/api/enrollments',
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` }
    }, {
      activityId: createdActId
    });
    assert(enrollRes.status === 201, 'POST /api/enrollments enrolls student in activity');

    const startActRes = await makeRequest(server, {
      path: `/api/enrollments/${createdActId}/start`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert(startActRes.status === 200, 'PATCH /api/enrollments/:id/start transitions to in_progress');
    assert(startActRes.data.data.status === 'in_progress', 'Enrollment status updated to in_progress');

    // 6. Submissions & Admin Review
    console.log('\n--- 6. Submissions & Review Workflow ---');
    const submitWorkRes = await makeRequest(server, {
      path: '/api/submissions',
      method: 'POST',
      headers: { Authorization: `Bearer ${testToken}` }
    }, {
      activityId: createdActId,
      text: 'Completed cloud architecture diagram and terraform configuration.',
      link: 'https://github.com/test-student/cloud-architecture',
      notes: 'Implemented VPC peering and RDS multi-AZ failover.',
      fileName: 'architecture.pdf'
    });
    assert(submitWorkRes.status === 201, 'POST /api/submissions submits student attempt');
    const submissionId = submitWorkRes.data.data?.id;

    const reviewRes = await makeRequest(server, {
      path: `/api/submissions/${submissionId}/review`,
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    }, {
      action: 'approve',
      score: 95,
      feedback: 'Exceptional diagram and well-structured Terraform scripts.'
    });
    assert(reviewRes.status === 200, 'POST /api/submissions/:id/review (Admin) approves submission');
    assert(reviewRes.data.data.status === 'approved', 'Submission status updated to approved');
    assert(reviewRes.data.data.xpAwarded === 100, 'XP correctly awarded');

    // 7. Gamification & Leaderboards
    console.log('\n--- 7. Gamification, XP & Leaderboard ---');
    const dashboardRes = await makeRequest(server, {
      path: '/api/gamification/dashboard',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(dashboardRes.status === 200, 'GET /api/gamification/dashboard returns student metrics');
    assert(dashboardRes.data.data.gamification !== undefined, 'Dashboard contains gamification summary');

    const leaderboardRes = await makeRequest(server, {
      path: '/api/gamification/leaderboard'
    });
    assert(leaderboardRes.status === 200, 'GET /api/gamification/leaderboard returns rankings');
    assert(leaderboardRes.data.data.length > 0, 'Leaderboard has ranked students');

    const achievementsRes = await makeRequest(server, {
      path: '/api/gamification/achievements',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(achievementsRes.status === 200, 'GET /api/gamification/achievements returns badge list');

    const xpHistoryRes = await makeRequest(server, {
      path: '/api/gamification/xp-transactions',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(xpHistoryRes.status === 200, 'GET /api/gamification/xp-transactions returns XP ledger');

    // 8. Meetings & Rescheduling
    console.log('\n--- 8. Mentoring Meetings & Rescheduling ---');
    const meetingsRes = await makeRequest(server, {
      path: '/api/meetings',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(meetingsRes.status === 200, 'GET /api/meetings returns student meetings');
    const sampleMeeting = meetingsRes.data.data[0];

    if (sampleMeeting) {
      const rescheduleRes = await makeRequest(server, {
        path: `/api/meetings/${sampleMeeting.id}/reschedule`,
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      }, {
        slot: '2026-08-25T16:00:00.000Z'
      });
      assert(rescheduleRes.status === 200, 'POST /api/meetings/:id/reschedule moves meeting slot');
    }

    // 9. Teams
    console.log('\n--- 9. Teams & Squads ---');
    const teamsRes = await makeRequest(server, {
      path: '/api/teams'
    });
    assert(teamsRes.status === 200, 'GET /api/teams returns squad list');

    // 10. Notifications
    console.log('\n--- 10. Notifications ---');
    const notifsRes = await makeRequest(server, {
      path: '/api/notifications',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(notifsRes.status === 200, 'GET /api/notifications returns user notifications');

    const markAllReadRes = await makeRequest(server, {
      path: '/api/notifications/read-all',
      method: 'PATCH',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(markAllReadRes.status === 200, 'PATCH /api/notifications/read-all marks all read');

    // 11. Feedback & Complaints
    console.log('\n--- 11. Feedback & Complaints ---');
    const fbRes = await makeRequest(server, {
      path: '/api/feedback',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      category: 'Course Content',
      rating: 5,
      message: 'Great hands-on projects!'
    });
    assert(fbRes.status === 201, 'POST /api/feedback records user feedback');

    const complaintRes = await makeRequest(server, {
      path: '/api/complaints',
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    }, {
      category: 'Portal Access',
      subject: 'Unable to download certificate PDF',
      description: 'Clicking certificate download gives a blank page.',
      priority: 'high'
    });
    assert(complaintRes.status === 201, 'POST /api/complaints submits grievance');

    // 12. Certificates & Extracurricular
    console.log('\n--- 12. Certificates & Extracurricular ---');
    const certsRes = await makeRequest(server, {
      path: '/api/certificates',
      headers: { Authorization: `Bearer ${testToken}` }
    });
    assert(certsRes.status === 200, 'GET /api/certificates returns issued certificates');

    const extraRes = await makeRequest(server, {
      path: '/api/extracurricular'
    });
    assert(extraRes.status === 200, 'GET /api/extracurricular returns activities');

    // 13. Contact Form & Admin Analytics
    console.log('\n--- 13. Contact & Admin Analytics ---');
    const contactRes = await makeRequest(server, {
      path: '/api/contact',
      method: 'POST'
    }, {
      name: 'Dr. Ramesh Gupta',
      email: 'ramesh@partnercollege.edu',
      category: 'Partnership',
      message: 'Interested in onboarding our 2026 computer science cohort.'
    });
    assert(contactRes.status === 201, 'POST /api/contact submits contact form');

    const analyticsOverviewRes = await makeRequest(server, {
      path: '/api/admin/analytics/overview',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analyticsOverviewRes.status === 200, 'GET /api/admin/analytics/overview returns metrics');

    const analyticsReportsRes = await makeRequest(server, {
      path: '/api/admin/analytics/reports',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(analyticsReportsRes.status === 200, 'GET /api/admin/analytics/reports returns student reports');

    // 14. Security & Error Handling
    console.log('\n--- 14. Security & RBAC Enforcements ---');
    const unauthorizedAdminRoute = await makeRequest(server, {
      path: '/api/admin/analytics/overview',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert(unauthorizedAdminRoute.status === 403, 'Student blocked from admin route (403 Forbidden)');

    const unauthenticatedRoute = await makeRequest(server, {
      path: '/api/auth/me'
    });
    assert(unauthenticatedRoute.status === 401, 'Unauthenticated request blocked (401 Unauthorized)');

    const notFoundRoute = await makeRequest(server, {
      path: '/api/non-existent-endpoint'
    });
    assert(notFoundRoute.status === 404, 'Non-existent route returns 404 Not Found');

    console.log('\n=========================================');
    console.log(`🎉 TEST RUN COMPLETE: ${testsPassed} passed, ${testsFailed} failed`);
    console.log('=========================================\n');

    server.close();
    await mongoose.disconnect();

    if (testsFailed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Test suite execution error:', error);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTests();
