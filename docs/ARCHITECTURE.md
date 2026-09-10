# Architecture

## What actually exists

```
Report_Maro/
├── backend/          Amrit-raj50's Express + MongoDB service (PRs #4-#9).
│                     Own npm project, NOT a pnpm workspace member —
│                     untouched structurally by this PR except three
│                     additive endpoints and Socket.io wiring (see below).
├── apps/
│   └── web/          React + Vite frontend, built against backend/'s real
│                     API (docs/API_CONTRACT.md). New in this PR.
├── packages/
│   ├── shared-types/ Zod schemas mirroring backend/'s actual Mongoose
│   │                 shapes and response envelopes. Consumed by frontend
│   │                 only — backend/ stays plain JS, untouched.
│   └── config/       Shared eslint/tsconfig bases for frontend + frontend/src/schemas.
├── infra/
│   └── docker-compose.yml   Mongo + Redis (matches backend/'s actual deps).
└── docs/             This folder.
```

## Why this shape

An earlier version of this repo's tooling scaffolded a competing Postgres +
Prisma + TypeScript backend and proposed deleting `backend/` entirely. That
would have discarded Amrit-raj50's already-merged, working REST API, auth,
RBAC, Redis caching, and BullMQ queue (PRs #4–#9). This version instead
takes `backend/` as the given foundation and builds on top of it:

- **Nothing in `backend/` is restructured.** Every file from PRs #4–#9 keeps
  its exact location, exports, and behavior.
- **Three additive backend changes** were made because the frontend
  genuinely cannot function without them — not by choice, but because the
  flows they support (admin assigning a problem, a university seeing its
  own projects, an industry browsing fundable ones) have no other way to
  work:
  1. `GET /api/users?role=` (`backend/src/routes/user.route.js` — new file)
  2. `GET /api/projects` and `GET /api/projects/:id` (added to the existing
     `project.controller.js` / `project.route.js`, alongside the existing
     `submitProposal`/`fundProject` exports — nothing removed)
  3. `backend/src/config/socket.js` (new file) + a small edit to
     `backend/src/index.js` wrapping `app.listen()` in `http.createServer()`
     so Socket.io can attach. **Why:** `problem.controller.js`,
     `project.controller.js`, and `internal.controller.js` already call
     `req.app.get('io')` and `.emit(...)` — but nothing ever created an `io`
     instance or called `app.set('io', io)`, so every one of those emits was
     a silent no-op. This wiring makes already-written code actually run;
     it adds no new real-time behavior of its own.
- **`frontend` is new** and matches `backend/`'s real field names (`full_name`,
  `_id`, `location.lat`/`lng`, lowercase enums like `citizen`/`water`/`high`)
  rather than an idealized contract — see docs/API_CONTRACT.md.
- **`frontend/src/schemas`** exists only so `frontend` gets compile-time
  safety against that real contract. `backend/` does not depend on it and
  stays CommonJS/plain JS, per PRs #4–#9's existing convention.

## Known pre-existing issue (not introduced by this PR)

`backend/src/queue/producer.js` calls `getRedisClient()` at module load
time, which throws if `REDIS_URI` isn't set (see `backend/src/config/redis.js`
line 9). This means `backend/` cannot even `require('./src/app')` without a
Redis URL configured — confirmed independent of this PR's changes by
reproducing it against `upstream/main` directly. Flagging here rather than
fixing silently since it's someone else's in-progress code; worth a quick
fix (default/lazy-init) as a follow-up.

## Local development

```bash
pnpm install                     # frontend + frontend/src/schemas (pnpm workspace)
cd backend && npm install        # backend/ (separate, npm-managed)

docker compose -f infra/docker-compose.yml up -d   # Mongo + Redis

# Terminal 1
cd backend && cp .env.example .env  # fill in JWT_SECRET, MONGODB_URI, REDIS_URI, INTERNAL_API_KEY
npm run dev

# Terminal 2
cd frontend && cp .env.example .env
pnpm dev
```
