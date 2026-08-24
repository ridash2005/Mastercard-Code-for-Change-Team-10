# Katalyst — Gamified Learning & Student Engagement

Hackathon build for **Mastercard Code for Change**. Two portals (student and admin), real product
flow from activity creation through XP. Most of the platform runs on **mock services** (an
in-memory Zustand store) — the one path wired to a real backend and a real AI provider is the
**AI Coach chat**, described below.

## Run the product UI only (mock services, no backend needed)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (no passwords):

- Student: `ananya@katalyst.edu`
- Admin: `priya.admin@katalyst.edu`

## Run with the real AI Coach

The AI Coach page (`/student/ai-coach`) calls a real backend and a real LLM instead of a canned
reply. To enable it, also run the backend:

```bash
npm run dev:backend   # starts backend/api on :5000 - needs a reachable MONGO_URI
npm run dev           # starts the frontend on :3000, in another terminal
npm run seed --workspace @katalyst/backend-api   # first run only: seeds demo accounts
```

The AI Coach needs a real, working login, and every authenticated `backend/api` request re-checks
the caller against MongoDB (see `middleware/authMiddleware.js`) — so **MongoDB is required for a
live Coach reply**, not optional. Without it (or without `backend/api` running at all, or without a
`GEMINI_API_KEY` set there), the Coach page falls back to a local mock reply automatically — nothing
breaks, it just isn't live. `backend/api` itself fails fast (503, not a hang) on any DB-dependent
route when Mongo is unreachable, via `middleware/dbMiddleware.js`; only `/api/health` works without
a database. See `backend/api/.env.example` for the backend's own env vars, and root `.env.example`
for the frontend's bridge config (`BACKEND_API_URL`, `BACKEND_DEMO_PASSWORD` — must match the
password `backend/api`'s seed script hashes for the demo accounts).

## Monorepo layout

- `frontend/` — the Next.js app (student + admin portals, App Router, TypeScript, Tailwind,
  shadcn-style UI). Run it via the root scripts above, or `cd frontend && npm run dev` directly.
- `backend/api` — the real backend: Express + MongoDB (auth, users, activities, submissions,
  meetings, gamification, teams, notifications, etc.), and the **only** path into `/ai` — see
  `backend/api/services/ai/` for the guardrail + auth layer in front of the AI gateway
  (`POST /api/ai/coach/message`, `POST /api/ai/judge/score-submission`).
- `backend/shared-types` — TS types shared between the `/ai` packages.
- `ai/` — AI client (Gemini), AI Judge, AI Coach prompt/schema, and the Python matching/eval
  packages. Fully unit-tested in isolation (`npm test` at the root, `pytest` in `ai/python`).
  `backend/api` imports the compiled `ai/ai-client` package directly (not over HTTP) — run
  `npm run build:ai` after changing anything under `ai/*/src` so `backend/api` picks it up.
- `KATALYST_FRONTEND_SPEC.md` / `KATALYST_BACKEND_SPEC.md` / `KATALYST_AI_SPEC.md` — the
  authoritative specs for each layer (aspirational in places — e.g. the backend spec describes
  Next.js Route Handlers, while `backend/api` is a standalone Express service; the specs still
  define the data model/contracts this build is working toward).

**Current status.** `frontend/lib/data/*.ts` (the Zustand store) still backs everything except the
AI Coach: activities, enrollments, submissions, gamification, meetings, notifications, etc. are all
mock/in-memory. The AI Coach (`frontend/lib/ai/coach.ts`'s `coachReplyLive`, via
`frontend/app/api/coach/route.ts` and `frontend/lib/services/backendClient.ts`) is the one real,
end-to-end path: browser → Next.js route → `backend/api` (JWT auth + guardrails) → `ai/ai-client` →
Gemini. `lib/ai/chatbot.ts` and `lib/ai/review.ts` are still mocked. Wiring the rest of the
platform to `backend/api` (per `KATALYST_BACKEND_SPEC.md` §16's phases) is the next milestone.

`npm test` and `npm run typecheck` cover the `ai/`/`backend/shared-types` workspace packages plus
the frontend build. `backend/api` has its own test script (`npm run test:api --workspace
@katalyst/backend-api`, see `backend/api/API_TESTING.md`).

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI, Lucide-ready layout, React Hook
Form + Zod, Zustand mock store for the non-AI parts of the product. `backend/api`: Express,
Mongoose, JWT auth. `ai/`: Gemini via `@katalyst/ai-client`, Zod-validated schemas.

## Notes

- Database is **not required** for the demo UI (the Zustand mock store needs nothing but the
  frontend). It **is** required for `backend/api`'s real auth and, by extension, the live AI
  Coach — `backend/api` itself still starts and serves `/api/health` without a reachable MongoDB
  (see `backend/api/config/db.js`), and every other route fails fast with a `503` instead of
  hanging on a Mongoose timeout (see `backend/api/middleware/dbMiddleware.js`), but no
  authenticated request can succeed until Mongo is reachable.
- Auth never stores passwords in the frontend mock; `frontend/lib/auth` is shaped for Auth.js
  later. `backend/api` uses real bcrypt + JWT.
- The AI gateway is guardrailed: input/output validation, regex-based prompt-injection and PII
  detection, rate limiting, and an internal-service-key gate on the (non-client-facing) AI Judge
  scoring route — see `backend/api/services/ai/` and `KATALYST_AI_SPEC.md`.
