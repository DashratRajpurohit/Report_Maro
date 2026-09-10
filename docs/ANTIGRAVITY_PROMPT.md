# Prompt for Antigravity

Paste everything below this line into Antigravity as your first message in
this repo.

---

You're picking up backend work on **Report_Maro** (SIH 2026 Societal
Innovation Portal). Your scope is **`backend/` only** — do not touch
`apps/web` (the React frontend) or `packages/*` under any circumstances;
that's a separate team's work and out of bounds for you.

## Before you write any code

Read these in order:

1. `AGENTS.md` — repo map and conventions.
2. `docs/ARCHITECTURE.md` — why the repo is shaped the way it is.
3. `docs/API_CONTRACT.md` — the actual current API.
4. **`docs/AI_WORKER_HANDOFF.md`** — this is your primary brief. It has the
   full architecture, the exact functions to change, the constraints
   (Mongoose enums you must not silently break), and a Journal section.
5. `docs/TASK_BREAKDOWN.md`'s "Backend" and "AI" sections for the itemized
   list.

## Your two-phase task

**Phase 1 — backend hardening (do this first, it's small and unblocks
everything else):**

Fix the items listed under "1. Backend hardening" in
`docs/AI_WORKER_HANDOFF.md`. Start with `backend/src/config/redis.js`'s
hardcoded `host`/`port` — it's a few lines and currently means nobody can
point the backend at a different Redis instance than one specific Upstash
account, which matters right now because those credentials are being
rotated (see the security notice at the top of that file).

**Phase 2 — AI integration:**

Replace the dummy `classifyText()` and `getPriority()` functions in
`backend/src/queue/worker.js` with real AI-model calls, per
`docs/AI_WORKER_HANDOFF.md`'s "2. AI integration" section. Key constraints,
already verified against the current code (don't re-derive these, they're
accurate as of this file being written):

- Only those two functions (plus the hardcoded `confidence = 0.85`) need
  to change. The BullMQ job handling and the `axios.patch(...)` call to
  `/api/internal/problems/:id` at the bottom of the worker are already
  correct — leave them alone.
- `category` must be one of `water | road | health | other` (Mongoose enum
  on `Problem.category`) and `priority` one of `low | medium | high`
  (same file, `Problem.priority`) — unless you deliberately update the
  schema's `enum` array in the same change, in which case flag it loudly
  in the Journal since it's a cross-cutting change the frontend team needs
  to know about (do not make the frontend change yourself).
- Pick an AI provider (OpenAI, Anthropic, Gemini — your call, the
  handoff doc explains why it's left open) and make it configurable via an
  env var rather than hardcoded. Add the new env var name(s) to
  `backend/.env.example` with an empty value. **Never commit a real API
  key.**
- Let rate-limit errors (429s) propagate so BullMQ's existing retry/backoff
  handles them — don't catch-and-swallow.
- Image analysis (`image_urls` on the `Problem` doc) is an optional stretch
  goal, not required for phase 2 to be considered done.

## Working conventions

- `backend/` is plain JS, CommonJS, Mongoose — match the existing style
  (see recent commits for the arrow-function-exports convention the team
  settled on).
- Any change to a request/response shape updates `docs/API_CONTRACT.md` in
  the same PR.
- Branch naming: `feat/ai-<short-desc>` or `fix/be-<short-desc>`.
  Conventional Commits for messages.
- **Before you stop working** (whether the task is done, partially done, or
  you're blocked), append a dated entry to the Journal section at the
  bottom of `docs/AI_WORKER_HANDOFF.md` — what you changed, what you
  verified, what's still open, and any decision you made (e.g. which AI
  provider and why). This is how the next session — human or AI — picks up
  where you left off without re-deriving context. Keep entries factual and
  specific, not a restatement of this prompt.
- If you get blocked on something only a human can decide (e.g. "which AI
  provider's API key does the team actually have budget for"), say so in
  the Journal and stop there rather than guessing.

## Do NOT

- Do not touch `apps/web/`, `packages/shared-types/`, or `packages/config/`.
- Do not commit real credentials, including the ones you'll see referenced
  as "needs rotating" — those specific old ones are compromised (posted
  publicly), and any new ones you generate for local testing stay in your
  own gitignored `.env`, never in a commit.
- Do not modify the `axios.patch` internal-API call in `worker.js` beyond
  what's needed to pass the new `category`/`priority`/`confidence` values.
