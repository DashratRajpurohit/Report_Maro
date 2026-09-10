# Task Breakdown

Picking up from `backend/`'s current state (PRs #4–#9) plus this PR's
frontend + three additive endpoints. See docs/API_CONTRACT.md for the exact
current contract and docs/ARCHITECTURE.md for why it's shaped this way.

## Backend (owns `backend/`)

- [ ] Fix `backend/src/queue/producer.js` calling `getRedisClient()` at
      module load — crashes `require('./app')` without `REDIS_URI` set
      (pre-existing, see ARCHITECTURE.md's "Known pre-existing issue").
- [ ] `backend/src/utils/redisCache.js` calls `redis.get/setex/del` directly
      on the module returned by `require('../config/redis')`, which exports
      `{ getRedisClient, closeRedis }`, not a client — this looks like it
      would throw the first time `getStats`'s cache path is hit. Worth a
      quick look.
- [ ] Add a refresh-token flow (current JWT is a single 7-day token with no
      rotation or revocation).
- [ ] Add `GET /api/problems?submitted_by=me` (or similar) so a citizen can
      see their own reports without every problem in the system.
- [ ] Review the three additive endpoints from this PR (`GET /api/users`,
      `GET /api/projects`, `GET /api/projects/:id`) — they're deliberately
      minimal (no pagination, no admin-only restriction on `/api/users`);
      harden as needed.
- [ ] Wire `AuditLog` (model exists, nothing writes to it yet).

## AI (owns `backend/src/queue/worker.js`)

- [ ] Replace the dummy keyword-count `classifyText()` with real
      classification — the queue/producer/internal-callback plumbing
      already works end-to-end (BullMQ job → worker → `PATCH
      /api/internal/problems/:id`), so this is a drop-in swap of the
      function body, not a new integration.
- [ ] Same for `getPriority()` — currently a fixed urgent-keyword list.
- [ ] Consider a confidence threshold below which a human (admin) reviews
      before the problem is marked `verified` (today, `confidence` is
      always hardcoded to `0.85`).

## Frontend (owns `frontend`)

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
      `docs/API_CONTRACT.md` and `frontend/src/schemas` in the same PR.
- [ ] `backend/`'s `npm test` is currently a stub that always exits 1 —
      replace with real tests (Jest/Vitest) rather than leaving it failing.
