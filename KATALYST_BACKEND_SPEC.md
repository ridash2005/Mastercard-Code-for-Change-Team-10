# Katalyst — Backend Spec (MVP, MongoDB)

> Consolidates `Katalyst_Build_Spec_for_Claude_Code.md` (production architecture, §1–§13),
> `KATALYST_BACKEND_MVP_HANDOFF.md` (hackathon-MVP delta: two-portal RBAC, personalisation,
> meetings, notifications), and the backend-relevant deltas from the visual/UX design brief
> (`Katalyst_Claude_Prompt.md`: skills catalogue, career goal, the journey map, and flexible
> session rescheduling) into one backend-only spec. **Database is now MongoDB** (Atlas), not
> Postgres/Supabase — every schema below is a Mongo collection, not a SQL table. Where source docs
> conflict, the most specific/most recent decision wins (two roles, no Mentor portal, personalised
> onboarding, weekly not daily streaks). AI Judge/AI Coach implementation detail lives in
> `KATALYST_AI_SPEC.md` — this doc only covers what the backend must expose to and consume from
> `/ai`.

---

## 1. Stack

| Layer | Choice |
|---|---|
| Runtime | Node.js + TypeScript |
| API | Next.js Route Handlers (`app/api/**`) — no separate Fastify service for the hackathon build; revisit only if load requires it |
| Database | **MongoDB Atlas** (free M0 tier) via `mongodb` driver or Mongoose |
| Vector search (RAG, see AI spec) | **MongoDB Atlas Vector Search** (`$vectorSearch`) on a `knowledge_chunks` collection — no separate vector DB |
| File/object storage | Supabase Storage or Cloudinary free tier (S3-compatible signed uploads); Mongo GridFS only if neither is available |
| Cache / jobs | Upstash Redis (free tier) for leaderboard + job queue (BullMQ-compatible via ioredis, or a lightweight cron/worker if time-boxed) |
| Auth | JWT-based, 2 roles only (`student`, `admin`) — see §3 |
| Email | Resend or Brevo free tier, provider-abstracted (§9) |
| Hosting | Vercel (frontend + API routes), MongoDB Atlas (DB), Upstash (cache) |
| Observability | pino/console structured logs; defer OpenTelemetry/Grafana past MVP |

`shared-types` (TS types shared with frontend) lives in `backend/shared-types`. AI packages
(`ai-client`, `ai-judge`, `ai-coach`, `python/`) live in `/ai` and are imported by the backend as
libraries — the backend owns persistence, routing, and RBAC; `/ai` owns prompting, scoring
schemas, and tool logic. See `KATALYST_AI_SPEC.md` for the contract between them.

---

## 2. Roles (MVP — locked)

Only two authenticated roles exist:

```text
student
admin
```

No Mentor portal, no `mentor` authenticated role, no separate Higher Management portal —
`higher_management` is an Admin view/permission, not a role. Mentors exist only as **records**
managed by Admin (§8) and are never JWT subjects.

---

## 3. MongoDB Collections

Conventions: every document has `_id: ObjectId`. Cross-collection references store the referenced
`_id` (named `xId`) rather than embedding, **except** where the child is always read/written with
its parent (meeting participants, student interests) — those are embedded arrays. Timestamps are
`createdAt`/`updatedAt` (ISO `Date`), added by the driver/ODM, not hand-maintained.

### 3.1 `users`

```ts
{
  _id: ObjectId,
  externalId: string | null,        // Katalyst Konnect ID, if SSO'd later
  name: string,
  email: string,                    // unique index
  passwordHash: string,             // if not using an external IdP
  role: "student" | "admin",
  cohort: string | null,
  batchYear: number | null,         // 1-4
  onboardingCompleted: boolean,     // default false
  createdAt: Date, updatedAt: Date
}
```
Unique index on `email`. Index on `role`, `cohort`.

### 3.2 `student_profiles` (1:1 with `users` where `role === 'student'`)

```ts
{
  _id: ObjectId,
  userId: ObjectId,                 // unique index, ref users
  collegeName: string | null,
  dateOfBirth: Date | null,         // collected at onboarding step 1, per frontend spec §6.1
  academicField: string | null,     // interest_domain key
  programmeYear: number | null,     // 1-4
  careerGoal: string | null,        // free-enter or picked from a short suggested list; onboarding step 4
  bio: string | null,
  interests: [                      // embedded — always read with the profile
    { interestKey: string, priority: number /* default 1 */, selectedAt: Date }
  ],
  skills: [                         // embedded — "skills to improve", onboarding step 3
    { skillKey: string, selectedAt: Date }
  ],
  notificationPreferences: {
    emailNotificationsEnabled: boolean,     // default true
    courseRecommendationEmails: boolean,    // default true
    meetingUpdateEmails: boolean            // default true
  },
  createdAt: Date, updatedAt: Date
}
```

### 3.3 `interest_domains` (seeded, admin-editable catalogue)

```ts
{
  _id: ObjectId,
  key: string,        // unique, e.g. "technology"
  name: string,        // "Technology"
  description: string | null,
  isActive: boolean,   // default true
  createdAt: Date
}
```
Seed set: `technology, business, leadership, communication, languages, financial_literacy,
entrepreneurship, sustainability, professional_development, social_impact, digital_literacy`.

### 3.3b `skill_domains` (seeded, admin-editable catalogue — same shape as `interest_domains`)

```ts
{
  _id: ObjectId,
  key: string,        // unique, e.g. "dsa"
  name: string,        // "DSA"
  description: string | null,
  isActive: boolean,   // default true
  createdAt: Date
}
```
Seed set: `dsa, programming, web_development, git_github, cloud, databases, communication,
leadership, problem_solving, system_design, project_management`. Powers onboarding step 3
(§6.1 frontend spec), the editable skills list on the student profile, and `skills[]` tagging on
`modules` (§3.4) so the recommendation engine and journey map (§7 below) can match students to
skill-building activities, not just interest domains.

### 3.4 `modules`

```ts
{
  _id: ObjectId,
  type: "training_session" | "online_course" | "mentoring" | "project" | "assignment" |
        "team_contribution" | "certificate_course" | "optional_activity" | "other",
  title: string,
  description: string,
  summary: string | null,
  mode: "mandatory" | "optional" | "certificate",
  difficulty: "beginner" | "intermediate" | "advanced" | null,
  estimatedMinutes: number | null,
  thumbnailUrl: string | null,
  dueDate: Date | null,
  xpWeight: number,
  isTeamBased: boolean,             // default false
  rubricId: ObjectId,               // ref rubrics
  partnerOrganisationId: ObjectId | null,   // ref partner_organisations
  domains: [                        // embedded — module ↔ interest_domain, many-to-many
    { interestKey: string, relevanceWeight: number /* default 1.0 */ }
  ],
  skills: [ { skillKey: string, skillName: string } ],
  createdBy: ObjectId,               // ref users (admin)
  status: "draft" | "published" | "archived",
  publishedAt: Date | null,          // set once, used to gate "already notified" (§9.2)
  createdAt: Date, updatedAt: Date
}
```
Indexes: `status`, `type`, `domains.interestKey`, `dueDate`.

### 3.5 `rubrics`

```ts
{
  _id: ObjectId,
  version: number,
  moduleType: string,                // matches modules.type
  criteria: [ { key: string, name: string, weightPct: number, description: string } ], // sums to 100
  aiJudgePromptTemplate: string,
  confidenceThreshold: number,       // default 0.8
  xpCapPeriod: "monthly" | null,     // for optional_activity
  xpCapAmount: number | null,
  createdAt: Date
}
```

### 3.6 `rubric_role_criteria` (team-project role slices)

```ts
{ _id: ObjectId, rubricId: ObjectId, teamRole: string, criteria: [ {key, name, weightPct, description} ] }
```

### 3.7 `performance_levels` (fixed, seeded once — 4 documents, never per-rubric)

```ts
{ _id: ObjectId, key: "not_demonstrated"|"developing"|"proficient"|"excellent", label: string, percentage: number }
```
0 / 50 / 75 / 100 respectively. Reviewers (AI or human) only ever pick one of these four keys —
never a free numeric score.

### 3.8 `teams` / `team_memberships`

```ts
teams: { _id, name, cohort, createdAt }
team_memberships: {
  _id, teamId: ObjectId, userId: ObjectId,
  teamRole: "frontend_developer"|"backend_developer"|"database_developer"|"qa_engineer"|"product_analyst"
}
```
Compound unique index `(teamId, userId)`.

### 3.9 `enrollments`

```ts
{
  _id: ObjectId, moduleId: ObjectId,
  userId: ObjectId | null, teamId: ObjectId | null,   // exactly one must be set — enforced in service layer
  status: "enrolled"|"in_progress"|"submitted"|"under_review"|"completed"|"overdue",
  enrolledAt: Date
}
```

### 3.10 `submissions`

```ts
{
  _id: ObjectId, enrollmentId: ObjectId, submittedBy: ObjectId,
  teamRole: string | null,
  artifactType: "file"|"link"|"text"|"attendance_sync"|"certificate",
  artifactRef: string,           // storage key / URL / inline text
  submittedAt: Date
}
```

### 3.11 `reviews`

```ts
{
  _id: ObjectId, submissionId: ObjectId,
  reviewerType: "ai_judge"|"management",
  reviewerUserId: ObjectId | null,       // set when Admin drafts/edits/approves
  rubricId: ObjectId,
  criteriaLevels: [ { criterionKey: string, levelKey: string, weightPct: number, earnedPct: number, justification: string } ],
  totalEarnedPct: number,
  xpAwarded: number,
  feedbackText: string,
  confidence: number | null,             // AI Judge only
  flags: string[],                        // e.g. ["possible_plagiarism","attendance_only_no_learning_action"]
  suggestedBonus: string | null,          // advisory only, see §10 bonus_awards
  mentorConfirmation: {                   // MVP: no mentor portal, Admin records this on the mentor's behalf
    confirmed: boolean, mentorId: ObjectId | null, confirmedAt: Date | null, notes: string | null
  } | null,
  status: "ai_draft"|"auto_approved"|"pending_review"|"approved"|"overridden"|"rejected",
  createdAt: Date, decidedAt: Date | null
}
```
Index on `status`, `submissionId`.

### 3.12 `bonus_awards`

```ts
{ _id, userId, reviewId: ObjectId | null, bonusType: string, xpAmount: number, awardedBy: ObjectId, reason: string, createdAt }
```
`awardedBy` must always resolve to an `admin` user — AI Judge can only *suggest* via
`reviews.suggestedBonus`, never insert here itself.

### 3.13 `xp_ledger` (append-only)

```ts
{ _id, userId: ObjectId | null, teamId: ObjectId | null, sourceType: "review"|"mission"|"badge_bonus"|"manual_adjustment", sourceId: ObjectId, xpAmount: number, reason: string, createdAt: Date }
```
**No update/delete API route ever exists for this collection.** Enforce at the service layer
(Mongo has no per-collection write-permission grants like Postgres roles, so this must be a hard
rule in the API layer + a code-review-enforced invariant — consider a Mongo view or a dedicated DB
user without `update`/`remove` privileges on this collection if Atlas RBAC is configured).

### 3.14 `badges` / `user_badges`

```ts
badges: { _id, code: string, name, description, ruleExpression: object, iconUrl, tier }
user_badges: { _id, userId, badgeId, awardedAt }
```
Compound unique index `(userId, badgeId)` on `user_badges` for idempotent awarding.

### 3.15 `streaks` (weekly, meaningful-action only)

```ts
{ _id, userId, activityType: "weekly_participation", currentWeekCount: number, longestWeekCount: number, lastQualifyingWeek: Date /* ISO week start */, freezeTokens: number }
```

### 3.16 `missions` / `mission_progress`

```ts
missions: { _id, title, description, criteria: object, rewardXp: number, scope: "individual"|"team", startDate, endDate, createdBy }
mission_progress: { _id, missionId, userId: ObjectId | null, teamId: ObjectId | null, status: "accepted"|"in_progress"|"completed", completedAt }
```

### 3.17 `mentors` (records only — never authenticated)

```ts
{ _id, name: string, email: string | null, organisation: string | null, expertise: string[], active: boolean, createdAt }
```

### 3.18 `mentor_meetings`

```ts
{
  _id, mentorId: ObjectId | null,
  title: string, description: string | null,
  startAt: Date, endAt: Date,
  meetingMode: "online"|"offline"|"hybrid",
  meetingLink: string | null, location: string | null,
  status: "scheduled"|"rescheduled"|"cancelled"|"completed",
  participants: [                       // embedded — always read/written with the meeting
    { studentId: ObjectId, attendanceStatus: "pending"|"attended"|"missed"|"excused" }
  ],
  reschedulable: boolean,               // default true; admin-set per meeting
  createdBy: ObjectId, createdAt: Date, updatedAt: Date
}
```
Index on `participants.studentId`, `startAt`.

### 3.18b `meeting_reschedule_slots` (Admin-configured candidate slots + the outcome)

```ts
{
  _id: ObjectId, meetingId: ObjectId,      // ref mentor_meetings
  candidateSlots: [ { startAt: Date, endAt: Date } ],   // admin-entered open slots
  deadline: Date,                          // reschedule cutoff — one calendar day before meeting.startAt
  selectedByStudentId: ObjectId | null,    // set once a participant picks a slot
  selectedSlot: { startAt: Date, endAt: Date } | null,
  selectedAt: Date | null,
  createdAt: Date, updatedAt: Date
}
```
One document per meeting. `deadline` is computed as `meeting.startAt - 1 day` at creation and
re-derived whenever Admin edits `startAt`. A student may only call the reschedule endpoint
(§5.2) while `now < deadline`; the service layer rejects (`409`) any attempt after the deadline,
and the frontend hides the affordance entirely rather than showing a disabled control (frontend
spec §6.10). On a successful reschedule: update `mentor_meetings.startAt/endAt`, set
`status='rescheduled'`, write this document's `selected*` fields, and fire the existing
`meeting_updated` notification event (§9) — reschedule is just a student-initiated instance of the
same "material meeting field changed" trigger Admin's own edits use.

### 3.19 `partner_organisations`

```ts
{ _id, name, description: string|null, logoUrl: string|null, contactName: string|null, contactEmail: string|null, website: string|null, active: boolean, createdAt }
```
Optional: `interestKeys: string[]` embedded instead of a join table.

### 3.20 `notification_rules` / `notification_log` / `notification_events`

```ts
notification_rules: { _id, triggerType: string, condition: object, audience: "student"|"admin", channel: "in_app"|"email"|"whatsapp", messageTemplate: string, active: boolean }
notification_log:   { _id, ruleId: ObjectId | null, recipientUserId: ObjectId, sentAt: Date, payload: object }
notification_events: {                 // outbox pattern, see §9
  _id, eventType: "meeting_created"|"meeting_rescheduled"|"meeting_cancelled"|"meeting_updated"|
                   "module_published"|"submission_approved"|"xp_awarded"|"feedback_available"|"deadline_reminder",
  entityType: string, entityId: ObjectId, payload: object,
  status: "pending"|"processing"|"sent"|"failed", attempts: number,
  idempotencyKey: string,             // unique index — prevents duplicate sends on retry
  createdAt: Date, processedAt: Date | null
}
```
MVP only needs `meeting_*` and `module_published` wired end-to-end (§9).

### 3.21 `in_app_notifications`

```ts
{ _id, userId: ObjectId, type: string, title: string, message: string, entityType: string, entityId: ObjectId, read: boolean, createdAt: Date }
```

### 3.22 Gamification-adjacent: `student_topic_performance`

```ts
{ _id, userId, subject: string, topic: string, accuracyPct: number, attempts: number, lastAttemptAt: Date, trend: "improving"|"stable"|"declining", updatedAt: Date }
```
Compound unique index `(userId, subject, topic)`. **Never** duplicated into the vector-search
collection — passed to the LLM as SQL/Mongo-query context at answer time only (see AI spec §data
separation).

### 3.23 Knowledge base + RAG (see `KATALYST_AI_SPEC.md` for the pipeline; schema owned here)

```ts
knowledge_documents: {
  _id, uploadedBy: ObjectId, title: string,
  sourceType: "curriculum"|"notes"|"worksheet"|"faq"|"remedial_material"|"teacher_knowledge",
  fileRef: string,
  metadata: { grade: string, subject: string, chapter: string, topic: string, documentType: string, source: string, version: string, language: string },
  status: "uploaded"|"parsing"|"chunked"|"embedded"|"failed",
  createdAt: Date
}
knowledge_chunks: {                      // Atlas Vector Search index lives on this collection
  _id, documentId: ObjectId, text: string, embedding: number[],   // vector field
  metadata: { grade, subject, chapter, topic, documentType, source, version, language }
}
rag_eval_set: { _id, question, approvedAnswer, subject, topic, grade, approvedBy: ObjectId, createdAt }
```

### 3.24 Peer collaboration / squad matching (see `KATALYST_AI_SPEC.md` §matching for the algorithm)

```ts
study_squads: { _id, subject, topic, status: "proposed"|"active"|"completed"|"disbanded", formedBy: "system_match"|"student_request"|"mentor_assigned", createdAt, disbandedAt }
squad_members: { _id, squadId, userId, roleInSquad: "seeking_help"|"offering_help"|"both", matchedStrengthTopic: string|null, matchedGapTopic: string|null, joinedAt, leftAt }
squad_match_runs: { _id, runAt, candidatesConsidered: number, squadsFormed: number, avgReciprocityScore: number }
squad_messages: { _id, squadId, senderId, body: string, moderationFlag: "toxic"|"off_topic"|"reviewed_ok"|null, createdAt }
peer_endorsements: { _id, squadId, fromUserId, toUserId, topic, comment: string, createdAt }
```

### 3.25 `audit_log`

```ts
{ _id, actorUserId: ObjectId, action: string, entityType: string, entityId: ObjectId, diff: object, createdAt: Date }
```
Never store passwords/tokens/provider secrets in `diff`.

---

## 4. Invariants the service layer must enforce

(Same intent as the original Postgres CHECK constraints — Mongo has no CHECK, so these are
**application-layer invariants**, enforced in the service/repository functions, not the schema.)

- `xp_ledger` is insert-only — no route ever calls `updateOne`/`deleteOne`/`deleteMany` on it.
- A `review` causes an `xp_ledger` insert only when `status IN ('auto_approved','approved')`.
- `reviews.rubricId` must always be set — never score against an unversioned rubric.
- Every mutation to `modules`, `rubrics`, `reviews` (admin edits), `mentor_meetings` writes an
  `audit_log` document.
- `reviews.criteriaLevels[].levelKey` must only be one of the 4 seeded `performance_levels` keys.
- `bonus_awards.awardedBy` must always resolve to an `admin` user.
- `student_topic_performance` and `knowledge_documents`/`knowledge_chunks` are hard-separated —
  never write individual performance data into the vector-search collection.
- `enrollments`: exactly one of `userId`/`teamId` is set, never both, never neither.
- `notification_events.idempotencyKey` unique index prevents duplicate sends on job retry.
- `module_published` email must not re-fire if Admin edits an already-`published` module — gate on
  `modules.publishedAt` being newly set (transition `draft → published`), not on every save.

---

## 5. API Contract (REST, JSON)

Base path `/api/v1`. Auth via `Authorization: Bearer <JWT>`; role enforced server-side on every
route — never trust a client-supplied role claim. All list endpoints support `?page=&pageSize=`
and return `{data, total, page}`.

### 5.1 Auth + onboarding (freeze first — frontend builds against these, §11)
```
POST /auth/register          {name, email, password, role: "student"}
POST /auth/login             {email, password} -> {token, user}
GET  /me                     -> current user + profile

GET  /interests               -> active interest_domains
GET  /skills                  -> active skill_domains (§3.3b)
POST /me/onboarding           {college_name, date_of_birth, academic_field, programme_year,
                                interest_keys[], skill_keys[], career_goal}
GET  /me/interests
PUT  /me/interests             {interest_keys[]}   -- validates every key, replaces transactionally
PUT  /me/skills                {skill_keys[]}       -- same pattern as interests
PATCH /me/profile              {career_goal?, bio?, college_name?}
```

### 5.2 Student homepage
```
GET /me/dashboard             -- aggregate read model, see §7
GET /me/recommendations       -- see §6
GET /me/journey               -- learning journey map read model, see §7b
GET /me/notifications
PATCH /me/notifications/:id/read
GET /me/meetings
GET /me/meetings/:id/reschedule-slots     -- candidate slots, only if reschedulable && before deadline
POST /me/meetings/:id/reschedule           {slot_index}  -- 409 if past deadline or not reschedulable
GET /me/xp
GET /me/enrollments
GET /leaderboard?scope=individual|team&window=week|month|year&cohort=
GET /me/notification-preferences
PUT /me/notification-preferences
```

### 5.3 Activities (student-facing)
```
GET  /modules?status=published&domain=&type=
GET  /modules/:id
POST /enrollments             {module_id}
POST /submissions             {enrollment_id, artifact_type, artifact_ref, team_role?}
```

### 5.4 Admin
```
POST  /modules                {type, title, mode, due_date, xp_weight, is_team_based, rubric_id, domains[], skills[]}
PATCH /modules/:id             -- update/publish/archive; publish triggers §9 event flow
POST  /rubrics                 {module_type, criteria[], ai_judge_prompt_template, confidence_threshold}

GET   /reviews?status=pending_review&cohort=&module_type=
PATCH /reviews/:id             {criteria_levels?, feedback_text?, status, mentor_confirmation?}
                                -- xp_awarded is ALWAYS recomputed server-side from final levels

POST  /bonus-awards            {user_id, review_id?, bonus_type, xp_amount, reason}  -- admin-only

GET   /admin/dashboard
GET   /reports?filters...

GET   /admin/meetings
POST  /admin/meetings          {mentor_id?, title, description, start_at, end_at, meeting_mode, meeting_link?, location?, participant_student_ids[], reschedulable?}
GET   /admin/meetings/:id
PATCH /admin/meetings/:id      -- diffs material fields, fires meeting_updated event (§9)
PUT   /admin/meetings/:id/reschedule-slots   {candidate_slots[]}  -- admin-configured options, see §3.18b

GET   /admin/partners
POST  /admin/partners
GET   /admin/partners/:id
PATCH /admin/partners/:id

POST  /notification-rules
PATCH /notification-rules/:id
GET   /escalations
```

### 5.5 AI surfaces (backend routes that call into `/ai`, see AI spec)
```
POST /coach/message                          {user_id, message}
GET  /coach/nudges/pending
POST /internal/ai-judge/score-submission     -- invoked on submission-created event, not client-facing
POST /internal/attendance-sync                -- webhook
```

---

## 6. Personalised recommendation service

`GET /me/recommendations` — backend-owned, **not** frontend logic. Deterministic ranking for MVP,
no LLM required:

```
recommendation_score =
    interest_match        * 0.45
  + academic_field_match  * 0.15
  + programme_year_match  * 0.10
  + activity_relevance    * 0.10
  + urgency               * 0.10
  + progress_context      * 0.10
```

Minimum rules: exclude archived/unpublished modules; prioritise modules matching the student's
`student_profiles.interests`; prioritise mandatory modules due soon; never recommend an already-
completed module as "next action"; optional activities still respect the §8 monthly XP cap; always
return a human-readable `recommendation_reason`. Powers: dashboard, Explore, AI Coach context
(`get_personalised_recommendations` tool, see AI spec), and course-published email targeting.

Response shape per item — see §7's module-card contract (`recommendation.is_recommended` +
`recommendation.reason`).

---

## 7. Aggregate read models (frontend-friendly)

### `GET /me/dashboard`
```json
{
  "profile": {"id":"", "name":"", "programme_year":2, "academic_field":"technology", "career_goal":"Software Engineer", "interests":["technology","leadership"], "skills":["dsa","git_github"]},
  "gamification": {"total_xp":2340,"level":7,"level_name":"Trailblazer","xp_to_next_level":160,"weekly_streak":4,"rank":18,"completion_pct":72},
  "next_best_action": {},
  "recommendations": [],
  "upcoming_deadlines": [],
  "upcoming_meetings": [],
  "active_projects": [],
  "recent_achievements": [],
  "recent_activity": []
}
```
Detailed single-purpose endpoints still exist independently; this is a homepage-only rollup so the
frontend doesn't fan out into 10 requests. `completion_pct` also drives the dashboard welcome
line the frontend renders (e.g. "you're 72% through your current learning journey," frontend spec
§6.2) — compute it the same way as the journey map's own completion metric below so the two never
disagree.

### `GET /me/journey` (Learning Journey Map read model — frontend spec §6.7)
```json
{
  "completion_pct": 72,
  "nodes": [
    {
      "id": "module:uuid-or-synthetic", "title": "DSA Foundations", "category": "technology",
      "status": "completed", "xp_reward": 40, "badge": {"code":"problem_solver"},
      "estimated_minutes": 60, "unlock_requirement": null, "module_id": "uuid"
    },
    {
      "id": "module:uuid2", "title": "Trees & Graphs", "category": "technology",
      "status": "current", "xp_reward": 60, "badge": null,
      "estimated_minutes": 90, "unlock_requirement": null, "module_id": "uuid2"
    },
    {
      "id": "module:uuid3", "title": "System Design Foundations", "category": "technology",
      "status": "locked", "xp_reward": 80, "badge": null,
      "estimated_minutes": 120, "unlock_requirement": "Complete Trees & Graphs", "module_id": "uuid3"
    }
  ]
}
```
Ordering is derived from the same recommendation inputs as §6 (career goal, interests, academic
field, prerequisite/enrollment order) — sequenced into a single linear path rather than returned as
an unordered relevance-ranked list like `/me/recommendations`. `status` is computed from
`enrollments`/`reviews` state (`completed` reviews → `completed` node; the first not-yet-completed
node in sequence → `current`; everything after it → `locked`, with `unlock_requirement` set to the
current node's title). Do not persist a separate "path" document — this is a read model computed
on request from existing `enrollments`/`modules`/`student_profiles` data, so it always reflects
live progress.

### Module card contract (used by catalog, Explore, recommendations)
```json
{
  "id": "...", "type": "online_course", "title": "...", "summary": "...",
  "mode": "optional",
  "domains": [{"key":"financial_literacy","name":"Financial Literacy"}],
  "difficulty": "beginner", "estimated_minutes": 90,
  "due_date": null, "xp_weight": 100, "is_team_based": false,
  "enrollment_status": null,
  "recommendation": {"is_recommended": true, "reason": "Matches your Financial Literacy interest."}
}
```

### Meeting response contract
```json
{
  "id": "...", "title": "Career Readiness Mentoring Session",
  "mentor": {"id":"...", "name":"Priya Mehta", "organisation":"Partner Organisation"},
  "start_at": "2026-08-24T15:00:00+05:30", "end_at": "2026-08-24T16:00:00+05:30",
  "meeting_mode": "online", "meeting_link": "https://example.com/meeting",
  "status": "scheduled", "reschedulable": true,
  "reschedule_deadline": "2026-08-23T15:00:00+05:30"
}
```

---

## 8. Meetings (Admin-managed, no Mentor portal)

`mentors` are records (§3.17), never authenticated. Admin owns full CRUD over
`mentor_meetings` (§3.18) and confirms mentor-side data (e.g. `action_item_completion` for
mentoring rubrics, §10) on the mentor's behalf. Required routes: see §5.2/§5.4.

### 8b. Flexible rescheduling

When Admin marks a meeting `reschedulable: true` and configures `meeting_reschedule_slots`
(§3.18b), an affected student may move their own session to one of the admin-offered slots up
until `deadline` (one calendar day before the current `startAt`). After the deadline, or if the
meeting isn't reschedulable, `GET /me/meetings/:id/reschedule-slots` returns an empty list /
`404` so the frontend can hide the affordance entirely (frontend spec §6.10). A successful
`POST /me/meetings/:id/reschedule` updates the meeting's `startAt`/`endAt`, sets
`status='rescheduled'`, and reuses the existing `meeting_updated` notification flow (§9) — no
separate event type is needed for a student-initiated reschedule vs. an admin-initiated one.

---

## 9. Notification architecture

Never send email inside the main write transaction. Flow:

```
Admin action -> DB write succeeds -> notification_events insert (pending)
  -> queue -> email worker -> transactional email provider -> notification_log
```

A lightweight async job/worker is enough for the hackathon (BullMQ+Upstash, or a simple polling
worker on `notification_events` if time-boxed). Use `idempotencyKey` so retries never double-send.

**Trigger A — meeting update.** If Admin changes `start_at`, `end_at`, `meeting_mode`,
`meeting_link`, `location`, or `status`, email affected `participants`. Skip emails for
internal-only field changes.

**Trigger B — module published.** On `draft -> published`: find relevant students —
mandatory modules notify the whole cohort/year; optional/recommended modules notify students whose
`student_profiles.interests` intersect `modules.domains`. Create in-app notifications + enqueue
email jobs. Do not re-fire on subsequent edits to an already-published module (gate on the
`draft->published` transition specifically).

**Preferences** (`GET/PUT /me/notification-preferences`): `course_recommendation_emails` respects
opt-out; meeting updates always create an in-app notification regardless of preference; email
sending for meetings follows `meeting_update_emails`.

### Event sequences
```
PATCH /modules/:id (draft->published)
  -> save module -> find relevant students -> create in-app notifications
  -> enqueue email jobs -> respond success

PATCH /admin/meetings/:id
  -> load previous values -> apply update -> diff material fields
  -> if student-visible change: create meeting_updated event -> notify participants
  -> create in-app notifications -> enqueue email jobs
```

Email provider interface (provider-agnostic, so Resend/Brevo are swappable):
```ts
interface EmailService {
  sendCoursePublishedEmail(input: CoursePublishedEmailInput): Promise<void>;
  sendMeetingUpdatedEmail(input: MeetingUpdatedEmailInput): Promise<void>;
}
```
Minimum requirements: async delivery, retry on failure, idempotency, success/failure logging, no
provider keys ever reach the frontend, env-var configured.

---

## 10. AI Judge / Coach integration points (implementation in `KATALYST_AI_SPEC.md`)

The backend's job: trigger scoring, persist results, enforce routing/XP invariants, and expose the
review queue. It does **not** own prompt templates or scoring logic — that's `/ai`.

- On `submissions` insert (or `attendance_sync` webhook): enqueue `score-submission` job with
  `submission_id`; call into `@katalyst/ai-judge`'s `scoreSubmission` with the loaded
  submission/enrollment/module/rubric.
- Validate the returned `criteria_levels` against the rubric + `performance_levels` (already done
  inside `ai-judge`, but the backend must re-validate before persisting — never trust unvalidated
  LLM output into the DB).
- **XP is always computed server-side** (backend calls `@katalyst/ai-judge`'s deterministic XP
  function) — never persist a model-provided number as-is.
- Apply routing (`auto_approved` / `pending_review`) per the rules in `KATALYST_AI_SPEC.md` §AI
  Judge routing — including: mentoring's `action_item_completion` always requires Admin
  confirmation (no Mentor portal, §8); training-session attendance alone never yields full XP.
- `auto_approved` → insert `xp_ledger`, set `enrollments.status = 'completed'`, notify AI Coach
  service to deliver feedback (§coach feedback delivery in AI spec).
- `pending_review` → surfaces in `GET /reviews` with the AI draft pre-filled; `PATCH /reviews/:id`
  lets Admin change any `level_key` before approving; XP is recomputed from whatever's finally
  confirmed, never taken from the AI Judge's own arithmetic.
- Coach tools that read live data (`get_student_progress`, `get_leaderboard`,
  `get_module_catalog`, `get_student_preferences`, `get_personalised_recommendations`,
  `search_knowledge_base`, `get_topic_performance`) are implemented in `/ai` but call back into
  backend repository functions/DB queries — the backend owns the actual Mongo queries; `/ai` owns
  the tool-calling loop and prompt.

---

## 11. Gamification engine logic

- **XP calc**: `sum(criterion.weightPct * level.percentage/100)` scaled by `module.xpWeight`,
  written once per approved review, server-side, never recalculated after the fact — corrections
  are a new `manual_adjustment` ledger entry with a reason.
- **Optional-activity monthly cap**: before an `xp_ledger` insert for `module.mode === 'optional'`,
  sum that user's optional-mode XP already earned this calendar month; if it would exceed
  `rubric.xpCapAmount` (default 150/month), clip the inserted amount and record the clip in
  `reason`; the full uncapped score stays on the `review` for transparency.
- **Levels**: static threshold table (config, not hardcoded) mapping cumulative XP →
  level name; computed on read from `sum(xp_ledger.xpAmount)` for that user.
- **Bonus variables**: always a separate `bonus_awards` insert, always `admin`-authorized. Never
  grant `early_completion_quality` if the review's quality-related criteria scored `developing` or
  below.
- **Streaks — weekly only**: a job runs at each week boundary; a qualifying week needs ≥1 of:
  attended a session, submitted an activity, completed a mentoring action item, responded to
  feedback, completed a course unit (detected via a qualifying `xp_ledger`/`reviews` event in that
  ISO week). Freeze tokens hold the streak through one missed week.
- **Engagement-health signals never touch XP or streaks** — pure read-model queries
  (`days_since_last_meaningful_activity`, `overdue_mandatory_task_count`, etc.) that drive Coach
  support-nudges and Admin escalation only.
- **Badges**: evaluated synchronously right after every `xp_ledger` insert; idempotent via the
  `(userId, badgeId)` unique index on `user_badges`. Seed catalogue (matches frontend spec §6.5):
  `first_steps` (complete first activity), `momentum` (5 activities in a week), `problem_solver`
  (20 coding challenges), `consistent_learner` (streak milestone), `explorer` (activities across 5
  skill categories), `project_builder` (submit first project) — each a `rule_expression` evaluated
  against the user's aggregate stats.
- **Leaderboard**: Redis sorted set (`ZINCRBY leaderboard:{scope}:{window} xp_amount user_id`),
  updated on every ledger write, DB (`xp_ledger` aggregation) as fallback source of truth.

---

## 12. RBAC (two portals)

**Student can**: register/login, complete onboarding, choose/edit interests, view personalised
dashboard, browse/search/filter activities, enroll, submit work, view XP/feedback/journey/
meetings/notifications, use AI Coach, view leaderboard.

**Student cannot**: create/publish modules, approve reviews, change XP, create/update meetings,
manage other students.

**Admin can**: manage modules/rubrics, manage students, manage mentor *records* and meetings,
publish courses, review submissions, approve/edit AI Judge drafts, award/confirm XP, view
programme analytics, manage partner organisations, view engagement-health signals, generate
reports, manage notification rules.

Do not expose `/mentor/*` or any `higher_management`-role-gated route for the MVP.

---

## 13. Non-functional requirements

- **Security**: validate file type/size on upload; signed upload URLs; RBAC enforced server-side on
  every route, never trust client role claims; never log provider secrets/passwords.
- **Auditability**: every `modules`/`rubrics`/`reviews`/`mentor_meetings` mutation writes
  `audit_log`; `xp_ledger` is insert-only by convention + code review (see §4).
- **Performance**: leaderboard reads via Redis (O(1)-ish); AI Judge calls are async — submission
  API returns `202 Accepted` with `status: pending_scoring`, never blocks on the LLM call.
- **Resilience**: AI Judge/Coach calls wrapped with retry + circuit breaker; on sustained AI
  outage, new submissions route straight to `pending_review` (fail open to the human queue, never
  silently drop).
- **Observability**: minimum — auto-approval rate, override rate, review turnaround time, nudge
  delivery success rate, monthly engagement %.

---

## 14. Environment & config

`.env` (never committed): `MONGODB_URI`, `REDIS_URL` (Upstash), `GEMINI_API_KEY` (the only LLM key
required — see `KATALYST_AI_SPEC.md` §1; no `GROQ_API_KEY`), `EMAIL_PROVIDER_*`, `JWT_SECRET`,
storage provider keys, `KATALYST_KONNECT_API_*` (if/when SSO is wired). No `ANTHROPIC_API_KEY`
requirement for the hackathon build — free-tier LLM only. The current `backend/api` build (see
`backend/api/.env.example`) is narrower than this full list: `PORT`, `NODE_ENV`, `MONGO_URI`,
`JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `GEMINI_API_KEY`, `INTERNAL_AI_KEY` (a separate
shared secret gating the non-client-facing AI Judge scoring route) — Redis/email/storage/SSO vars
are not yet wired up.

Feature-flag/config collection: AI Judge confidence thresholds per module type, nudge rule
toggles, escalation thresholds — Admin-tunable without a redeploy.

---

## 15. Testing strategy

- **Unit**: XP calc, badge rule evaluator, streak logic, rubric-score-to-XP mapping, recommendation
  scoring — pure functions, high coverage.
- **Contract tests**: AI Judge output schema validation using fixtures (already covered in
  `ai/ai-judge/test`).
- **Integration**: submission → AI Judge → routing → (auto-approve or queue) → ledger write →
  leaderboard update, end-to-end against a test Mongo instance (in-memory Mongo or a disposable
  Atlas dev cluster).
- **Notification targeting tests**: module-published email reaches interest-matching students only;
  meeting-update email reaches only participants; no duplicate sends on retry (idempotency key).
- **Load test**: leaderboard read path and AI Judge queue under a simulated due-date submission
  burst.

---

## 16. Build order (backend)

### Phase 1 — Auth + personalisation
Two-role auth, `student_profiles`, `interest_domains` + `skill_domains` seed, onboarding API
(incl. date of birth, career goal, skills), edit-interests/edit-skills API, module domain tagging.

### Phase 2 — Core learning loop
Admin create/publish module, student personalised catalog, enroll, submit.

### Phase 3 — Notifications
`mentors`/`mentor_meetings`, Admin meeting CRUD, in-app notifications, email provider,
meeting-update + module-published events end-to-end, `meeting_reschedule_slots` + student
reschedule endpoint (§8b).

### Phase 4 — Scoring
Wire `@katalyst/ai-judge` (already built in `/ai`) to the submission-created trigger, Admin review
queue, deterministic XP, ledger writes.

### Phase 5 — Student experience
`/me/dashboard` aggregate, `/me/journey` (learning journey map), `/me/recommendations`, meetings,
deadlines, achievements, leaderboard.

### Phase 6 — AI Coach
Wire `@katalyst/ai-coach` (already built in `/ai`) to `/coach/message`, feed it live progress +
preferences + recommendations via backend-owned tool-executor functions, feedback-delivery event
hook, nudge job.

### Phase 7+ — Everything scoped post-MVP in the original build spec
Badges/streaks/leaderboard polish, team-contribution formula, peer-squad matching wiring
(`ai/python/matching.py` already built), mentor RAG knowledge base wiring, hardening.

---

## 17. Acceptance tests (backend demo-ready bar)

**Flow A — Personalised onboarding**: register → select Technology + Leadership → save →
dashboard recommendations contain matching modules → change interests → recommendations change.

**Flow B — Relevant course notification**: Admin creates + tags + publishes an optional Technology
course → Technology-interested students get in-app notification + email job → unrelated students
get neither.

**Flow C — Meeting reschedule notification**: Admin schedules a meeting with Student A → changes
the time → Student A gets in-app notification + email job with the new time.

**Flow D — XP loop**: student submits → AI Judge drafts criterion levels → Admin reviews and
approves → server computes XP → ledger entry appears → dashboard total changes.

**Flow E — AI Coach personalisation**: "What should I do next?" → Coach fetches live progress +
preferences/recommendations → references a real matching activity → never invents XP or course
data.

---

## 18. Definition of Done (backend MVP skeleton)

- Mongo collections/indexes for every model in §3.
- Two-role RBAC.
- Onboarding + interest APIs, editable preferences.
- Module domain tagging + personalised recommendations endpoint.
- Meeting model + Admin CRUD + student meetings endpoint.
- In-app notification model + email provider abstraction + meeting-update and module-published
  triggers, both idempotent.
- Frozen API response contracts (§5) so frontend can build against mocks in parallel.
- Seed data: `interest_domains`, `performance_levels`, sample modules/rubrics.
- Unit/integration tests for recommendation targeting and email triggers.
- Then: submission/review flow, AI Judge wiring, XP engine, dashboard aggregate, AI Coach wiring.

Do not block frontend development — the contracts in §5.1/§5.2/§5.3/§5.4 (review queue) are frozen
first; frontend builds against mocks of these while the backend implementation is in progress.
