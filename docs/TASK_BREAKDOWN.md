# Task Breakdown

Picking up from `backend/`'s current state (PRs #4–#9) plus this PR's
frontend + three additive endpoints. See docs/API_CONTRACT.md for the exact
current contract and docs/ARCHITECTURE.md for why it's shaped this way.

## Backend (owns `backend/`)

- [x] `backend/src/queue/producer.js` calling `getRedisClient()` at module
      load — fixed (lazy `getQueue()`, see `c26b931`/`91efe7d`).
- [x] `backend/src/utils/redisCache.js` calling `redis.get/setex/del` on the
      wrong export — fixed (calls `getRedisClient()` inside each function
      now).
- [x] `AuditLog` — wired in `project.controller.js`'s `submitProposal` and
      `fundProject` (fire-and-forget, errors logged not thrown). Still
      unused in `problem.controller.js` (assign/verify) and
      `auth.controller.js` (register/login) — worth the same treatment.
- [ ] **New finding:** `backend/src/config/redis.js`'s `getRedisClient()`
      hardcodes `host: 'knowing-sunbird-83863.upstash.io'` and `port: 6379`
      in the ioredis options, alongside passing the full `REDIS_URI` as the
      connection string. ioredis's constructor options override whatever
      host/port the URI encodes, so **any `REDIS_URI` pointing at a
      different Redis instance is silently ignored** — the connection
      always goes to that one Upstash host. This blocks anyone from running
      their own Redis locally/in CI with a different `REDIS_URI`. Drop the
      hardcoded `host`/`port` keys and let the URI alone determine the
      target. **Also see `docs/AI_WORKER_HANDOFF.md`'s security note** — the
      credentials for that Upstash instance were posted in a public GitHub
      Discussion and need rotating regardless of this fix.
- [ ] Add a refresh-token flow (current JWT is a single 7-day token with no
      rotation or revocation).
- [ ] Add `GET /api/problems?submitted_by=me` (or similar) so a citizen can
      see their own reports without every problem in the system.
- [ ] Review the three additive endpoints from PR #11 (`GET /api/users`,
      `GET /api/projects`, `GET /api/projects/:id`) — they're deliberately
      minimal (no pagination, no admin-only restriction on `/api/users`);
      harden as needed.
- [ ] `backend/package.json` still lists `@prisma/client` and `prisma` as
      dependencies with no `schema.prisma` anywhere in the repo and nothing
      importing `@prisma/client` — dead weight from an earlier experiment,
      safe to remove.

## AI (owns `backend/src/queue/worker.js`)

Full plan and running log: **[docs/AI_WORKER_HANDOFF.md](./AI_WORKER_HANDOFF.md)**.
Source: [Discussion #3, comment from 2026-09-10](https://github.com/himmatmundhe07/Report_Maro/discussions/3#discussioncomment-18384711).

- [ ] Replace the dummy keyword-count `classifyText()` with real
      classification — the queue/producer/internal-callback plumbing
      already works end-to-end (BullMQ job → worker → `PATCH
      /api/internal/problems/:id`), so this is a drop-in swap of the
      function body, not a new integration.
- [ ] Same for `getPriority()` — currently a fixed urgent-keyword list
      returning only `low`/`medium`/`high` (that's also the exact Mongoose
      `enum` on `Problem.priority` in `backend/src/models/problem.model.js`
      — stick to those three values, or update the schema's `enum` array
      in the same PR if a `critical` tier is added).
- [ ] Consider a confidence threshold below which a human (admin) reviews
      before the problem is marked `verified` (today, `confidence` is
      always hardcoded to `0.85`).
- [ ] Optional: image analysis — `image_urls` are already on the `Problem`
      document (uploaded via Cloudinary at submit time) but the worker only
      ever receives `{ problemId, text }` from the queue job today; fetching
      the problem doc for its `image_urls` and feeding them to a vision
      model is a stretch goal, not a blocker for the text-classification
      work above.
- [ ] Handle AI-provider rate limits (429s) by re-throwing so BullMQ's
      existing 3-attempt exponential backoff (`producer.js`) retries —
      don't swallow them.

## Frontend (owns `apps/web`)

- [ ] Photo upload: wire the file picker in `SubmitProblem.tsx` to send
      `multipart/form-data` — `backend/src/controllers/problem.controller.js`
      already accepts `req.files` via Cloudinary.
- [ ] Citizen "my reports" view, once the backend ticket above lands.
- [ ] Pagination controls on `ProblemList.tsx` (backend already returns
      `pagination.pages`).
- [ ] Replace the manual lat/lng number inputs in `SubmitProblem.tsx` with
      a map picker.
- [ ] `AdminDashboard.tsx`'s stats tiles are a starting point — the
      `byCategory`/`byDistrict` aggregates from `GET
      /api/problems/stats/dashboard` aren't charted yet.

## Cross-cutting

- [ ] Any change to an endpoint's request/response shape must update
      `docs/API_CONTRACT.md` and `packages/shared-types` in the same PR.
- [ ] `backend/`'s `npm test` is currently a stub that always exits 1 —
      replace with real tests (Jest/Vitest) rather than leaving it failing.
