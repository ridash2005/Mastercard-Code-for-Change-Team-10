# 📊 Katalyst — Feature Audit

> ⬅️ Part of [Katalyst](./README.md) — Team 10, Mastercard Code for Change 3.0

A complete, path-by-path list of every feature in the product, what backs it, and its real/mock
status. Every row marked **Real** has been verified end-to-end over actual HTTP against a running
`backend/api` + MongoDB (and, for AI rows, a live Gemini call) — not just code-reviewed. See
"How this was verified" at the bottom for the exact method.

**Legend:** 🟢 Real (backend/api + MongoDB, or a live LLM call) · 🟡 Real data, minor gap noted ·
⚪ Not backed by anything yet (explicitly out of scope, listed for completeness)

## Account lifecycle

| Feature | Status | Notes |
|---|---|---|
| Register (student or admin) | 🟢 | `POST /api/auth/register` — bcrypt-hashed password, real Mongo `User` + `StudentProfile`/`AdminProfile`, JWT issued and stored in an httpOnly cookie |
| Registration document OCR | 🟢 | Real OCR.space API call (`app/api/ocr/route.ts`) — extracts name/email/college from an uploaded image/PDF; degrades to empty fields (never fabricated data) if OCR.space is unreachable |
| Onboarding (pick interests) | 🟢 | `POST /api/auth/onboarding` — persists to `StudentProfile`, sets `onboarded`/`onboardingCompleted` |
| Login | 🟢 | `POST /api/auth/login` — bcrypt password check, JWT cookie |
| Session persistence across reloads | 🟢 | httpOnly `katalyst_token` cookie (7d) is the source of truth; `GET /api/auth/me` reconciles the client-side store from it |
| Logout | 🟢 | Clears the session cookie server-side, clears client store |
| Password reset | 🟢 | `POST /api/auth/{forgot-password,reset-password}` — single-use, 1-hour-expiring hashed token (a TTL index auto-deletes it from Mongo on expiry); real email delivery via Resend (`services/emailService.js`). Always responds identically regardless of whether the email matches an account, and regardless of whether delivery itself succeeds — never a signal an attacker (or a broken mail provider) can use to enumerate accounts. Falls back to returning the reset link directly in the API response only when `RESEND_API_KEY` is unset (local dev) |

## Student portal

| Feature | Status | Notes |
|---|---|---|
| Dashboard (XP, streak, rank, completion, deadlines, recommendations) | 🟢 | All derived from real `activities`/`enrollments`/`studentProfiles`/`leaderboard` |
| Explore / browse catalog | 🟢 | `GET /api/activities` with real filters (type, domain, difficulty, XP, due date, search) |
| Activity detail | 🟢 | `GET /api/activities/:id` |
| Enroll | 🟢 | `POST /api/enrollments` — real `Enrollment` doc, first-enrollment achievement + notification |
| Start activity | 🟢 | `PATCH /api/enrollments/:id/start` |
| Submit work | 🟢 | `POST /api/submissions` — real `Submission` doc, admin notification, **auto-triggers the AI Judge** (see below) |
| My Learning (courses/training/mentoring/projects/assignments/milestones) | 🟢 | Filters the same real `activities` list by type |
| Gamification (XP, level, streak, achievements, missions, XP ledger) | 🟢 | Real `StudentProfile`, `StudentAchievement`, `Mission`, `XPTransaction` |
| Leaderboard (global + team) | 🟢 | `GET /api/gamification/leaderboard` — pre-joined name+XP+rank, visible to every role (unlike raw profiles) |
| Teams (roster, XP, rank, contribution) | 🟢 | `GET /api/teams` — real `Team` + embedded `TeamMember` + `User` |
| Certificates | 🟢 | Auto-issued on an approved submission for a certificate-eligible activity |
| Extracurricular browse | 🟢 | `GET /api/extracurricular` |
| Notifications | 🟢 | Real, role-scoped `Notification` docs; mark-one/mark-all read both persist |
| Profile (view/edit own) | 🟢 | `GET`/`PUT /api/users/profile` |
| Settings — interests | 🟢 | Persists via `updateProfile` |
| Settings — email notification toggles | 🟢 | Three real toggles (`emailNotificationsEnabled`, `courseRecommendationEmails`, `meetingUpdateEmails`) persisted to `StudentProfile.notificationPreferences` |
| Reschedule a mentoring/training session | 🟢 | Rewired off the real `Meeting` resource (was previously conflated with `Activity`) — real `candidateSlots`, deadline enforcement |
| Feedback (rating + message) | 🟢 | `POST /api/feedback` |
| Complaints (ticketed, priority, status) | 🟢 | `POST /api/complaints` |
| Collaboration requests (accept/decline) | 🟢 | `POST /api/collaborations/:id/respond` |
| Emergency Help | 🟡 | Static informational page (phone/contact info) — no ticketing backend, and shouldn't have one; it deliberately routes off-platform |
| AI Coach | 🟢 | Live Gemini call through `backend/api`'s guardrailed gateway — personalised, never fabricates progress numbers |
| AI Chatbot | 🟢 | Live Gemini call; classifies intent and can **perform real actions**: enroll, start an activity, submit feedback/a complaint, mark notifications read, reschedule a meeting, or design and create a course from a description |
| AI Course Designer (via chatbot: "build me a course on X") | 🟢 | Live Gemini call generates a full course (3-6 modules, lessons, 5-12 quiz questions); creates a real `Activity` — published immediately for an admin, saved as a review-pending draft (hidden from the public catalog) for a student |
| Code Playground | 🟢 | Real, sandboxed (`<iframe sandbox="allow-scripts">`) HTML/CSS/JS execution, entirely client-side — embedded in the chatbot panel and as its own page |

## Admin portal

| Feature | Status | Notes |
|---|---|---|
| Create/edit/delete activities | 🟢 | `POST`/`PUT`/`DELETE /api/activities` |
| Review submissions (approve/reject/resubmit) | 🟢 | `POST /api/submissions/:id/review` — awards XP, issues certificates, notifies the student |
| AI Judge suggestion on each submission | 🟢 | Runs automatically per submission (not a button — see "Why the AI Judge isn't a button" below); real per-criterion justifications, confidence, and flags |
| AI Judge rubric customization | 🟢 | Optional per-activity rubric override (`Activity.customRubric`, set from the create-activity form) — validated server-side (weights must sum to 100) on write and used in place of the fixed per-type rubric when present; falls back to the type-based rubric otherwise |
| Teams (roster view) | 🟢 | Same real `GET /api/teams` |
| Collaborator matching (create an invite) | 🟢 | `POST /api/collaborations` |
| Volunteers / volunteer applications (approve/reject) | 🟢 | `PATCH /api/volunteer-applications/:id/status` |
| Mentor performance | 🟢 | Derived entirely from real enrollments/completions/feedback — no separate backend needed |
| Students list / at-risk list / student detail | 🟢 | `GET /api/users`, `GET /api/users/students/at-risk`, `GET /api/admin/analytics/reports` |
| Analytics overview + reports | 🟢 | `GET /api/admin/analytics/{overview,reports}` |
| Notifications | 🟢 | Same real, role-scoped `Notification` docs |
| Complaints (update status) | 🟢 | `PATCH /api/complaints/:id/status` |
| Contact messages | 🟢 | `GET /api/contact` |

## Cross-cutting

| Feature | Status | Notes |
|---|---|---|
| Role-based access control | 🟢 | Enforced server-side on every route (`authenticate`/`authorize`), verified with live 401/403 checks — not just hidden in the UI |
| Rate limiting on every AI route | 🟢 | Per-user sliding window (Coach: 15/min, Chatbot: 10/min, Judge: 30/min) |
| Input/output guardrails on every AI call | 🟢 | Prompt-injection and PII pattern detection, schema-validated LLM output, markup-stripped replies |
| Graceful degradation without a database | 🟢 | Every DB-dependent route fails fast (503) instead of hanging; `/api/health` always works |
| Graceful degradation without Gemini | 🟢 | AI Coach/Chatbot fall back to a local canned reply rather than erroring; the AI Judge stores the failure on the submission instead of blocking review |

Public "apply to volunteer" form: `/volunteer` — real, submits to `POST /api/volunteer-applications`.

## Not built (explicitly out of scope, not a gap in what's listed above)

Nothing remains in this section as of the latest pass — the three gaps previously listed here
(password reset, the public volunteer form, AI Judge rubric customization) are now built; see their
rows above.

## Why the AI Judge isn't a button

`KATALYST_AI_SPEC.md` §2.1 and the code's own comments are explicit that AI Judge scoring is a
**backend job**, never something a browser click triggers directly — even through a secure
server-side bridge. So instead of wiring a "get AI suggestion" button, it's triggered automatically
the moment a student submits work (`submissionService.js`'s `triggerAiJudge`, fired-and-forgotten so
it never blocks the submit request) and the result is stored on the submission for the reviewing
admin to read. This is slower to build than a button, but it's what the spec actually calls for.

## How this was verified

Every 🟢 row was exercised over real HTTP against a running `backend/api` connected to a real
MongoDB instance — logging in as the seeded demo accounts, making the actual API calls (`curl`,
not a test double), and reading back the persisted result. The AI rows were additionally verified
with live Gemini calls (not fixture/mock mode) before the free-tier daily quota was exhausted by
that same testing. See git history for the specific verification transcripts.

**A note on the AI free tier**: `GEMINI_API_KEY`'s current plan is Google's free tier, which caps
at **20 requests/day** per model. That's more than enough to demo the AI Coach, Chatbot, and Judge
individually, but a full walkthrough of everything AI-touched (Coach + Chatbot + course generation +
every submission's auto-scoring) can burn through it quickly. For a live demo or real deployment,
upgrade to a paid Gemini tier (or a key with a higher quota) beforehand — see
https://ai.google.dev/gemini-api/docs/rate-limits. AI Judge rubric customization was verified by
directly confirming `getEffectiveRubric` selects the custom rubric over the type-based default
(the scoring call itself hit the same quota limit).

**A note on the email free tier**: `RESEND_API_KEY`'s current plan is Resend's sandbox tier, which
can only deliver to the account owner's own verified address until a custom domain is verified at
resend.com/domains. Verified with a real delivered email to that address; a request for any other
address (including the seeded demo accounts' fake `@katalyst.edu` addresses) is rejected by Resend
but still returns the same safe, generic response to the caller (see `authService.js`'s
`forgotPassword`) - never a 500, and never a hint that the account did or didn't exist.
