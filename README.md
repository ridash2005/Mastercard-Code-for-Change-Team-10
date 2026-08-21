# Katalyst — Gamified Learning & Student Engagement

Hackathon build for **Mastercard Code for Change**. Two portals (student and admin), real product
flow from activity creation through XP — currently running on **mock services**, not yet wired to
the `ai/`/`backend/` packages in this repo (see Monorepo status below).

## Run the product UI

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (no passwords):

- Student: `ananya@katalyst.edu`
- Admin: `priya.admin@katalyst.edu`

## Monorepo layout

- `frontend/` — the Next.js app (student + admin portals, App Router, TypeScript, Tailwind,
  shadcn-style UI). Run it via the root scripts above, or `cd frontend && npm run dev` directly.
- `backend/shared-types` — TS types meant to be shared between frontend and `/ai`.
- `ai/` — AI client (Gemini), AI Judge, AI Coach, and the Python matching/eval packages. Fully
  unit-tested in isolation (`npm test` at the root, `pytest` in `ai/python`).
- `backend-1/` — a standalone Express + MongoDB skeleton (auth, users, meetings). Early-stage,
  not yet wired to anything else in the repo.
- `KATALYST_FRONTEND_SPEC.md` / `KATALYST_BACKEND_SPEC.md` / `KATALYST_AI_SPEC.md` — the
  authoritative specs for each layer.

**Current status: these pieces are not yet connected.** `frontend/lib/ai/*.ts` and
`frontend/lib/data/*.ts` are self-contained mocks (a rule-based coach reply, an in-memory Zustand
store) — the running app does not call into `ai/ai-client`/`ai-judge`/`ai-coach`, and
`frontend/lib/db/mongodb.ts` is defined but never invoked. `backend-1`'s Express server is not
called by the frontend either. Wiring the real `/ai` packages and a real persistence layer into
the frontend (per `KATALYST_BACKEND_SPEC.md` §5 and `KATALYST_AI_SPEC.md`) is the next milestone,
not something this demo build currently does.

`npm test` and `npm run typecheck` cover the `ai/`/`backend/` workspace packages plus the frontend
build; `MONGODB_URI`/`GEMINI_API_KEY` are optional for the demo UI — see `.env.example`.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI, Lucide-ready layout, React Hook
Form + Zod, Zustand mock store, Mongoose models isolated in `frontend/lib/models` (unused by the
running app for now — see status above).

## Notes

- Database is **not required** for the demo UI. `MONGODB_URI` is in `.env.example` for a later
  swap to real persistence.
- OCR, AI Coach, chatbot, and AI review under `frontend/lib/` are mock services, separate from the
  real `ai/ai-judge`/`ai/ai-coach` packages.
- Auth never stores passwords; `frontend/lib/auth` is shaped for Auth.js later.
