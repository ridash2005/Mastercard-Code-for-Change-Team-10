# Katalyst Standalone Backend (`backend/api`)

A robust, production-grade Express.js & MongoDB backend for the Katalyst student and administrator portals — plus the guarded gateway into `/ai` (see `services/ai/` and `routes/aiRoutes.js`; `POST /api/ai/coach/message` and `POST /api/ai/judge/score-submission`). This is the only backend the frontend talks to, and the only thing that talks to `/ai`.

---

## 🏗️ Architecture

Clean 4-tier layered architecture:

```
routes → controllers → services → models/database
```

- **`models/`**: Mongoose schemas defining all data entities, validation rules, and JSON serialization.
- **`services/`**: Pure business logic (gamification formulas, review approvals, XP ledgers, badge unlocking, audit trails).
- **`controllers/`**: HTTP request parsing, status codes, and standardized API response formats (`{ success, message, data }`).
- **`routes/`**: Express routers with role-based JWT middleware (`authenticate`, `authorize`, `optionalAuth`).
- **`middleware/`**: JWT validation, centralized error handling, and structured logging.
- **`config/`**: Environment variable parsing and database connection management.
- **`scripts/`**: Standalone database seeding and automated API test suites.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** | Runtime Environment |
| **Express.js (v4.21)** | RESTful API Web Framework |
| **MongoDB & Mongoose (v8.10)** | Document Database & ODM |
| **JSON Web Tokens (`jsonwebtoken`)** | Stateless Authentication & RBAC |
| **Bcrypt.js** | Password Hashing |
| **CORS & Morgan** | Cross-Origin Resource Sharing & Request Logging |

---

## 📋 Environment Variables

Create a `.env` file in the `backend/api` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://127.0.0.1:27017/katalyst

# Security & JWT
JWT_SECRET=supersecretjwtkey_katalyst_2026_change_in_production
JWT_EXPIRES_IN=7d

# Frontend Connection
CLIENT_URL=http://localhost:3000
```

---

## 🚀 Quickstart & How to Run

### 1. Install Dependencies
```bash
cd backend/api
npm install
```

### 2. Start MongoDB
Ensure a local MongoDB daemon is running on port `27017`, or configure a MongoDB Atlas URI in `.env`.

### 3. Seed Database
Populate MongoDB with demo student and admin accounts, sample courses, squads, achievements, and meetings:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
The API server will listen on `http://localhost:5000`.

### 5. Run Verification Tests
Execute the end-to-end API test suite:
```bash
npm run test:api
```

---

## 🔐 Authentication & Roles

The platform enforces two roles:
1. **`student`**: Fellows who can view personalised dashboards, browse catalog, enroll, submit work, reschedule sessions, and track XP/ranks.
2. **`admin`**: Programme operations managers who create activities, schedule meetings, review submissions, award XP, and access analytics.

### Demo Credentials (Pre-seeded)

| Name | Email | Password | Role |
|---|---|---|---|
| Ananya Munshi | `ananya@katalyst.edu` | `password123` | `student` |
| Isha Verma | `isha@katalyst.edu` | `password123` | `student` |
| Priya Sharma | `priya.admin@katalyst.edu` | `password123` | `admin` |
| Arjun Desai | `arjun.admin@katalyst.edu` | `password123` | `admin` |

---

## 📚 API Endpoints Overview

| Module | Route | Method | Access | Description |
|---|---|---|---|---|
| **Health** | `/api/health` | `GET` | Public | System & DB connection status |
| **Auth** | `/api/auth/register` | `POST` | Public | Register new student or admin |
| | `/api/auth/login` | `POST` | Public | Authenticate user & receive JWT |
| | `/api/auth/me` | `GET` | Private | Current user & profile |
| | `/api/auth/onboarding` | `POST` | Private | Complete onboarding profile |
| **Users** | `/api/users/profile` | `GET / PUT` | Private | View/update current profile |
| | `/api/users` | `GET` | Admin | List all users (paginated) |
| | `/api/users/students/at-risk`| `GET` | Admin | List at-risk & inactive students |
| **Activities** | `/api/activities` | `GET` | Public/Auth | List & filter activities |
| | `/api/activities/:id` | `GET` | Public/Auth | Get activity details |
| | `/api/activities` | `POST` | Admin | Create course/training/project |
| | `/api/activities/:id` | `PUT / DELETE`| Admin | Update or delete activity |
| **Enrollments**| `/api/enrollments` | `GET` | Private | List student enrollments |
| | `/api/enrollments` | `POST` | Private | Enroll in an activity |
| | `/api/enrollments/:id/start`| `PATCH` | Private | Transition status to `in_progress` |
| **Submissions**| `/api/submissions` | `GET / POST` | Private | Submit work / view attempts |
| | `/api/submissions/:id/review`| `POST` | Admin | Approve/reject & award XP |
| **Meetings** | `/api/meetings` | `GET` | Private | List sessions |
| | `/api/meetings` | `POST / PUT` | Admin | Schedule/edit meeting |
| | `/api/meetings/:id/reschedule`| `POST` | Private | Student reschedule slot |
| **Gamification**| `/api/gamification/dashboard`| `GET` | Private | Level, XP, streak, rank metrics |
| | `/api/gamification/leaderboard`| `GET` | Public/Auth | Global student leaderboard |
| | `/api/gamification/achievements`| `GET` | Private | Unlocked & available badges |
| | `/api/gamification/xp-transactions`| `GET` | Private | Append-only XP ledger |
| **Teams** | `/api/teams` | `GET` | Public | List squads and rankings |
| | `/api/teams/:id/members` | `POST` | Admin | Add/update team member |
| **Complaints** | `/api/complaints` | `GET / POST` | Private | Student grievance redressal |
| | `/api/complaints/:id/status`| `PATCH` | Admin | Update grievance status |
| **Feedback** | `/api/feedback` | `GET / POST` | Private | Submit star rating & review |
| **Certificates**| `/api/certificates` | `GET` | Private | View issued certificates |
| **Analytics** | `/api/admin/analytics/overview`| `GET`| Admin | Programme KPI metrics |
| | `/api/admin/analytics/reports`| `GET` | Admin | Fellow performance reports |

For comprehensive Postman-ready payloads and curl commands, refer to [`API_TESTING.md`](./API_TESTING.md).

---

## 🔗 Frontend-Backend Integration

The backend is fully compatible with the existing frontend data structures:

1. **Base URL**: Point the frontend HTTP client to `http://localhost:5000/api`.
2. **CORS**: Configured out of the box to accept requests from `http://localhost:3000` with credentials.
3. **Authentication**: Transmit JWT in header:
   ```http
   Authorization: Bearer <token>
   ```
4. **Data Shapes**: All models implement standard `id` virtual mapping and camelCase fields matching `frontend/lib/types.ts`.
