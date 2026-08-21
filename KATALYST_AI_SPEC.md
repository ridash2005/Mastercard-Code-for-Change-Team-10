# Katalyst — AI Integration Spec (AI Judge, AI Coach, RAG, Peer Matching)

> Consolidates the AI-relevant sections of `Katalyst_Build_Spec_for_Claude_Code.md` (§4, §5, §11,
> §12, §14, §15), the personalisation additions from `KATALYST_BACKEND_MVP_HANDOFF.md` (§18), and
> the career-goal/skills personalisation fields from the visual/UX design brief
> (`Katalyst_Claude_Prompt.md`) into one spec for everything living under **`/ai`** in the repo —
> kept separate from `KATALYST_BACKEND_SPEC.md` so the AI implementation can be built/iterated
> independently of the persistence/API layer. The backend calls into these packages as libraries;
> it does not reimplement prompting, scoring schemas, or tool-calling logic.

## Repo layout (current)

```
/ai
  ai-client/    provider abstraction (Groq primary, Gemini fallback) — built, tested
  ai-judge/     rubric scoring schema, deterministic XP calc, routing logic — built, tested
  ai-coach/     tool-calling coach, system prompt, fixtures — built, tested
  python/       peer-matching engine, golden-set/RAG eval harness, squad effectiveness — built, tested
```
Data layer: **MongoDB Atlas**, including **Atlas Vector Search** for RAG (no separate vector DB —
see `KATALYST_BACKEND_SPEC.md` §3.23 for the `knowledge_documents`/`knowledge_chunks` schema).

---

## 1. Free-tier LLM stack (no paid API required)

**Current implementation**: `ai/ai-client`'s only concrete `LlmClient` is `GeminiClient` (Google
Gemini API free tier, model `gemini-3.6-flash`, `@google/generative-ai`), gated on `GEMINI_API_KEY`.
There is no Groq client in the codebase today — an earlier draft of this spec planned Groq as the
primary provider with Gemini as fallback, but the build settled on Gemini-only. `LlmClient` is
still a real interface (`generateJson`/`chatWithTools`), so adding a Groq (or any other) provider
later is additive, not a rewrite — see `StaticLlmClient`/`MockLlmClient` in `ai/ai-client/src/index.ts`
for the fixture/mock implementations already used in tests and dry-run mode.

| Need | Provider | Notes |
|---|---|---|
| AI Judge + AI Coach LLM | **Google Gemini API** free tier (`gemini-3.6-flash`) | JSON mode (`responseMimeType: "application/json"`) plus a provider-side `responseSchema` constraint (see below) and native tool-calling |
| Content moderation (peer chat) | Same Gemini free call as a classifier | No dedicated moderation API needed |

No `GROQ_API_KEY` or `ANTHROPIC_API_KEY` is required for this build; only `GEMINI_API_KEY` (see
`backend/api/.env.example`). `ai/ai-client`'s `generateJson()` also accepts an optional
`responseSchema` (Gemini's OpenAPI-subset `GenerationConfig.responseSchema`) that constrains the
model to the exact JSON shape instead of relying solely on prose instructions in the prompt — both
`ai-judge` (`buildAiJudgeResponseSchema`) and the backend's Coach/Judge guardrail services
(`backend/api/services/ai/schemas.js`) pass one; the Zod/hand-rolled `schema` validator still runs
as the final safety net either way.

---

## 2. AI Judge

### 2.1 Trigger
Backend enqueues a `score-submission` job on `submissions` insert (or `attendance_sync` webhook
for session attendance) with `submission_id`. The job handler (backend-owned) loads
submission → enrollment → module → rubric (+ `rubric_role_criteria` for team projects) and calls
`@katalyst/ai-judge`.

### 2.2 Output schema — level-based, never a free numeric score
```json
{
  "criteria_levels": [
    { "criterion_key": "string (must match a criterion key in the rubric)",
      "level_key": "not_demonstrated | developing | proficient | excellent",
      "justification": "string (evidence-based, cites what was/wasn't present)" }
  ],
  "confidence": "number (0-1)",
  "flags": ["possible_plagiarism"|"incomplete"|"off_topic"|"late_submission"|"attendance_only_no_learning_action"|"none"],
  "suggested_bonus": "meaningful_revision|team_mission_help|weekly_consistency|exceptional_improvement|early_completion_quality|none",
  "student_feedback": "string (warm, specific, references rubric criteria, 3-5 sentences)"
}
```
`suggested_bonus` is advisory only — the AI Judge never writes a `bonus_awards` document; a human
(Admin) must confirm it.

Validation: every `criterion_key` must exist in the rubric, every `level_key` must be one of the 4
seeded `performance_levels`. Reject/retry once on malformed/unknown-key output; on second failure,
route straight to `pending_review` with `flags: ["ai_parse_error"]`.

### 2.3 Deterministic XP (service layer, never the model)
```
for each criteria_level:
  earned_pct = criterion.weight_pct * performance_levels[level_key].percentage / 100
total_earned_pct = sum(earned_pct across all criteria)
xp_awarded = round(total_earned_pct / 100 * module.xp_weight)
```
Worked example (Assignment): Completion 25%×100%=25.0, Quality 30%×75%=22.5, Application
25%×75%=18.75, Originality 10%×50%=5.0, Timeliness 10%×100%=10.0 → **81.25%** →
`xp = 0.8125 × module.xp_weight`. This is implemented as a pure, independently unit-tested function
in `ai/ai-judge/src/xp.ts` — the backend must call it rather than trusting any number from the LLM.

### 2.4 Routing logic
```
if module.type == 'online_course' and evidence is purely auto-graded
   (completion+quiz signals only, no open-ended reflection text):
    status = 'auto_approved'   # no LLM call needed for pure system-of-record signals

elif module.type == 'training_session':
    # attendance alone is NEVER auto-approved for full XP — it's only 40% of the rubric
    if attendance == true and no other learning-action evidence submitted:
        status = 'pending_review'
        flags += ['attendance_only_no_learning_action']
    elif confidence >= rubric.confidence_threshold and no blocking flag:
        status = 'auto_approved'
    else:
        status = 'pending_review'

elif module.type == 'mentoring':
    # MVP: no Mentor portal — action_item_completion can never be scored by the AI Judge from
    # submitted text alone. It always requires an Admin-recorded mentor confirmation
    # (reviews.mentorConfirmation, see backend spec §3.11) before that criterion counts.
    status = 'pending_review'   # at minimum for that criterion's confirmation

elif confidence >= rubric.confidence_threshold and no blocking flag:
    status = 'auto_approved'
else:
    status = 'pending_review'
```
`auto_approved` → backend immediately inserts `xp_ledger`, sets `enrollments.status='completed'`,
notifies the Coach to deliver feedback. `pending_review` → appears in Admin's review queue with the
AI draft pre-filled; Admin's edit always triggers server-side XP recompute from whatever levels are
finally confirmed.

### 2.5 Team project & team-contribution roll-up
- **`project` (team variant)**: each `team_role` submission scored independently against its
  `rubric_role_criteria` slice. Once all required roles have an approved review, a final
  integration review scores "Collaboration" against the merged deliverable.
- **`team_contribution` module type**:
  ```
  final_team_xp_for_member = team_outcome_xp + individual_contribution_xp
  ```
  `team_outcome_xp` — same value for every member, computed level-based from the shared rubric.
  `individual_contribution_xp` — **0–30 XP**, Admin-assigned per member, **never auto-computed or
  equal-split**. Two `xp_ledger` entries are written per member (`reason: 'team_outcome'` and
  `reason: 'individual_contribution'`), shown to the student as one combined total.

### 2.6 Calibration/monitoring
Nightly job samples 10% of `auto_approved` reviews from the prior 24h, creates a `pending_review`
shadow-copy for Admin to blind-score, logs agreement for an `ai_judge_override_rate` metric.

### 2.7 Rubric weight tables (source of truth — see `ai/ai-judge/src/rubrics.ts`)

| Module type | Example max XP | Criteria (key: weight) |
|---|---|---|
| Training session | 40 | attendance 40%, participation 25%, quiz_activity 25%, reflection_feedback 10% |
| Online course | 100 | course_completion 35%, assessment_score 30%, certificate_evidence 15%, learning_reflection 10%, timeliness 10% |
| Assignment | 100 | requirement_completion 25%, quality_accuracy 30%, application_of_learning 25%, originality_problem_solving 10%, timeliness 10% |
| Mentoring/coaching | 60 | session_attendance 20%, preparation 15%, participation 20%, action_item_completion 30% (Admin-confirmed, §2.4), reflection_progress_update 15% |
| Project (indiv/team) | 200 | problem_understanding 15%, quality_of_solution 25%, practical_implementation 20%, documentation_presentation 10%, milestone_completion 15%, collaboration/individual_initiative 15% |
| Team contribution | 100 | assigned_responsibility_completed 35%, quality_of_contribution 25%, collaboration_communication 20%, timeliness 10%, peer_mentor_acknowledgment 10% |
| Certificate course | 120 | valid_certificate 30%, course_completion 20%, assessment_score 25%, relevance_to_pathway 10%, reflection_application 15% |
| Optional activity | capped 150/mo | verified_completion 30%, relevance 20%, quality 20%, application 20%, reflection 10% |

Performance levels (every criterion, every module type): `not_demonstrated`=0%,
`developing`=50%, `proficient`=75%, `excellent`=100%.

Bonus variables (always human/Admin-authorized, used sparingly): `meaningful_revision` +5–10,
`team_mission_help` +5, `weekly_consistency` +5, `exceptional_improvement` +10,
`early_completion_quality` +5 (never if quality criteria scored `developing` or below).

---

## 3. AI Coach

### 3.1 Interaction model
Tool-calling LLM call (Groq/Gemini) — the Coach is given read-only tools (+ one narrow write tool)
so it always answers from live data and never invents progress numbers. Tool *definitions* and the
tool-calling loop live in `ai/ai-coach`; tool *execution* (the actual DB reads/writes) is wired to
backend repository functions — `/ai` never talks to MongoDB directly.

**Tools:**
- `get_student_progress(user_id)` → XP total, level, streaks, active enrollments, days-to-due list
- `get_leaderboard(user_id, scope, window)` → rank + neighbors
- `get_recent_reviews(user_id, limit)` → recently approved feedback not yet delivered
- `get_available_missions(user_id)` → open missions matching gaps
- `accept_mission(user_id, mission_id)` → the one write tool, inserts `mission_progress`
- `get_module_catalog(filter)` → "what's due / what's this worth"
- `search_knowledge_base(query, filters)` → RAG lookup (§4), filtered by grade/subject/chapter/topic
- `get_topic_performance(user_id, subject?)` → reads `student_topic_performance` (Mongo, never the
  vector-search collection) to ground personalized explanations
- `get_student_preferences(user_id)` → **new, MVP personalisation** — returns
  `{academic_field, programme_year, career_goal, interests[], skills[]}` from `student_profiles`
  (`career_goal`/`skills[]` per `KATALYST_BACKEND_SPEC.md` §3.2/§3.3b — the same fields onboarding
  step 3–4 collects, frontend spec §6.1) — lets the Coach frame suggestions against what the
  student is actually working toward, not just their interest tags
- `get_personalised_recommendations(user_id)` → **new, MVP personalisation** — calls the backend's
  `/me/recommendations` logic; Coach must use these results rather than inventing course
  IDs/titles

### 3.2 System prompt (fixed, `ai/ai-coach/src/systemPrompt.ts`)
Persona: warm, encouraging, concise, never shaming. Must always call `get_student_progress` before
making any claim about the student's status. Forbidden from inventing XP numbers. Frames
competition positively; keeps team-inactivity nudges private. For content questions: always call
`search_knowledge_base` and ground the answer in retrieved, mentor-approved material rather than
general knowledge, citing the source document type (e.g. "from your Grade 10 Algebra notes").

The prompt must also incorporate the student's **interests, academic field, programme year,
recommended modules, recent activity, progress, deadlines, meetings, review feedback, and XP/
level/streak** (per the MVP personalisation delta) — sourced via `get_student_preferences` and
`get_personalised_recommendations`, never hardcoded or guessed.

### 3.3 Scheduled nudge job
Two distinct trigger families (engagement-health signals must never reduce XP, only trigger
support):

- **Participation/motivation nudges** (`inactivity`, `due_soon`, `streak_risk`, `rank_drop`) —
  light, gamified, sent directly to the student by the Coach.
- **Engagement-health signals** (`days_since_last_activity`, `overdue_mandatory_count`,
  `consecutive_missed_sessions`, `unread_feedback`, `submission_awaiting_revision`,
  `upcoming_deadline_load`, `declining_completion_trend`, `mentoring_inactivity`) — computed
  nightly per student from live read-model queries (no penalty table). On threshold crossing: (1)
  student still gets a supportive, non-judgmental Coach nudge (never phrased as a warning), (2)
  Admin-audience notification rules fire so a human can proactively reach out.

Daily cron per active student evaluates both families; for any rule that fires, draft a
natural-language nudge (same system prompt + a "proactive nudge" instruction + trigger context),
deliver via `in_app` (Coach-initiated message) and, per rule config, also `email`; log to
`notification_log`.

### 3.4 Feedback delivery
When a `review` transitions to `approved`/`auto_approved`, the Coach proactively messages the
student with a natural-language rendering of `feedback_text` — same underlying content, friendlier
delivery, never a raw score dump.

---

## 4. Mentor-ingested knowledge base & RAG

Extends the Coach to answer *content* questions ("I don't understand quadratic equations") using
mentor-approved material, personalized against the student's actual weak topics.

### 4.1 Data intake (5 categories, from content owners)
1. Curriculum — syllabus, subjects, chapters, learning objectives
2. Learning content — notes, PDFs, worksheets, study material
3. Assessments — tests, question papers, answer keys, rubrics
4. Personalization data — student scores/topic performance/attempts → **maps to
   `student_topic_performance` in Mongo, never ingested into the knowledge base**
5. Teacher/mentor knowledge — FAQs, common mistakes, improvement strategies

Also collect 20–100 real student questions with mentor-approved answers up front → `rag_eval_set`
(10–15 pairs is enough for a hackathon demo).

### 4.2 Data separation — hard rule
| Goes into Atlas Vector Search | Goes into MongoDB (regular collections) |
|---|---|
| Curriculum, notes, worksheets | Student profile, scores, attempts |
| FAQs, mentor-approved explanations | `student_topic_performance` |
| Remedial material | Progress, previous recommendations |

Never embed/index individual student performance data — it is only ever passed to the LLM as
retrieved context from a Mongo query at answer time.

### 4.3 Ingestion pipeline
```
Mentor/Admin uploads doc (PDF/DOCX, stored to object storage, knowledge_documents row, status='uploaded')
  -> Parse (extract text; status='parsing')
  -> Clean + de-duplicate
  -> Structure-aware chunking (respect headings/sections, not fixed-size blind chunking)
  -> Attach metadata to every chunk: {grade, subject, chapter, topic, document_type, source, version, language}
  -> Generate embeddings -> write to knowledge_chunks with Atlas Vector Search index (status='embedded')
  -> On failure at any stage: status='failed', surfaced in admin UI for re-upload/retry
```
Async job triggered on `knowledge_documents` insert, mirroring the AI Judge's pattern — uploads
must never block the admin UI.

### 4.4 RAG query pipeline (`search_knowledge_base` tool)
```
Student question
  -> resolve grade/cohort context
  -> get_topic_performance(user_id) from Mongo (weak topics, accuracy %)
  -> $vectorSearch filtered by grade/subject (+ topic if inferable)
  -> rerank/filter top results for relevance
  -> LLM call: question + retrieved mentor-approved material + student's topic-performance context
  -> response: grounded explanation + a personalized suggestion tied to the student's actual gap
```
Example: a Grade 10 student asking about quadratic equations, with 42% algebra accuracy and
"quadratic equations" flagged weak, retrieves Grade 10 Algebra material and produces an explanation
plus targeted exercises — not a generic textbook answer.

### 4.5 Coach integration
`search_knowledge_base` is called whenever the system prompt classifies the incoming message as a
content/learning question rather than a progress/XP question. The Coach must cite that its answer
comes from programme material.

### 4.6 Evaluation before scaling
Run `rag_eval_set` through the pipeline and score: retrieval accuracy, answer correctness,
hallucination rate, personalization quality (does it actually use topic-performance context),
alignment with `teacher_knowledge`-sourced material. Shares infrastructure with the AI Judge
golden-set harness — both live under `ai/python/eval_harness.py`.

---

## 5. Peer collaboration & complementary-skill matching

Turns each student's measured strengths/weaknesses (`student_topic_performance`) into constructive
peer pairings — implemented in `ai/python/matching.py`.

### 5.1 Design principles
Reciprocity, not charity — a match is proposed only if mutually beneficial. Constructive framing
only — no public "weakest student" labeling; students only see "you're strong in X, this group
needs it" / "this group has Y, matching your growth area." Opt-in and gamified — joining a squad
earns XP (`team_mission_help` bonus). Safety — lightweight AI moderation on squad chat (§5.4).

### 5.2 Matching algorithm (`match-study-squads` job)
1. **Skill graph**: per active student, `student_topic_performance` topics with `accuracy_pct>=75`
   and `trend in (stable, improving)` are strengths; `accuracy_pct<50` or `trend=declining` are
   gaps.
2. **Reciprocity score** for pair (A, B), same cohort:
   ```
   reciprocity(A, B) = |{topics where A strong AND B gap}| + |{topics where B strong AND A gap}|
   ```
   `reciprocity = 0` pairs are fallback-only, used when no reciprocal match exists for a student
   who explicitly requested help.
3. **Group formation**: greedily grow reciprocal pairs into 3–4 person squads via a simple weighted
   set-cover heuristic (plain TS/Python, no external optimizer needed at cohort scale).
4. **Cap and diversify**: no student in more than one active squad at a time; mix cohort/role where
   possible.
5. Insert `study_squads` (`status='proposed'`) + `squad_members` with each member's matched
   strength/gap topic recorded for transparency; log one `squad_match_runs` row.
6. Coach proactively messages each proposed member with the match rationale; squad activates
   (`status='active'`) once a quorum (2+) accepts.

### 5.3 Net-positive metric
Track `avg_reciprocity_score` per run and, per squad, whether **both** directions of the intended
skill exchange show measurable movement — each member's `matched_gap_topic.accuracy_pct` trending
`improving` within 2–4 weeks. Computed in `ai/python/squad_effectiveness.py`. Surfaced to Admin as
"squad effectiveness rate."

### 5.4 Moderation
Every `squad_messages` insert runs (async, non-blocking) through a single free LLM classification
call: *"Classify this peer-study message as constructive/neutral, off-topic, or toxic/harassing.
Return only the label."* `toxic` flags surface for Admin review; above a per-student threshold,
temporarily suspend that student's squad messaging only — never their XP/enrollment access (same
"trigger support, never punish progress" philosophy as engagement-health signals, §3.3).

---

## 6. Testing / eval strategy for `/ai`

- **Contract tests**: AI Judge output schema validation against fixtures — reject malformed LLM
  output deterministically (`ai/ai-judge/test`, already implemented, no live API needed).
- **Golden-set eval**: ~30–50 real/sample submissions per module type with human-assigned "true"
  scores, run against the current rubric/prompt to catch scoring drift
  (`ai/python/eval_harness.py`).
- **RAG eval**: `rag_eval_set` scored for retrieval accuracy, answer correctness, hallucination
  rate, personalization quality (§4.6).
- **Coach tool-forcing tests**: verify the Coach never answers a progress question without first
  calling `get_student_progress`, and never fabricates a course/XP number (fixture-based, see
  `ai/ai-coach/test`).
- **Matching/effectiveness tests**: `ai/python/tests/test_matching.py`,
  `test_squad_effectiveness.py` (already implemented).

---

## 7. Build order (AI-side, relative to backend phases)

Maps to `KATALYST_BACKEND_SPEC.md` §16:

1. *(done)* `ai-client` provider abstraction, `ai-judge` schema/routing/XP calc, `ai-coach`
   tool-calling skeleton, `python` matching + eval harnesses — all built and unit-tested in
   isolation.
2. **Wire AI Judge** to the backend's real submission-created trigger (backend Phase 4) — replace
   fixture client with the live Groq/Gemini client from `ai-client`.
3. **Wire AI Coach** to `/coach/message` (backend Phase 6) — implement the tool-executor functions
   in the backend that `ai-coach`'s tool-calling loop invokes, including the two new
   personalisation tools (`get_student_preferences`, `get_personalised_recommendations`).
4. **RAG pipeline** — ingestion job + Atlas Vector Search index + `search_knowledge_base` wiring
   (post-MVP per the original spec, but fully specified here so it can be built immediately after
   the MVP without further design input).
5. **Peer matching** — expose `match-study-squads` as a callable job (a manual "run matching"
   button in the admin UI is fine for a demo; cron optional if time-boxed).
