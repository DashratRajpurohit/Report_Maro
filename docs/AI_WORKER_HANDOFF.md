# AI Worker Integration — Handoff & Progress Log

This file is the single shared source of truth for the backend-improvement
+ AI-integration work described below. **Every agent or person who works on
this (Claude, Antigravity, a human) appends a dated entry to the [Journal](#journal)
before stopping**, even if the work isn't finished — a half-done state with
a clear note is far more useful to the next session than silence.

Scope of this file: **`backend/` only.** `apps/web` (the frontend) is owned
by a different team and must not be touched by whoever picks this up — see
[Frontend: hands off](#frontend-hands-off-informational-only) below for the
one exception (things they should know about, not act on from here).

---

## 🔴 Security notice — rotate these credentials

[Discussion #3](https://github.com/himmatmundhe07/Report_Maro/discussions/3)
has four comments (posted 2026-09-08) containing **live, plaintext**
credentials in a **public** GitHub Discussion, visible to anyone:

- A MongoDB Atlas connection string (username + password)
- An Upstash Redis connection string (with password)
- The production `JWT_SECRET`
- Cloudinary `CLOUD_NAME` / `API_KEY` / `API_SECRET`

**These must be rotated** (new DB user/password, new Redis password, new
JWT secret, new Cloudinary keys) regardless of anything else in this
document — whoever owns those accounts (Amrit-raj50 / the project's
MongoDB Atlas + Upstash + Cloudinary dashboards) should do this as soon as
possible. This file intentionally does not repeat the leaked values.

Going forward: **never paste real credentials into a GitHub Discussion,
Issue, PR, or commit** — even in a "private-feeling" thread, Discussions
are public by default on a public repo. Use each person's local `.env`
(gitignored) and, if credentials need sharing, a private channel (DM,
password manager) instead.

---

## Scope: what this covers

Two workstreams, in order:

1. **Backend hardening** — fix the known issues in `backend/` (see
   `docs/TASK_BREAKDOWN.md`'s "Backend" section for the full, current list;
   summarized again below since it's the immediate priority).
2. **AI integration** — replace the dummy `classifyText()` / `getPriority()`
   functions in `backend/src/queue/worker.js` with a real AI model, per the
   guide originally posted in
   [Discussion #3](https://github.com/himmatmundhe07/Report_Maro/discussions/3#discussioncomment-18384711)
   (2026-09-10) and expanded on below with the current, verified state of
   the code (the discussion's guide was accurate as of when it was posted;
   this file is the version to trust if the two ever disagree, since it's
   kept in sync with the actual code).

### 1. Backend hardening — do this first

From `docs/TASK_BREAKDOWN.md`, the still-open items as of this writing:

- **`backend/src/config/redis.js` hardcodes `host`/`port`** in the ioredis
  options, which overrides whatever `REDIS_URI` says — any Redis instance
  other than the one specific Upstash host gets silently ignored. Remove
  the hardcoded `host: 'knowing-sunbird-83863.upstash.io'` and `port: 6379`
  keys; let the connection string alone determine the target. This matters
  *now* because the credentials above are being rotated — a fresh
  `REDIS_URI` won't actually take effect until this is fixed.
- `backend/package.json` has dead `@prisma/client` / `prisma` dependencies
  (no `schema.prisma` anywhere, nothing imports `@prisma/client`) — remove
  them.
- No refresh-token flow (single 7-day JWT, no rotation/revocation).
- `AuditLog` is wired in `project.controller.js` (`submitProposal`,
  `fundProject`) but not in `problem.controller.js` (assign) or
  `auth.controller.js` (register/login) — same fire-and-forget pattern,
  extend it.
- `npm test` in `backend/` is a stub that always exits 1 — replace with
  real tests once the above stabilizes.

Two other pre-existing bugs from this list are **already fixed** (verify
before "fixing" them again): the Redis eager-connect-at-import crash in
`queue/producer.js`, and `redisCache.js` calling methods on the wrong
export. Don't rediscover these as new work.

### 2. AI integration — architecture (verified against current code)

```
POST /api/problems (citizen)
  → Problem saved, status = 'submitted'
  → enqueueClassification(problemId, description)   [producer.js]
       → BullMQ job on the 'classification-queue' (Redis-backed)
  → 202 returned to the citizen immediately

worker.js picks up the job
  → classifyText(text) -> category           ← dummy today, replace this
  → getPriority(text) -> priority             ← dummy today, replace this
  → confidence = 0.85 (hardcoded)             ← replace this too
  → PATCH /api/internal/problems/:id
       headers: { 'x-internal-api-key': INTERNAL_API_KEY }
       body: { category, priority, confidence, status: 'verified' }
  → internal.controller.js's updateProblemAI() applies it, notifies admins,
    emits the 'problem_verified' socket event
```

**Do not touch the internal API call itself** (`axios.patch(...)` at the
bottom of the worker's job handler) — it's already correct. The only two
functions to replace are `classifyText(text)` and `getPriority(text)` near
the top of `backend/src/queue/worker.js`, plus the hardcoded `confidence`.

**Category values** (Mongoose enum on `Problem.category`, `problem.model.js`):
`water | road | health | other`. Stick to exactly these unless the schema's
`enum` array is updated in the same change.

**Priority values** (same file, `Problem.priority`): `low | medium | high`.
Same constraint.

**Choosing a model provider:** not yet decided — pick whichever fits the
budget/latency (OpenAI, Anthropic Claude, Google Gemini all work fine for
straightforward classification; the discussion's example used OpenAI's
Chat Completions API but that's not a hard requirement). Make it swappable
via an env var (`AI_PROVIDER=openai|anthropic|gemini` or similar) rather
than hardcoding one SDK, so a future budget/rate-limit issue doesn't
require a rewrite. **Do not commit a real API key anywhere** — add the new
env var name(s) to `backend/.env.example` with an empty value.

**Rate limits / retries:** BullMQ is already configured for 3 attempts
with exponential backoff (`producer.js`). If the AI provider returns a
429, let the error propagate (don't catch-and-swallow it) so BullMQ
retries automatically.

**Image analysis (optional, stretch goal):** `image_urls` already exist on
the `Problem` document (Cloudinary upload happens at submit time in
`problem.controller.js`), but the queue job currently only carries
`{ problemId, text }` — no image URLs. If pursuing vision analysis, the
job payload in `producer.js`'s `enqueueClassification()` needs to include
`image_urls` (or the worker needs to fetch the `Problem` doc by
`problemId` before classifying). Not required for the core text
classification work.

---

## Frontend: hands off (informational only)

`apps/web` is owned by a separate team/session and should not be edited as
part of this workstream. The only thing worth flagging to them, if it
changes: **if the AI work ever needs a new `Problem.priority` value (e.g.
`critical`)**, that's a `packages/shared-types` + `apps/web` change too
(the `Priority` enum, badges, etc.) — leave a note in the Journal below and
let the frontend team pick it up; don't make that change here.

---

## Journal

Append a new entry at the top each time you work on this. Keep entries
factual and specific — what you changed, what you verified, what's still
open, and any decision you made that the next session needs to know about
(e.g. "picked OpenAI over Anthropic because...").

<!-- Template:
### YYYY-MM-DD — <agent/person> — <one-line summary>
- Changed:
- Verified:
- Still open / blocked on:
- Decisions made:
-->

### 2026-09-10 — Claude (Sonnet 5) — file created, no code changes yet

- Changed: created this file and updated `docs/TASK_BREAKDOWN.md` (marked
  the producer.js/redisCache.js bugs fixed, added the `redis.js` hardcoded
  host/port finding, added the `@prisma/client` dead-dependency finding).
- Verified: re-read `backend/src/queue/producer.js`, `worker.js`,
  `utils/redisCache.js`, `config/redis.js`, `package.json` against the
  current `upstream/main` tip (`c26b931` and later commits) to confirm the
  architecture description and bug list above are accurate as of now, not
  stale from an earlier PR.
- Still open / blocked on: everything in "Scope" above — no backend code
  changed yet. Next session should start with the `redis.js` hardcoded
  host/port fix (small, unblocks credential rotation), then move to the AI
  integration.
- Decisions made: none yet — provider choice left open for whoever
  implements it (see "Choosing a model provider" above).
