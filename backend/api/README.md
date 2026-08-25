# ⚙️ Katalyst Standalone Backend (`backend/api`)

<p>
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-runtime-339933?style=flat-square&logo=node.js&logoColor=white">
  <img alt="Express" src="https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white">
  <img alt="MongoDB" src="https://img.shields.io/badge/Mongoose-8.10-47A248?style=flat-square&logo=mongodb&logoColor=white">
  <img alt="JWT" src="https://img.shields.io/badge/Auth-JWT-black?style=flat-square&logo=jsonwebtokens&logoColor=white">
  <img alt="Deployed on Vercel" src="https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white">
</p>

A robust, production-grade Express.js & MongoDB backend for the Katalyst student and administrator portals — plus the guarded gateway into `/ai` (see `services/ai/` and `routes/aiRoutes.js`; `POST /api/ai/coach/message` and `POST /api/ai/judge/score-submission`). This is the only backend the frontend talks to, and the only thing that talks to `/ai`.

Part of Katalyst, built by Team 10 for Mastercard Code for Change 3.0 — see the
[root README](../../README.md#team) for the full team and the repository link.

**Live:** https://katalyst-backend-api.vercel.app/api/health

### Contents

[Architecture](#architecture) · [Tech Stack](#tech-stack) · [Environment Variables](#environment-variables) · [Quickstart](#quickstart--how-to-run) · [Auth & Roles](#authentication--roles) · [API Endpoints](#api-endpoints-overview) · [Deploying to Vercel](#deploying-to-vercel) · [Frontend Integration](#frontend-backend-integration)

---

<a id="architecture"></a>

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

<a id="tech-stack"></a>

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

<a id="environment-variables"></a>

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
JWT_EXPIRES_IN=24h

# Frontend Connection
CLIENT_URL=http://localhost:3000

# AI gateway (backend/api -> ai/ai-client -> Gemini). Leave unset to run the
# AI Coach in fixture mode (no live calls, no key required) for local dev.
GEMINI_API_KEY=

# Shared secret required (in addition to an admin JWT) for the internal,
# non-client-facing AI Judge scoring route. No default - that route stays
# disabled (503) until this is set.
INTERNAL_AI_KEY=

# Password reset email delivery (services/emailService.js), via Resend. Leave
# unset to run forgot-password in dev mode - the reset link is returned
# directly in the response instead of emailed.
RESEND_API_KEY=
RESEND_FROM_EMAIL=Katalyst <onboarding@resend.dev>
FRONTEND_URL=http://localhost:3000
```

See `.env.example` in this directory for the full annotated list, and root `.env.example` for the frontend's AI Coach bridge config (`BACKEND_API_URL`, `BACKEND_DEMO_PASSWORD` — must match the demo accounts' seeded password below).

---

<a id="quickstart--how-to-run"></a>

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

<a id="authentication--roles"></a>

## 🔐 Authentication & Roles

The platform enforces two roles:
1. **`student`**: Fellows who can view personalised dashboards, browse catalog, enroll, submit work, reschedule sessions, and track XP/ranks.
2. **`admin`**: Programme operations managers who create activities, schedule meetings, review submissions, award XP, and access analytics.

### Demo Credentials (Pre-seeded)

| Name | Email | Password | Role |
|---|---|---|---|
| Ananya Munshi | `ananya@katalyst.edu` | `katalyst-demo-bridge-2026` | `student` |
| Isha Verma | `isha@katalyst.edu` | `katalyst-demo-bridge-2026` | `student` |
| Priya Sharma | `priya.admin@katalyst.edu` | `katalyst-demo-bridge-2026` | `admin` |
| Arjun Desai | `arjun.admin@katalyst.edu` | `katalyst-demo-bridge-2026` | `admin` |

---

<a id="api-endpoints-overview"></a>

## 📚 API Endpoints Overview

| Module | Route | Method | Access | Description |
|---|---|---|---|---|
| **Health** | `/api/health` | `GET` | Public | System & DB connection status |
| **Auth** | `/api/auth/register` | `POST` | Public | Register new student or admin |
| | `/api/auth/login` | `POST` | Public | Authenticate user & receive JWT |
| | `/api/auth/me` | `GET` | Private | Current user & profile |
| | `/api/auth/onboarding` | `POST` | Private | Complete onboarding profile |
| | `/api/auth/forgot-password` | `POST` | Public | Request a password reset email (rate-limited) |
| | `/api/auth/reset-password` | `POST` | Public | Complete a reset using the emailed token (rate-limited) |
| **Users** | `/api/users/profile` | `GET / PUT` | Private | View/update current profile |
| | `/api/users` | `GET` | Admin | List all users (paginated) |
| | `/api/users/students/at-risk`| `GET` | Admin | List at-risk & inactive students |
| **Activities** | `/api/activities` | `GET` | Public/Auth | List & filter activities |
| | `/api/activities/:id` | `GET` | Public/Auth | Get activity details |
| | `/api/activities` | `POST` | Admin | Create course/training/project - optionally with a `customRubric` (weights must sum to 100) overriding the AI Judge's default per-type rubric |
| | `/api/activities/:id` | `PUT / DELETE`| Admin | Update or delete activity |
| **Enrollments**| `/api/enrollments` | `GET` | Private | List student enrollments |
| | `/api/enrollments` | `POST` | Private | Enroll in an activity |
| | `/api/enrollments/:activityId` | `GET` | Private | Get one enrollment's detail |
| | `/api/enrollments/:activityId/start`| `PATCH` | Private | Transition status to `in_progress` |
| **Submissions**| `/api/submissions` | `GET / POST` | Private | Submit work / view attempts |
| | `/api/submissions/:id` | `GET` | Private | Get one submission's detail |
| | `/api/submissions/:id/review`| `POST` | Admin | Approve/reject & award XP |
| **Meetings** | `/api/meetings` | `GET` | Private | List sessions |
| | `/api/meetings/:id` | `GET` | Private | Get one meeting's detail |
| | `/api/meetings` | `POST` | Admin | Schedule a meeting |
| | `/api/meetings/:id` | `PUT / DELETE` | Admin | Update or cancel a meeting |
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
| | `/api/certificates/:id` | `GET` | Private | Get one certificate's detail |
| **Notifications**| `/api/notifications` | `GET` | Private | List current user's notifications |
| | `/api/notifications/:id/read`| `PATCH` | Private | Mark one notification read |
| | `/api/notifications/read-all`| `PATCH` | Private | Mark all notifications read |
| **Extracurricular**| `/api/extracurricular` | `GET` | Public/Auth | List clubs, volunteering, drives |
| | `/api/extracurricular/:id` | `GET` | Public/Auth | Get one activity's detail |
| | `/api/extracurricular` | `POST` | Admin | Create an extracurricular activity |
| **Contact** | `/api/contact` | `POST` | Public | Submit a contact form message |
| | `/api/contact` | `GET` | Admin | List contact form submissions |
| **Collaborations**| `/api/collaborations` | `GET` | Private | List collaboration invites (own, or all for admin) |
| | `/api/collaborations` | `POST` | Admin | Create a collaboration invite between students |
| | `/api/collaborations/:id/respond` | `POST` | Private | Student accepts/declines an invite |
| **Volunteers** | `/api/volunteer-applications` | `GET` | Admin | List volunteer applications |
| | `/api/volunteer-applications` | `POST` | Public | Submit a volunteer application |
| | `/api/volunteer-applications/:id/status` | `PATCH` | Admin | Approve/reject an application |
| **Analytics** | `/api/admin/analytics/overview`| `GET`| Admin | Programme KPI metrics |
| | `/api/admin/analytics/reports`| `GET` | Admin | Fellow performance reports |
| **AI gateway** | `/api/ai/coach/message` | `POST` | Private (student/admin) | Guardrailed AI Coach chat — input/output validation, rate-limited (see `services/ai/`) |
| | `/api/ai/chatbot/message` | `POST` | Private (student/admin) | Guardrailed general chatbot — classifies intent and can perform real actions (enroll, submit feedback/complaint, mark notifications read, reschedule, draft a course) via `services/chatbotActionService.js` |
| | `/api/ai/judge/score-submission` | `POST` | Admin + `INTERNAL_AI_KEY` | Not client-facing — scores a submission via `@katalyst/ai-judge`; requires both an admin JWT and the internal service key header. In practice the Judge runs automatically per-submission (see `submissionService.js`'s `triggerAiJudge`), not via this route — see `KATALYST_AI_SPEC.md` §2.1 |

For comprehensive Postman-ready payloads and curl commands, refer to [`API_TESTING.md`](./API_TESTING.md) (covers the non-AI routes only — see `KATALYST_AI_SPEC.md` for the AI gateway's request/response contracts).

---

<a id="deploying-to-vercel"></a>

## ☁️ Deploying to Vercel

This project already ships `vercel.json` and `scripts/vercel-build.js` (see that file's comments
for why the AI client gets vendored into `node_modules/@katalyst/ai-client-vendor` — under
`node_modules` specifically, not some arbitrary folder, so Vercel's Functions builder leaves the
compiled ESM output alone instead of mis-transpiling it — rather than imported cross-directory).
Currently deployed at https://katalyst-backend-api.vercel.app as the `ridash/katalyst-backend-api`
Vercel project. To redeploy:

```bash
cd backend/api
vercel link --yes            # first time only, links to the existing project
vercel deploy --prod --yes
```

Env vars (`MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `NODE_ENV`, `GEMINI_API_KEY`,
`INTERNAL_AI_KEY`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CLIENT_URL`, `FRONTEND_URL`) are managed
via `vercel env add <NAME> production` / `vercel env rm <NAME> production` — not committed anywhere.
`CLIENT_URL`/`FRONTEND_URL` must match the deployed frontend's URL (CORS + password-reset links).

Two gotchas discovered getting this running on Vercel, in case they recur:

1. **`mongodb+srv://` doesn't resolve from Vercel's serverless functions.** SRV lookups need a raw
   DNS query the runtime couldn't complete, and the connection hung indefinitely instead of failing
   fast. Fix: use the plain `mongodb://` form with an explicit host list instead of `+srv`. Get the
   three shard hostnames and `replicaSet` name via `nslookup -type=SRV
   _mongodb._tcp.<cluster>.mongodb.net` and `nslookup -type=TXT <cluster>.mongodb.net`, then build:
   ```
   mongodb://<user>:<pass>@<shard0>:27017,<shard1>:27017,<shard2>:27017/<db>?ssl=true&replicaSet=<name>&authSource=admin&retryWrites=true&w=majority
   ```
   Local dev keeps using the normal `mongodb+srv://` form (`.env.example`) - only the Vercel-side
   env var needs the expanded form.
2. **Atlas Network Access must allow `0.0.0.0/0`** (Vercel's serverless IPs aren't static) under
   Atlas → Security → Network Access, and the entry's status must show **Active**, not Pending,
   before redeploying.

If `/api/health` reports `"database":{"connected":false}` after a deploy, check
`vercel logs <deployment-url>` for the actual Mongoose error (or `error.reason` detail logged by
`config/db.js`) before assuming it's a code problem — it's almost always Atlas network access or
the connection string form above.

---

<a id="frontend-backend-integration"></a>

## 🔗 Frontend-Backend Integration

The backend is fully compatible with the existing frontend data structures:

1. **Base URL**: Point the frontend HTTP client to `http://localhost:5000/api` locally, or
   `https://katalyst-backend-api.vercel.app/api` against the deployed backend (`BACKEND_API_URL` in
   the frontend's env - see root `.env.example`).
2. **CORS**: Configured via `CLIENT_URL` to accept requests from `http://localhost:3000` locally, or
   the deployed frontend's origin in production, with credentials.
3. **Authentication**: Transmit JWT in header:
   ```http
   Authorization: Bearer <token>
   ```
4. **Data Shapes**: All models implement standard `id` virtual mapping and camelCase fields matching `frontend/lib/types.ts`.
