const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../config');

// Import all models
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const AdminProfile = require('../models/AdminProfile');
const Activity = require('../models/Activity');
const Enrollment = require('../models/Enrollment');
const Submission = require('../models/Submission');
const Meeting = require('../models/Meeting');
const Team = require('../models/Team');
const TeamMember = require('../models/TeamMember');
const Achievement = require('../models/Achievement');
const StudentAchievement = require('../models/StudentAchievement');
const Mission = require('../models/Mission');
const XPTransaction = require('../models/XPTransaction');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');
const Certificate = require('../models/Certificate');
const Extracurricular = require('../models/Extracurricular');
const ContactMessage = require('../models/ContactMessage');
const Collaboration = require('../models/Collaboration');
const VolunteerApplication = require('../models/VolunteerApplication');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      StudentProfile.deleteMany({}),
      AdminProfile.deleteMany({}),
      Activity.deleteMany({}),
      Enrollment.deleteMany({}),
      Submission.deleteMany({}),
      Meeting.deleteMany({}),
      Team.deleteMany({}),
      TeamMember.deleteMany({}),
      Achievement.deleteMany({}),
      StudentAchievement.deleteMany({}),
      Mission.deleteMany({}),
      XPTransaction.deleteMany({}),
      Notification.deleteMany({}),
      Complaint.deleteMany({}),
      Feedback.deleteMany({}),
      Certificate.deleteMany({}),
      Extracurricular.deleteMany({}),
      ContactMessage.deleteMany({}),
      Collaboration.deleteMany({}),
      VolunteerApplication.deleteMany({})
    ]);

    console.log('Cleared collections. Seeding fresh data...');

    // Matches the frontend's BACKEND_DEMO_PASSWORD default (see root
    // .env.example) so the AI Coach's login-or-register bridge (which uses a
    // fixed demo password per shadow account) can still log in to these same
    // seeded emails instead of hitting an email-already-registered conflict
    // with no matching password.
    const defaultPassword = process.env.BACKEND_DEMO_PASSWORD || 'katalyst-demo-bridge-2026';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // 1. Users
    const usersData = [
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000001'),
        name: 'Ananya Munshi',
        email: 'ananya@katalyst.edu',
        passwordHash,
        role: 'student',
        college: "St. Xavier's College, Mumbai",
        programme: 'Katalyst Fellows 2026',
        avatar: 'AM',
        cohort: 'Cohort 2026',
        batchYear: 2,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000002'),
        name: 'Isha Verma',
        email: 'isha@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'Fergusson College, Pune',
        programme: 'Katalyst Fellows 2026',
        avatar: 'IV',
        cohort: 'Cohort 2026',
        batchYear: 3,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000003'),
        name: 'Riya Kapoor',
        email: 'riya@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'Miranda House, Delhi',
        programme: 'Katalyst Fellows 2026',
        avatar: 'RK',
        cohort: 'Cohort 2026',
        batchYear: 2,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000004'),
        name: 'Meera Joshi',
        email: 'meera.s@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'Christ University, Bengaluru',
        programme: 'Katalyst Fellows 2026',
        avatar: 'MJ',
        cohort: 'Cohort 2026',
        batchYear: 2,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000005'),
        name: 'Sara Khan',
        email: 'sara@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'Jadavpur University, Kolkata',
        programme: 'Katalyst Fellows 2026',
        avatar: 'SK',
        cohort: 'Cohort 2026',
        batchYear: 3,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000006'),
        name: 'Nisha Patel',
        email: 'nisha@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'NIT Trichy',
        programme: 'Katalyst Fellows 2026',
        avatar: 'NP',
        cohort: 'Cohort 2026',
        batchYear: 4,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000007'),
        name: 'Kavya Nair',
        email: 'kavya@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'IIT Madras',
        programme: 'Katalyst Fellows 2026',
        avatar: 'KN',
        cohort: 'Cohort 2026',
        batchYear: 3,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000008'),
        name: 'Aditi Rao',
        email: 'aditi@katalyst.edu',
        passwordHash,
        role: 'student',
        college: 'BITS Pilani',
        programme: 'Katalyst Fellows 2026',
        avatar: 'AR',
        cohort: 'Cohort 2026',
        batchYear: 1,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d000000000000000000009'),
        name: 'Priya Sharma',
        email: 'priya.admin@katalyst.edu',
        passwordHash,
        role: 'admin',
        college: 'Katalyst HQ',
        programme: 'Programme Operations',
        avatar: 'PS',
        cohort: null,
        batchYear: null,
        onboardingCompleted: true
      },
      {
        _id: new mongoose.Types.ObjectId('65d00000000000000000000a'),
        name: 'Arjun Desai',
        email: 'arjun.admin@katalyst.edu',
        passwordHash,
        role: 'admin',
        college: 'Katalyst HQ',
        programme: 'Learning Design',
        avatar: 'AD',
        cohort: null,
        batchYear: null,
        onboardingCompleted: true
      }
    ];

    const users = await User.insertMany(usersData);
    console.log(`✓ Seeded ${users.length} Users`);

    // 2. Teams
    const teamsData = [
      {
        _id: new mongoose.Types.ObjectId('65d100000000000000000001'),
        name: 'Nexus',
        projectTitle: 'Inclusion Wallet',
        rank: 1,
        cohort: 'Cohort 2026'
      },
      {
        _id: new mongoose.Types.ObjectId('65d100000000000000000002'),
        name: 'Lumen',
        projectTitle: 'Kirana Insights',
        rank: 2,
        cohort: 'Cohort 2026'
      },
      {
        _id: new mongoose.Types.ObjectId('65d100000000000000000003'),
        name: 'Orbit',
        projectTitle: 'Campus Climate Brief',
        rank: 3,
        cohort: 'Cohort 2026'
      }
    ];
    const teams = await Team.insertMany(teamsData);
    console.log(`✓ Seeded ${teams.length} Teams`);

    // 3. Team Members
    const teamMembersData = [
      { teamId: teams[0]._id.toString(), studentId: users[0]._id.toString(), role: 'Frontend Developer', contribution: 28 },
      { teamId: teams[0]._id.toString(), studentId: users[1]._id.toString(), role: 'Database Developer', contribution: 24 },
      { teamId: teams[0]._id.toString(), studentId: users[6]._id.toString(), role: 'Backend Developer', contribution: 31 },
      { teamId: teams[1]._id.toString(), studentId: users[4]._id.toString(), role: 'Product Analyst', contribution: 22 },
      { teamId: teams[1]._id.toString(), studentId: users[5]._id.toString(), role: 'QA Engineer', contribution: 26 },
      { teamId: teams[2]._id.toString(), studentId: users[2]._id.toString(), role: 'Product Analyst', contribution: 20 },
      { teamId: teams[2]._id.toString(), studentId: users[3]._id.toString(), role: 'Backend Developer', contribution: 12 },
      { teamId: teams[2]._id.toString(), studentId: users[7]._id.toString(), role: 'Frontend Developer', contribution: 8 }
    ];
    await TeamMember.insertMany(teamMembersData);

    // 4. Student Profiles & Admin Profiles
    const studentProfilesData = [
      {
        userId: users[0]._id,
        skills: ['DSA', 'React', 'Communication'],
        interests: ['Software Development', 'Product Management'],
        careerGoal: 'Software Engineer',
        xp: 2450,
        streak: 7,
        teamId: teams[0]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: false,
        onboarded: true,
        collegeName: users[0].college
      },
      {
        userId: users[1]._id,
        skills: ['Python', 'SQL'],
        interests: ['Data Science', 'AI / ML'],
        careerGoal: 'Data Analyst',
        xp: 3120,
        streak: 12,
        teamId: teams[0]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: false,
        onboarded: true,
        collegeName: users[1].college
      },
      {
        userId: users[2]._id,
        skills: ['Figma', 'Research'],
        interests: ['UI/UX Design', 'Product Management'],
        careerGoal: 'Product Designer',
        xp: 1980,
        streak: 3,
        teamId: teams[2]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: false,
        onboarded: true,
        collegeName: users[2].college
      },
      {
        userId: users[3]._id,
        skills: ['Java', 'Git'],
        interests: ['Software Development', 'Cloud Computing'],
        careerGoal: 'Backend Engineer',
        xp: 1640,
        streak: 0,
        teamId: teams[2]._id.toString(),
        completedCourseIds: [],
        inactive: true,
        atRisk: true,
        onboarded: true,
        collegeName: users[3].college
      },
      {
        userId: users[4]._id,
        skills: ['Excel', 'Storytelling'],
        interests: ['Finance', 'Consulting'],
        careerGoal: 'Business Analyst',
        xp: 2210,
        streak: 5,
        teamId: teams[1]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: false,
        onboarded: true,
        collegeName: users[4].college
      },
      {
        userId: users[5]._id,
        skills: ['Testing', 'SQL'],
        interests: ['Cybersecurity', 'Software Development'],
        careerGoal: 'QA Engineer',
        xp: 2740,
        streak: 9,
        teamId: teams[1]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: false,
        onboarded: true,
        collegeName: users[5].college
      },
      {
        userId: users[6]._id,
        skills: ['System Design', 'Leadership'],
        interests: ['Entrepreneurship', 'Cloud Computing'],
        careerGoal: 'Engineering Manager',
        xp: 3380,
        streak: 14,
        teamId: teams[0]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: false,
        onboarded: true,
        collegeName: users[6].college
      },
      {
        userId: users[7]._id,
        skills: ['Writing'],
        interests: ['Marketing', 'Communication'],
        careerGoal: 'Product Marketing',
        xp: 420,
        streak: 1,
        teamId: teams[2]._id.toString(),
        completedCourseIds: [],
        inactive: false,
        atRisk: true,
        onboarded: true,
        collegeName: users[7].college
      }
    ];
    await StudentProfile.insertMany(studentProfilesData);

    await AdminProfile.insertMany([
      { userId: users[8]._id, department: 'Programme Operations', title: 'Programme Manager' },
      { userId: users[9]._id, department: 'Learning Design', title: 'Curriculum Lead' }
    ]);
    console.log(`✓ Seeded Profiles`);

    // 5. Activities
    const activitiesData = [
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000001'),
        title: 'Payments Studio',
        description: 'Build a mental model of card, UPI and wallet rails used in everyday commerce.',
        type: 'course',
        domain: 'Payments & Trust',
        problemDomain: 'Digital Payments',
        category: 'Certificate course',
        difficulty: 'intermediate',
        xpReward: 220,
        startDate: new Date('2026-07-01'),
        dueDate: new Date('2026-08-15'),
        durationHours: 12,
        requirement: 'mandatory',
        certificate: true,
        participation: 'individual',
        attachments: [{ name: 'Syllabus.pdf', url: '#' }],
        instructions: 'Complete four modules and submit a one-page rail comparison.',
        createdBy: users[9]._id.toString(),
        modules: ['UPI Rails', 'Cards & Settlement', 'Disputes & Chargebacks', 'Security Hygiene']
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000002'),
        title: 'Trust & Security Fundamentals',
        description: 'Practical hygiene for handling cardholder data and student PII in programme work.',
        type: 'course',
        domain: 'Payments & Trust',
        problemDomain: 'Cybersecurity',
        category: 'Certificate course',
        difficulty: 'beginner',
        xpReward: 180,
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-09-10'),
        durationHours: 8,
        requirement: 'mandatory',
        certificate: true,
        participation: 'individual',
        attachments: [{ name: 'Reading pack.pdf', url: '#' }],
        instructions: 'Watch sessions, then submit a threat-model for a campus payments kiosk.',
        createdBy: users[9]._id.toString(),
        modules: ['Data Protection Basics', 'Authentication Patterns', 'Threat Modeling']
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000003'),
        title: 'Product Discovery Lab',
        description: 'Interview-to-prototype loop for a problem in financial inclusion.',
        type: 'course',
        domain: 'Product',
        problemDomain: 'Financial Inclusion',
        category: 'Optional studio',
        difficulty: 'intermediate',
        xpReward: 200,
        startDate: new Date('2026-08-10'),
        dueDate: new Date('2026-09-20'),
        durationHours: 10,
        requirement: 'optional',
        certificate: false,
        participation: 'individual',
        attachments: [],
        instructions: 'Run five interviews and ship a clickable prototype.',
        createdBy: users[9]._id.toString(),
        modules: ['User Research', 'Synthesis', 'Prototyping']
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000004'),
        title: 'DSA Clinic — Arrays & Hashing',
        description: 'Live problem-solving clinic with a facilitator from industry.',
        type: 'training',
        domain: 'Software Engineering',
        problemDomain: 'Campus Employability',
        category: 'Training session',
        difficulty: 'beginner',
        xpReward: 80,
        startDate: new Date('2026-08-22'),
        dueDate: new Date('2026-08-22'),
        durationHours: 2,
        requirement: 'mandatory',
        certificate: false,
        participation: 'individual',
        attachments: [{ name: 'Problem set.md', url: '#' }],
        instructions: 'Join on time. Cameras optional. Submit the two warm-up solutions after class.',
        createdBy: users[8]._id.toString(),
        location: 'Zoom Room 1',
        slots: ['2026-08-22T10:00:00.000Z', '2026-08-22T14:00:00.000Z']
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000005'),
        title: 'Git Collaboration Lab',
        description: 'Branching, reviews and conflict resolution on a shared starter repo.',
        type: 'training',
        domain: 'Software Engineering',
        problemDomain: 'Campus Employability',
        category: 'Training session',
        difficulty: 'beginner',
        xpReward: 70,
        startDate: new Date('2026-08-28'),
        dueDate: new Date('2026-08-28'),
        durationHours: 2.5,
        requirement: 'optional',
        certificate: false,
        participation: 'team',
        attachments: [],
        instructions: 'Bring a GitHub account. Pair with your squad.',
        createdBy: users[8]._id.toString(),
        location: 'Zoom Room 2',
        slots: ['2026-08-28T10:00:00.000Z', '2026-08-28T15:00:00.000Z']
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000006'),
        title: 'Career Story with Priya (PM)',
        description: '1:1 mentoring on internships, storytelling and interview loops.',
        type: 'mentoring',
        domain: 'Communication',
        problemDomain: 'Women in STEM',
        category: 'Mentoring',
        difficulty: 'beginner',
        xpReward: 60,
        startDate: new Date('2026-08-25'),
        dueDate: new Date('2026-08-25'),
        durationHours: 0.75,
        requirement: 'mandatory',
        certificate: false,
        participation: 'individual',
        attachments: [],
        instructions: 'Prepare two questions and a one-page resume. Reschedule if needed.',
        createdBy: users[8]._id.toString(),
        mentor: 'Priya Sharma',
        slots: ['2026-08-25T09:30:00.000Z', '2026-08-25T11:00:00.000Z', '2026-08-25T16:00:00.000Z']
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000007'),
        title: 'Inclusion Wallet — Team Project',
        description: 'Ship a thin slice of a wallet experience for first-time digital users.',
        type: 'project',
        domain: 'Product',
        problemDomain: 'Financial Inclusion',
        category: 'Capstone project',
        difficulty: 'advanced',
        xpReward: 400,
        startDate: new Date('2026-08-05'),
        dueDate: new Date('2026-09-30'),
        durationHours: 40,
        requirement: 'mandatory',
        certificate: true,
        participation: 'team',
        attachments: [{ name: 'Brief.pdf', url: '#' }],
        instructions: 'Demo a happy path: onboard, add funds (mock), pay a kirana. Write a 2-page retro.',
        createdBy: users[9]._id.toString(),
        repoHint: 'https://github.com/katalyst-demos/inclusion-wallet-starter'
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000008'),
        title: 'SQL Case: Merchant Mix',
        description: 'Write queries that explain merchant category mix for a fictional city.',
        type: 'assignment',
        domain: 'Data & AI',
        problemDomain: 'Digital Payments',
        category: 'Assignment',
        difficulty: 'intermediate',
        xpReward: 120,
        startDate: new Date('2026-08-14'),
        dueDate: new Date('2026-08-27'),
        durationHours: 6,
        requirement: 'mandatory',
        certificate: false,
        participation: 'individual',
        attachments: [{ name: 'dataset.csv', url: '#' }],
        instructions: 'Submit SQL + a 400-word narrative. No screenshots of a GUI as the only artefact.',
        createdBy: users[9]._id.toString(),
        maxScore: 100
      },
      {
        _id: new mongoose.Types.ObjectId('65d200000000000000000009'),
        title: 'Stakeholder Memo',
        description: 'Write a one-page memo to a college placement cell about a mock intern programme.',
        type: 'assignment',
        domain: 'Communication',
        problemDomain: 'Campus Employability',
        category: 'Assignment',
        difficulty: 'beginner',
        xpReward: 90,
        startDate: new Date('2026-08-18'),
        dueDate: new Date('2026-08-30'),
        durationHours: 4,
        requirement: 'optional',
        certificate: false,
        participation: 'individual',
        attachments: [],
        instructions: 'Audience is busy. Lead with the ask. Attach a calendar sketch.',
        createdBy: users[8]._id.toString(),
        maxScore: 100
      },
      {
        _id: new mongoose.Types.ObjectId('65d20000000000000000000a'),
        title: 'Internship-Ready Checkpoint',
        description: 'Portfolio, resume, and mock interview gate before partner internships.',
        type: 'milestone',
        domain: 'Leadership',
        problemDomain: 'Campus Employability',
        category: 'Milestone',
        difficulty: 'intermediate',
        xpReward: 150,
        startDate: new Date('2026-08-01'),
        dueDate: new Date('2026-10-01'),
        durationHours: 5,
        requirement: 'mandatory',
        certificate: true,
        participation: 'individual',
        attachments: [{ name: 'Rubric.pdf', url: '#' }],
        instructions: 'Upload resume, project README, and a 3-minute walkthrough link.',
        createdBy: users[8]._id.toString(),
        checkpoint: 'Portfolio and Resume Gate'
      }
    ];
    const activities = await Activity.insertMany(activitiesData);
    console.log(`✓ Seeded ${activities.length} Activities`);

    // 6. Enrollments
    const enrollmentsData = [
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000001'),
        activityId: activities[0]._id.toString(),
        studentId: users[0]._id.toString(),
        status: 'completed',
        progress: 100,
        startedAt: new Date('2026-07-02'),
        completedAt: new Date('2026-08-10')
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000002'),
        activityId: activities[1]._id.toString(),
        studentId: users[0]._id.toString(),
        status: 'in_progress',
        progress: 45,
        startedAt: new Date('2026-08-05')
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000003'),
        activityId: activities[3]._id.toString(),
        studentId: users[0]._id.toString(),
        status: 'not_started',
        progress: 0
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000004'),
        activityId: activities[5]._id.toString(),
        studentId: users[0]._id.toString(),
        status: 'not_started',
        progress: 0
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000005'),
        activityId: activities[6]._id.toString(),
        studentId: users[0]._id.toString(),
        status: 'in_progress',
        progress: 35,
        startedAt: new Date('2026-08-06')
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000006'),
        activityId: activities[7]._id.toString(),
        studentId: users[0]._id.toString(),
        status: 'submitted',
        progress: 80,
        startedAt: new Date('2026-08-15')
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000007'),
        activityId: activities[7]._id.toString(),
        studentId: users[1]._id.toString(),
        status: 'under_review',
        progress: 90,
        startedAt: new Date('2026-08-14')
      },
      {
        _id: new mongoose.Types.ObjectId('65d300000000000000000008'),
        activityId: activities[8]._id.toString(),
        studentId: users[7]._id.toString(),
        status: 'needs_resubmission',
        progress: 50,
        startedAt: new Date('2026-08-19')
      }
    ];
    const enrollments = await Enrollment.insertMany(enrollmentsData);
    console.log(`✓ Seeded ${enrollments.length} Enrollments`);

    // 7. Submissions
    const submissionsData = [
      {
        activityId: activities[7]._id.toString(),
        studentId: users[0]._id.toString(),
        enrollmentId: enrollments[5]._id.toString(),
        status: 'submitted',
        attempts: [
          {
            submittedAt: new Date('2026-08-20T11:00:00.000Z'),
            text: 'Queries cover MCC mix, ticket size and a weekend vs weekday split. Narrative attached.',
            link: 'https://gist.example.com/ananya-sql',
            notes: 'Used window functions for rank of categories.',
            fileName: 'merchant-mix.sql'
          }
        ],
        xpAwarded: 0
      },
      {
        activityId: activities[7]._id.toString(),
        studentId: users[1]._id.toString(),
        enrollmentId: enrollments[6]._id.toString(),
        status: 'under_review',
        attempts: [
          {
            submittedAt: new Date('2026-08-19T09:00:00.000Z'),
            text: 'Included a cohort of first-time merchants in Pune.',
            link: '',
            notes: 'Need a second pair of eyes on NULL handling.',
            fileName: 'isha-mcc.sql'
          }
        ],
        xpAwarded: 0
      },
      {
        activityId: activities[8]._id.toString(),
        studentId: users[7]._id.toString(),
        enrollmentId: enrollments[7]._id.toString(),
        status: 'needs_resubmission',
        attempts: [
          {
            submittedAt: new Date('2026-08-21T07:00:00.000Z'),
            text: 'Draft memo. Ask is still buried in paragraph three.',
            link: '',
            notes: 'Will tighten the lead.'
          }
        ],
        score: 52,
        feedback: 'Lead with the ask. Cut 40%. Resubmit by Friday.',
        xpAwarded: 0,
        reviewedAt: new Date('2026-08-21T08:00:00.000Z'),
        reviewerId: users[8]._id.toString()
      },
      {
        activityId: activities[0]._id.toString(),
        studentId: users[0]._id.toString(),
        enrollmentId: enrollments[0]._id.toString(),
        status: 'approved',
        attempts: [
          {
            submittedAt: new Date('2026-08-09T12:00:00.000Z'),
            text: 'Compared UPI, cards and wallets on latency, dispute path and merchant onboarding.',
            link: '',
            notes: 'Interviewed one kirana owner.',
            fileName: 'rails-one-pager.pdf'
          }
        ],
        score: 91,
        feedback: 'Clear structure. Add one sentence on chargebacks.',
        xpAwarded: 220,
        reviewedAt: new Date('2026-08-10T09:00:00.000Z'),
        reviewerId: users[9]._id.toString()
      }
    ];
    await Submission.insertMany(submissionsData);
    console.log(`✓ Seeded Submissions`);

    // 8. Achievements
    const achievementsData = [
      { key: 'first_step', title: 'First Step', description: 'Enrol in your first activity.' },
      { key: 'fast_learner', title: 'Fast Learner', description: 'Complete an activity within 48 hours of starting.' },
      { key: 'seven_day', title: '7 Day Streak', description: 'Learn on seven consecutive days.' },
      { key: 'team_player', title: 'Team Player', description: 'Contribute to a team project.' },
      { key: 'course_master', title: 'Course Master', description: 'Finish a certificate course.' },
      { key: 'project_champion', title: 'Project Champion', description: 'Ship an approved project.' },
      { key: 'mentor_mindset', title: 'Mentor Mindset', description: 'Attend a mentoring session.' },
      { key: 'katalyst_leader', title: 'Katalyst Leader', description: 'Reach the top five on the global board.' }
    ];
    const achievements = await Achievement.insertMany(achievementsData);
    console.log(`✓ Seeded ${achievements.length} Achievements`);

    // 9. Student Achievements
    await StudentAchievement.insertMany([
      { studentId: users[0]._id.toString(), achievementId: achievements[0]._id.toString(), unlockedAt: new Date('2026-07-02') },
      { studentId: users[0]._id.toString(), achievementId: achievements[4]._id.toString(), unlockedAt: new Date('2026-08-10') },
      { studentId: users[0]._id.toString(), achievementId: achievements[2]._id.toString(), unlockedAt: new Date('2026-08-20') },
      { studentId: users[0]._id.toString(), achievementId: achievements[3]._id.toString(), unlockedAt: new Date('2026-08-06') },
      { studentId: users[6]._id.toString(), achievementId: achievements[7]._id.toString(), unlockedAt: new Date('2026-08-01') },
      { studentId: users[1]._id.toString(), achievementId: achievements[1]._id.toString(), unlockedAt: new Date('2026-07-20') }
    ]);

    // 10. Missions
    await Mission.insertMany([
      { title: 'Three this week', description: 'Complete three activities before Sunday.', target: 3, unit: 'activities', period: 'week' },
      { title: '500 XP month', description: 'Earn 500 XP this month from approved work.', target: 500, unit: 'xp', period: 'month' },
      { title: 'Squad ship', description: 'Complete a team project with your squad.', target: 1, unit: 'projects', period: 'open' }
    ]);

    // 11. XP Transactions
    await XPTransaction.insertMany([
      { studentId: users[0]._id.toString(), amount: 220, reason: 'Payments Studio approved', activityId: activities[0]._id.toString() },
      { studentId: users[0]._id.toString(), amount: 40, reason: 'Streak bonus — 7 days' },
      { studentId: users[6]._id.toString(), amount: 180, reason: 'Trust course', activityId: activities[1]._id.toString() }
    ]);

    // 12. Notifications
    await Notification.insertMany([
      { audience: 'student', userId: users[0]._id.toString(), title: 'SQL Case due soon', body: 'Merchant Mix is due 27 Aug. Submit from Assignments.', kind: 'deadline', read: false },
      { audience: 'student', userId: users[0]._id.toString(), title: '+220 XP', body: 'Payments Studio was approved. You are closer to Level 8.', kind: 'xp', read: false },
      { audience: 'student', userId: users[0]._id.toString(), title: '7 Day Streak', body: 'Badge unlocked. Keep the path warm tomorrow.', kind: 'achievement', read: true },
      { audience: 'student', userId: users[0]._id.toString(), title: 'Nexus stand-up', body: 'Kavya pushed the wallet onboard flow. Review before Thursday demo.', kind: 'team', read: false },
      { audience: 'admin', title: 'Pending reviews', body: '2 submissions waiting: SQL Case (Ananya, Isha).', kind: 'review', read: false },
      { audience: 'admin', title: 'At-risk students', body: 'Meera Joshi and Aditi Rao are below participation thresholds.', kind: 'risk', read: false }
    ]);

    // 13. Complaints
    await Complaint.insertMany([
      {
        userId: users[0]._id.toString(),
        category: 'Session access',
        subject: 'DSA Clinic link expired',
        description: 'The calendar invite for 22 Aug still points to a ended Zoom room.',
        priority: 'medium',
        status: 'under_review'
      }
    ]);

    // 14. Feedback
    await Feedback.insertMany([
      {
        userId: users[0]._id.toString(),
        category: 'Learning design',
        rating: 5,
        message: 'Payments Studio felt like real work, not a slideshow.'
      }
    ]);

    // 15. Certificates
    await Certificate.insertMany([
      { studentId: users[0]._id.toString(), activityId: activities[0]._id.toString(), title: 'Payments Studio', issuedAt: new Date('2026-08-10') },
      { studentId: users[1]._id.toString(), activityId: activities[1]._id.toString(), title: 'Trust & Security Fundamentals', issuedAt: new Date('2026-08-12') }
    ]);

    // 16. Extracurricular
    await Extracurricular.insertMany([
      { title: 'Code & Chai club', kind: 'club', description: 'Weekly peer clinic for DSA and Git.', xpReward: 25, date: new Date('2026-08-23') },
      { title: 'Smart India Hackathon warm-up', kind: 'hackathon', description: '24-hour campus warm-up with a payments prompt.', xpReward: 80, date: new Date('2026-09-06') },
      { title: 'Blood donation drive', kind: 'volunteering', description: 'College NSS desk — morning shift.', xpReward: 30, date: new Date('2026-08-24') },
      { title: 'Squad lead rotation', kind: 'leadership', description: 'Two-week Nexus rotation for stand-ups.', xpReward: 40, date: new Date('2026-08-18') }
    ]);

    // 17. Meetings
    await Meeting.insertMany([
      {
        title: 'Career Story with Priya (PM)',
        description: '1:1 mentoring on internships, storytelling and interview loops.',
        mentorName: 'Priya Sharma',
        studentId: users[0]._id.toString(),
        scheduledAt: new Date('2026-08-25T09:30:00.000Z'),
        durationMinutes: 45,
        meetingMode: 'online',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
        status: 'scheduled',
        reschedulable: true,
        candidateSlots: [
          new Date('2026-08-25T11:00:00.000Z'),
          new Date('2026-08-25T16:00:00.000Z'),
          new Date('2026-08-26T10:00:00.000Z')
        ],
        rescheduleDeadline: new Date('2026-08-24T09:30:00.000Z')
      }
    ]);

    // 18. Collaborations
    await Collaboration.insertMany([
      {
        studentIds: [users[0]._id.toString(), users[1]._id.toString()],
        projectTitle: 'Inclusion Wallet pairing',
        adminRationale: 'Frontend + backend skill sets complement each other.',
        studentMessage: 'Your skill sets complement each other.',
        responses: [
          { studentId: users[0]._id.toString(), status: 'pending' },
          { studentId: users[1]._id.toString(), status: 'pending' }
        ]
      }
    ]);

    // 19. Volunteer applications
    await VolunteerApplication.insertMany([
      {
        name: 'Neha Iyer',
        email: 'neha.iyer@example.com',
        interests: ['Mentoring', 'Career Guidance'],
        skills: ['React', 'Node.js'],
        status: 'pending',
        message: 'I can support weekend mentoring clinics.'
      },
      {
        name: 'Rohit Menon',
        email: 'rohit.menon@example.com',
        interests: ['Mentoring'],
        skills: ['SQL', 'Python'],
        college: 'IIT Madras',
        status: 'pending',
        message: 'Available for data-clinic office hours.'
      },
      {
        name: 'Aditi Rao',
        email: 'aditi.rao@example.com',
        interests: ['Volunteering', 'Mentoring'],
        skills: ['Public speaking', 'Excel'],
        college: 'SNDT Women\'s University',
        status: 'approved',
        message: 'Already volunteers with the campus NSS desk.'
      }
    ]);

    console.log('✅ Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
