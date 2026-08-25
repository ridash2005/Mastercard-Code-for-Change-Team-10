# 🖥️ Katalyst — Frontend Spec (Student + Admin Portals)

> ⬅️ Part of [Katalyst](./README.md) — Team 10, Mastercard Code for Change 3.0

> Consolidates the frontend-relevant parts of `Katalyst_Build_Spec_for_Claude_Code.md`,
> `KATALYST_BACKEND_MVP_HANDOFF.md`, and the visual/UX design brief (`Katalyst_Claude_Prompt.md`)
> into one spec scoped purely to the two Next.js portals. Backend data model/API implementation
> lives in `KATALYST_BACKEND_SPEC.md` (MongoDB); AI Judge/Coach internals live in
> `KATALYST_AI_SPEC.md`. This doc covers what the frontend renders, which API contracts it builds
> against, and the visual/design direction the whole product must follow.

---

## 1. Stack

- **Next.js (App Router), React, TypeScript, Tailwind CSS** — one framework for both portals. This
  is locked: an earlier design brief suggested Vite + React Router, but that predates the Next.js
  decision above and does not apply.
- Two portals, two role-gated route trees in the same app (or two apps sharing `backend/shared-types`
  + a `ui` component package) — whichever is faster to ship for the hackathon; role-gating happens
  at the route/middleware level, never trust a client-held role for access control (server
  re-checks every mutating call).
- Shared types come from `backend/shared-types` — never hand-duplicate API response shapes in
  frontend code.
- AI Coach is the **primary student surface** (chat), not a bolted-on widget.
- Use `shadcn/ui` for the base component layer (matches the design brief's component approach and
  is Tailwind-native).

---

## 2. Roles (locked for MVP)

Only two authenticated roles: **student** and **admin**. No Mentor portal, no Higher-Management
portal — do not build `/mentor/*` routes or a third nav tree. Mentors only ever appear as data
(name, organisation, expertise) inside meetings/activities managed by Admin.

---

## 3. Brand & visual direction

Product name **Katalyst** — used consistently everywhere (navbar, login, sidebar, favicon,
landing, mobile UI). Logo: a sophisticated K / pathway / upward-progress mark, not a literal
jungle icon and not a "gaming company" mark.

**Positioning**: a premium educational/productivity platform with *subtle* adventure-game
elements — Duolingo's progression mechanics + a restrained Temple-Run-jungle atmosphere + modern
SaaS product design. Professional first, gamified second, adventure-inspired third. The bar: it
should read as *"a polished learning platform that happens to be gamified,"* never as *"an
AI-generated gamification dashboard."*

**Do not**: use excessive gradients, huge glowing/neon elements, glassmorphism, floating blobs,
universally-rounded cards, generic purple/blue AI-dashboard aesthetics, cartoon characters/
illustrations, excessive animation, decorative-only elements, emoji overuse, heavy shadows, or
random icons. Do not make every section a card.

**Palette/texture** (used sparingly, mostly on the landing page, journey map, and achievement
visuals — the actual dashboard stays clean and professional): deep forest green, warm sand/stone
neutrals, muted gold, dark charcoal, small path/leaf/ruin motifs used as accents, not backgrounds.

**Visual system rules**: generous padding, clear hierarchy, subtle shadows, smooth borders,
premium typography, consistent corner radius, clear hover/active states, smooth transitions,
strong alignment. Mix flat sections, lightly-rounded cards, panels, progress components, and
timeline components — not one repeated card pattern everywhere.

**Microinteractions** — use for: XP increment, progress-bar fill, badge unlock, journey-map
navigation, hover/button feedback, level-up moment. Avoid: constant floating animation, particles,
background animation, flashing, or anything purely decorative.

**Responsiveness**: desktop/laptop/tablet/mobile, each with an intentional layout — not a shrunk
desktop view. The journey map (§7) becomes a clean vertical scroll on mobile; it does not lose the
milestone/status information, only the S-curve layout.

---

## 4. Landing page

A polished marketing page, separate from the authenticated app shell.

- **Hero**: Katalyst logo, headline (e.g. *"Turn your learning journey into progress you can
  see"*), short description, primary CTA **Get Started**, secondary CTA **Sign In**, a subtle
  path/journey visual (not a literal jungle scene).
- **What Katalyst does**: explain that it turns programme participation into a measurable journey
  — list the module types (training sessions, online courses, mentoring & coaching, projects,
  assignments, certifications, milestones) that map 1:1 to `modules.type` in the backend spec.
- **Gamified progress**: explain XP, levels, badges, streaks, milestones, leaderboards,
  achievements at a marketing level (no real numbers here).
- **Personalised learning**: show that Katalyst adapts to career interests, skills, academic
  performance, and progress — this is the marketing framing of the recommendation engine in
  `KATALYST_BACKEND_SPEC.md` §6.
- **Impact/stats strip**: elegant placeholder statistics (students engaged, activities completed,
  XP earned, skills developed) — clearly UI placeholders, never presented as real company figures.
- **How it works**: 3–4 steps — create your profile → choose your interests → complete learning
  activities → build your journey and earn XP.
- **Final CTA**: "Start Your Journey" → routes to signup.

Do not build this as a static screenshot — CTAs route into the real auth flow.

---

## 5. API contracts to build against (frozen — build against mocks if backend isn't ready)

These are the contracts the backend team commits to first, per `KATALYST_BACKEND_SPEC.md` §18.
Build UI against typed mocks of these shapes so frontend work isn't blocked by backend sequencing.

```
POST /me/onboarding
GET  /interests
GET  /me/interests
PUT  /me/interests
GET  /skills

GET  /me/dashboard
GET  /me/recommendations
GET  /me/journey

GET  /modules
GET  /modules/:id

GET  /me/meetings
GET  /me/meetings/:id/reschedule-slots
POST /me/meetings/:id/reschedule

GET  /me/notifications

GET  /reviews
PATCH /reviews/:id
```

Full contract list (auth, XP, coach, admin CRUD, etc.) is in `KATALYST_BACKEND_SPEC.md` §5 — treat
that as the API reference; this doc only calls out the shapes that directly drive layout below.

---

## 6. Student portal

### 6.1 Registration & onboarding (first-run flow)

A multi-step flow — never a single all-fields form. Four steps:

1. **Personal details**: full name, email, password, college/university name, date of birth.
2. **Career interests** — *"What kind of future are you building?"* Multi-select chips over the
   active interest catalogue (`GET /interests`) — don't hardcode the option list in the frontend.
   Chips need clear elegant selected/unselected states.
3. **Skills to improve** — multi-select chips over `GET /skills` (a lightweight seeded catalogue,
   same shape as interests — see `KATALYST_BACKEND_SPEC.md` §3.3b). Examples the catalogue seeds
   with: DSA, Programming, Web Development, Git & GitHub, Cloud, Databases, Communication,
   Leadership, Problem Solving, System Design, Project Management.
4. **Career goal** — select from a short suggested list or free-enter (e.g. "Software Engineer").
   This, plus academic field/programme year and the interest/skill selections, seeds the
   student's initial personalised path (§7).

```
Create account (name, email, password)
  -> Personal details (college, DOB)
  -> Career interests (chips, multi-select)
  -> Skills to improve (chips, multi-select)
  -> Career goal (select or free-enter)
  -> POST /me/onboarding
  -> Redirect to personalised dashboard
```

Interests, skills, and career goal must remain editable later from the **Student Profile** screen
(`GET/PUT /me/interests`; profile PATCH for skills/career goal). Don't let the UI assume a fixed
interest/skill list — always fetch the active catalogues.

### 6.2 Dashboard (home)

Single aggregate fetch — `GET /me/dashboard` — renders:
- Header: Katalyst logo, search, notifications, student profile, current level, XP.
- Welcome section with a personal greeting and a journey-progress line, e.g. *"Good morning,
  Ananya — you're 72% through your current learning journey,"* followed by one concrete recommended
  next action (not a generic prompt).
- Gamification strip: total XP, level + level name, XP-to-next-level, weekly streak, leaderboard
  rank, overall completion %.
- "Next best action" card.
- Recommended-for-you rail (from the same payload's `recommendations`, or a follow-up call to
  `GET /me/recommendations` for the full list).
- Upcoming deadlines, upcoming meetings, active projects.
- Recent achievements (badges), recent activity feed.

Do not implement recommendation *ranking* logic client-side — the backend returns a pre-ranked
list with a `recommendation_reason` string per item; just render it.

### 6.3 Explore / Catalog
`GET /modules?status=published&domain=&type=` — filterable by interest domain and module type.
Each module renders from the **module card contract**:
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
Show `recommendation.reason` as a small badge/tooltip when `is_recommended` is true — this is the
main way students see *why* something is surfaced, so don't drop it in the card design.

Enroll (`POST /enrollments`) and submit (`POST /submissions` — file/link/text artifact types) flows
live here and on the module detail page (`GET /modules/:id`).

### 6.4 My Enrollments / Journey
`GET /me/enrollments` — status pipeline visualization (`enrolled → in_progress → submitted →
under_review → completed`/`overdue`). Submitted work should visibly transition in near-real-time
once Admin/AI Judge acts (poll or re-fetch on focus is fine for a hackathon build — no websockets
required).

### 6.5 XP / Level / Achievements
`GET /me/xp` — ledger summary, level, streaks, badges. Show the weekly streak as **weekly, not
daily** — this is a deliberate backend design choice (`KATALYST_BACKEND_SPEC.md` §11), so build a
compact "N-week streak" indicator, not a daily calendar heatmap.

**Achievement catalogue** (seeded badges — see `KATALYST_AI_SPEC.md` §2 badge rules for how these
evaluate): First Steps (complete your first activity), Momentum (5 activities in a week),
Problem Solver (20 coding challenges), Consistent Learner (streak milestone), Explorer (activities
across 5 skill categories), Project Builder (submit your first project). Render badges as elegant
geometric/emblem-style marks — never cartoon icons.

### 6.6 Leaderboard
`GET /leaderboard?scope=individual|team&window=week|month|year&cohort=` — frame competition
positively; never publicly rank or label anyone as "weakest" (this also applies to any peer-squad
UI, §6.11). Top 3 get a distinct, non-cartoon gold/silver/bronze treatment (real trophy/emblem
graphics, not emoji). Filters: Overall, This Week, This Month, My College, My Team. Always
highlight the current student's own row even if scrolled off the visible top ranks.

### 6.7 Learning Journey Map (signature feature)

`GET /me/journey` — a large, Katalyst-specific S-shaped vertical progression map (Duolingo-style
progression mechanics, not a visual copy of Duolingo or Temple Run). Built from the student's
`enrollments` + `recommendations` + module sequence for their chosen career goal/interests, ordered
into a linear path of milestones.

Each node in the response:
```json
{
  "id": "...", "title": "DSA Foundations", "category": "technology",
  "status": "completed | current | locked | upcoming",
  "xp_reward": 40, "badge": {"code":"problem_solver"} | null,
  "estimated_minutes": 60, "unlock_requirement": "Complete Programming Foundations" | null,
  "module_id": "..." | null
}
```
Node states:
- **Completed** — clear completion mark, XP earned, badge if any.
- **Current** — tasteful emphasis, a "Continue" CTA into the linked module/enrollment.
- **Locked** — muted, shows `unlock_requirement` in plain language.

The map is a *rendering* of already-personalised backend data (§7 of the backend spec's
recommendation engine + the student's enrollment history) — the frontend does not invent sequencing.
On mobile this collapses to a clean vertical timeline; it keeps every node's status/XP/category, it
just drops the S-curve.

### 6.8 Personalised path ("Your Path")
A focused view distinct from the full journey map: a short, explicitly-labeled recommended
sequence (e.g. Programming Foundations → Git & GitHub → DSA Foundations → ... → build a full-stack
project) generated from the student's career goal + interests + progress, sourced from
`GET /me/recommendations`. Always show the reason inline, e.g. *"Recommended for you because you're
interested in Software Engineering and currently developing your DSA skills."* Different students
with different career goals (e.g. Data Science → Python/Statistics/SQL/ML) see visibly different
paths — the personalisation must be obvious, not subtle.

### 6.9 Academic & skill performance
A dedicated dashboard section (not scattered across the app) showing academic performance, skill
progress (e.g. DSA 72%, Programming 84%, Cloud 41%, Git & GitHub 68%), completed activities,
strengths, and areas for improvement. Use charts sparingly — only where they add information, never
as page filler.

### 6.10 Meetings & flexible rescheduling
`GET /me/meetings` — renders from the **meeting response contract**:
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
Student is otherwise read-only here — no create/edit affordance (Admin manages meetings, §7.4) —
**except** rescheduling when `reschedulable: true` and the current time is before
`reschedule_deadline` (one day before the session, per `KATALYST_BACKEND_SPEC.md` §8b). When
eligible, show *"Need a different time?"*, fetch open slots via
`GET /me/meetings/:id/reschedule-slots`, and let the student pick one
(`POST /me/meetings/:id/reschedule`). Clearly display: current session time, the deadline, the
available slots, and the newly-selected slot once confirmed. After the deadline, hide the
reschedule affordance entirely rather than showing a disabled button with no explanation.

### 6.11 Notifications
`GET /me/notifications`, `PATCH /me/notifications/:id/read` — in-app feed, object shape:
```json
{
  "id": "uuid", "type": "meeting_rescheduled", "title": "Mentor session rescheduled",
  "message": "Your Career Readiness session is now on 24 Aug at 3:00 PM.",
  "entity_type": "meeting", "entity_id": "uuid", "read": false, "created_at": "2026-08-21T10:00:00Z"
}
```
Also give students a **Notification Preferences** screen
(`GET/PUT /me/notification-preferences`: `email_notifications_enabled`,
`meeting_update_emails`, `course_recommendation_emails`) — meeting-cancellation/reschedule stays
important even if recommendation emails are off, so don't let one toggle silence both.

### 6.12 AI Coach (chat — primary surface)
`POST /coach/message`. Persistent chat UI, not a modal. The Coach:
- Always answers progress questions from live tool calls — the UI should never need to
  client-side-compute XP/rank/streak; trust what the Coach returns.
- Handles both progress questions ("what's my rank?") and content questions ("I don't understand
  quadratic equations") in the same thread — content answers should visibly cite their source
  (e.g. "from your Grade 10 Algebra notes") so render that citation, don't strip it.
- Proactively delivers feedback and nudges as Coach-initiated messages in the same thread (not
  separate toast/email-only) — design the chat to support system-initiated messages, not just
  student-initiated ones. Keep this integrated into the journey, not a giant ChatGPT-style
  centerpiece — the Coach is a companion to the core learning loop, not the product.
- Can propose accepting a mission or joining a peer study squad inline — render these as actionable
  cards inside the chat (accept/decline), not free text the student has to interpret.
- Insight cards (e.g. *"You've made strong progress in programming. Your DSA accuracy is
  improving, but Trees & Graphs remain a weak area. Consider the next two challenges"*) render as
  a distinct, professional card style — not a chat bubble wall.

### 6.13 Peer study squads (if time allows — post-MVP but fully specified)
`GET /me/squads`, `POST /squads/:id/join`, `POST /squads/:id/leave`,
`GET/POST /squads/:id/messages`, `POST /squads/:id/endorsements`. Framing matters: show *why* a
student was matched ("you're strong in X, this group needs it; you're matched with someone strong
in your gap area Y") — never a raw weakness callout. Endorsements are positive-only, required
comment field, feed an XP bonus automatically for small capped amounts.

### 6.14 Missions / Badges
Rendered from Coach tool output (`get_available_missions`) and `GET /me/xp`'s badge list — treat as
gamification chrome, secondary to the core learning loop.

### 6.15 Teams
Students on a team can see team name, members, team XP, team progress, and team ranking. Team
activities contribute to team XP while individual contribution is still tracked separately (see
`individual_contribution_xp` in `KATALYST_BACKEND_SPEC.md` §11).

### 6.16 Student navigation
Home · My Journey · Activities · Leaderboard · Achievements · Teams · Profile. Do not overcrowd the
sidebar with more than these seven items for the MVP.

---

## 7. Admin portal

### 7.1 Module & rubric management
`POST/PATCH /modules`, `POST /rubrics`. Form must capture: type, title, description, mode
(mandatory/optional/certificate), due date, XP weight, is-team-based, rubric selection, **and the
MVP additions**: summary, difficulty, estimated minutes, thumbnail, and **domain tags**
(many-to-many against the interest catalogue with a relevance weight) plus optional skill tags.
Publish/archive is a status transition (`draft → published → archived`) — publishing is the trigger
for the module-published notification flow (§7.6), so make the publish action explicit and
confirmable, not silent.

### 7.2 Review queue (AI Judge oversight)
`GET /reviews?status=pending_review&cohort=&module_type=`. This is the most detail-sensitive screen
in the whole app:
- Render **level-pickers per criterion** (`not_demonstrated / developing / proficient /
  excellent`) — never a free numeric input. This mirrors the AI Judge's own output schema exactly.
- Show the AI Judge's draft levels + `justification` text per criterion, plus `confidence` and any
  `flags` (e.g. `attendance_only_no_learning_action`, `possible_plagiarism`).
- For mentoring-type reviews, always show a **mentor confirmation** control (confirmed/not,
  optional notes) — there's no Mentor portal, so Admin is entering this on the mentor's behalf; the
  `action_item_completion` criterion cannot be approved without it.
- `PATCH /reviews/:id` submits final levels + status; XP is always server-computed from whatever
  levels Admin confirms — the UI should show a computed XP preview but never let Admin type a raw
  XP number directly into the ledger.
- A separate, clearly-labeled **bonus award** action (`meaningful_revision`,
  `team_mission_help`, `weekly_consistency`, `exceptional_improvement`,
  `early_completion_quality`) — always human-initiated, never a default/auto-suggested checkbox
  that's pre-checked.

### 7.3 Team-contribution XP entry
For `team_contribution` modules, Admin must enter `individual_contribution_xp` (0–30) **explicitly
per member** — the UI must force one input per team member with no "apply to all"/equal-split
shortcut, per the design team's rule that identical XP must never be auto-applied across a team.

### 7.4 Meetings
`GET/POST /admin/meetings`, `PATCH /admin/meetings/:id`. Fields: mentor (record picker, not a
user picker — mentors aren't authenticated users), title, description, start/end time, mode
(online/offline/hybrid), link/location, participant students, status, and whether the meeting is
**reschedulable by students** plus its candidate reschedule slots (used by §6.10). Editing a
"material" field (time, mode, link, location, status) should visibly warn Admin that it triggers a
student notification — this isn't a silent save.

### 7.5 Student & cohort management
Manage students (view, cohort/batch assignment), manage mentor **records** (name, email,
organisation, expertise — not login credentials, they're not app users).

### 7.6 Partner organisations
`GET/POST/PATCH /admin/partners` — simple CRUD (name, description, logo, contact, website,
active). Optional linkage to interest domains and to specific modules.

### 7.7 Reporting & analytics
`GET /reports?filters...` — filterable by cohort/module-type/date at minimum. Also: AI Judge
auto-approval rate, override rate, review turnaround time — surfaced as an admin dashboard, not
just a raw export.

### 7.8 Engagement-health / escalation view
Read-model driven (never a stored "penalty"): days-since-last-activity, overdue mandatory count,
consecutive missed sessions, declining completion trend, mentoring inactivity, etc. Frame this
screen as "students who may need outreach," not a leaderboard-of-shame — this data never affects a
student's own visible XP/rank.

### 7.9 Notification rules
`POST/PATCH /notification-rules` — admin-tunable trigger/audience/channel/template config, so
thresholds can change without a redeploy.

### 7.10 Peer-squad health (if built)
`GET /admin/squads?status=&cohort=` — squad formation/active/stalled/disbanded counts and the
"squad effectiveness rate" metric, reusing the reporting patterns from §7.7.

### 7.11 Admin navigation
Overview · Students · Modules · Submissions · Analytics · Teams · Reports.

---

## 8. Cross-cutting UI rules

- **RBAC UI must mirror backend RBAC** — hide (don't just disable) admin-only actions from
  students, but never rely on hiding alone; every mutating call is re-checked server-side.
- **Never invent numbers.** XP, rank, streak, recommendation scores always come from an API
  response — no client-side recomputation of anything gamification-related.
- **Constructive framing everywhere gamification touches social comparison** (leaderboard, peer
  squads, engagement-health) — no public shaming, no "weakest" labels.
- **Two roles only** — don't scaffold nav items, routes, or permission checks for `mentor` or
  `higher_management`; those are explicitly out of scope for this MVP.
- **Async status is normal** — submission review is not instant; design status chips/timelines
  (`pending_scoring → pending_review/auto_approved → approved`) rather than assuming a synchronous
  result.
- **XP is not the whole product.** Every gamification element (journey map, badges, streaks,
  leaderboard) should visibly connect back to a real learning action — never present XP as an end
  in itself.

---

## 9. Build order (frontend, mirrors backend phases in `KATALYST_BACKEND_SPEC.md` §16)

1. **Auth + onboarding** — register/login, the 4-step onboarding flow (§6.1), editable profile.
2. **Core loop** — Admin module create/publish form; Student catalog + enroll + submit.
3. **Notifications** — in-app feed + preferences screen (email delivery is backend-only, but the
   UI must expose the opt-in/opt-out controls).
4. **Review queue** — Admin level-picker screen (§7.2) — this is the highest-craft screen in the
   MVP; budget real design time here.
5. **Student dashboard + Learning Journey Map** — aggregate view, recommendations rail,
   leaderboard, XP/badges, and the S-shaped journey map (§6.7) — the map is the signature visual
   feature and should get real design time, second only to the review queue.
6. **AI Coach chat** — persistent thread, actionable cards for missions/squads, source citations
   for content answers.
7. **Meeting rescheduling** — student-facing slot picker (§6.10) + admin reschedule-slot config
   (§7.4).
8. **Landing page** — marketing site (§4); can be built in parallel once the brand direction (§3)
   is settled, does not block the authenticated app.
9. **Post-MVP, if time remains** — peer squads UI, partner org management, escalation dashboard,
   reporting polish.
