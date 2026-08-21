# Katalyst — Gamified Learning & Student Engagement

Hackathon-ready Next.js app for **Mastercard Code for Change**, alongside `backend/` and `ai/` packages.

## Run the product UI

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (no passwords):

- Student: `ananya@katalyst.edu`
- Admin: `priya.admin@katalyst.edu`

## Monorepo

- `app/` — student and admin portals (Next.js)
- `backend/` — shared types / API specs
- `ai/` — AI client, judge, coach packages

`npm test` and `npm run typecheck` still cover the workspace packages. Live Mongo and Gemini keys are optional; see `.env.example`.

Hackathon-ready Next.js app for **Mastercard Code for Change**. Two portals (student and admin), mock auth/OCR/AI/Mongo, real product flow from activity creation through XP.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Demo accounts (no passwords):

- Student: `ananya@katalyst.edu`
- Admin: `priya.admin@katalyst.edu`

## Stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn-style UI, Lucide-ready layout, React Hook Form + Zod, Zustand mock store, Mongoose models isolated in `lib/models`.

## Notes

- Database is **not required**. `MONGODB_URI` is in `.env.example` for a later swap.
- OCR, AI Coach, chatbot and AI review are mock services under `lib/`.
- Auth never stores passwords; `lib/auth` is shaped for Auth.js later.
