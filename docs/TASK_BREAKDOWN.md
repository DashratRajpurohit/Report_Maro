# Task Breakdown — Societal Innovation Portal

Concrete tickets per team member, derived from [PRD.md](./PRD.md) and
[API_CONTRACT.md](./API_CONTRACT.md). Pick up your tickets once the planning docs are approved and
`apps/*` scaffolding begins. Every ticket should become its own PR (see
[CONTRIBUTING.md](../CONTRIBUTING.md)) — don't batch unrelated tickets into one branch.

Legend: **[MVP]** = must work for the demo (PRD §4.1). Unmarked/**[nice-to-have]** = PRD §4.3,
build only if MVP is done early.

---

## FE-1 — Auth pages, citizen submit form, map + listing view

- [ ] **[MVP]** Scaffold `apps/web` (Vite + React 18 + TS + Tailwind + shadcn) once approved.
- [ ] **[MVP]** MSW mock handlers matching every endpoint this pair owns, from `openapi.yaml` —
      build against mocks before `apps/api` has real routes.
- [ ] **[MVP]** Login page + Register page (role picker: Citizen self-serve; University/Industry
      select a pre-seeded org — see `docs/DEMO_DATA.md`), Zod-validated via React Hook Form.
- [ ] **[MVP]** Auth state in Zustand; access/refresh token handling incl. silent refresh on 401.
- [ ] **[MVP]** Citizen problem-submit form: title/description validation matching
      `CreateProblemRequest`, Mapbox pin picker that resolves a district, photo upload flow
      (presign → direct PUT → attach `{key,url}`), optimistic "Processing" state after submit.
- [ ] **[MVP]** Problem list view: filters (status/category/priority/district/search), pagination.
- [ ] **[MVP]** Problem map view: markers from `GET /problems?bbox=...`, colored by
      category/priority, popup linking to detail.
- [ ] **[MVP]** Problem detail page: shows analysis once present, subscribes to
      `problem:<id>` room for live status updates.
- [ ] **[MVP]** "My Reports" view (citizen's own submissions via `?mine=true`).
- [ ] **[nice-to-have]** Mapbox marker clustering for dense districts.

## FE-2 — Admin dashboard, University dashboard, Industry portal, real-time notifications

- [ ] **[MVP]** MSW mocks for admin/university/industry/notification endpoints.
- [ ] **[MVP]** Socket.io-client wrapper: connects with the JWT, typed against
      `ServerToClientEvents`/`ClientToServerEvents` from `@sih/shared-types`, reconnect handling.
- [ ] **[MVP]** Notification bell: unread count, dropdown feed, mark-read/mark-all-read, toast on
      `notification:new`.
- [ ] **[MVP]** Admin dashboard: stat tiles + charts from `GET /stats/overview`, triage queue
      (TRIAGED problems sorted by priority), assign-to-university flow with searchable org picker.
- [ ] **[MVP]** Admin proposal review screen: approve/reject with note.
- [ ] **[MVP]** University dashboard: assigned problems, accept/decline (with required reason on
      decline), proposal form (summary/approach/team/budget/timeline) with draft-save.
- [ ] **[MVP]** Industry portal: browsable fundable projects (filter by category/district/budget),
      funding pledge modal, funding ledger view on project detail.
- [ ] **[nice-to-have]** CSV export of problems for admin; Recharts trend line beyond flat counts.

## BE-1 — Auth (JWT), Problem CRUD API, PostgreSQL schema + migrations, Assignment API

- [ ] **[MVP]** Scaffold `apps/api` (Express + TS) and Prisma, once approved.
- [ ] **[MVP]** Prisma schema: User, Organization, Problem (incl. `vector(384)` column via
      pgvector), Assignment — matching the shapes in `API_CONTRACT.md` / `shared-types`.
- [ ] **[MVP]** `POST/GET /auth/register|login|refresh|logout|me` with JWT access+refresh, bcrypt
      password hashing, Zod validation on every body.
- [ ] **[MVP]** `GET/POST /problems`, `GET /problems/:id`, `PATCH /problems/:id/status` — incl.
      bbox filter, pagination, full-text search on title+description.
- [ ] **[MVP]** On problem create: enqueue `analyze-problem` job (BullMQ producer side — coordinate
      queue setup with BE-2), return 201 within the contract's latency expectation.
- [ ] **[MVP]** `GET/POST /assignments`, `GET /assignments/:id`, `PATCH /assignments/:id` — incl.
      the 409-on-double-assignment rule and decline-frees-the-problem rule from PRD Flow 2.
- [ ] **[MVP]** `GET /organizations` for picker dropdowns.
- [ ] **[MVP]** Role-based auth middleware (CITIZEN/ADMIN/UNIVERSITY/INDUSTRY guards per route).
- [ ] **[MVP]** Seed script skeleton (final data content is a shared task — see `DEMO_DATA.md`).

## BE-2 — Redis + BullMQ queue, Internal API, Socket.io server, MongoDB raw data

- [ ] **[MVP]** `infra/docker-compose.yml`: Postgres (pgvector extension init), Redis, MongoDB,
      MinIO — once scaffolding is approved.
- [ ] **[MVP]** BullMQ queue setup (`problem-analysis` queue, shared retry/backoff config from
      `@sih/shared-types`), producer helper BE-1 calls from the problem-create route.
- [ ] **[MVP]** Internal API: `POST /internal/problems/search-similar`,
      `POST /internal/problems/:id/analysis` (idempotent), `POST /internal/problems/:id/failure`
      — `x-internal-key` middleware, never mounted behind the public CORS config.
- [ ] **[MVP]** Socket.io server: JWT handshake auth, room derivation
      (`user:`/`role:`/`org:`/`problem:`), emit helpers for every event in `API_CONTRACT.md`'s
      socket table, wired into the relevant route handlers (coordinate with BE-1 on proposal/
      project/funding routes as those land).
- [ ] **[MVP]** Notification persistence + `GET /notifications`, `/unread-count`, `/:id/read`,
      `/read-all` — every socket `notification:new` also writes a row.
- [ ] **[MVP]** MongoDB connection for raw AI-worker debug payloads (used by AI-1/AI-2, owned/
      provisioned by BE-2).
- [ ] **[MVP]** `GET /health` — Postgres/Redis/Mongo dependency probe.
- [ ] **[MVP]** `scripts/check-contract.mjs` (repo root) — CI script diffing implemented Express
      routes against `docs/openapi.yaml`.

## AI-1 — BullMQ worker skeleton, classifier, priority scorer

- [ ] **[MVP]** Scaffold `apps/ai-worker` (Node + TS), BullMQ consumer for `problem-analysis`,
      once approved — must run against seeded job fixtures with no live Redis for unit tests.
- [ ] **[MVP]** Rule-based classifier: keyword/regex taxonomy mapping text → one of the 9
      `ProblemCategory` values, with a confidence score; must run fully offline (no external API).
- [ ] **[MVP]** Priority scorer: rule-based signals (keywords like "emergency"/"contaminated",
      category baseline, recency) → `Priority` + 0-100 `priorityScore`.
- [ ] **[MVP]** Wire classifier + scorer output into the `AnalysisCallbackRequest` shape and call
      the Internal API client (built by AI-2) to post results back.
- [ ] **[MVP]** Failure path: on exhausting BullMQ retries, call
      `POST /internal/problems/:id/failure` instead of letting the job vanish silently.
- [ ] **[nice-to-have]** OpenAI-generated proposal-summary suggestion helper for University users
      (separate from the fallback classifier below — this is a v2 idea, not required).

## AI-2 — Dedupe (pgvector similarity), OpenAI fallback, Internal API client

- [ ] **[MVP]** Embedding generation for a submitted problem (local small model,
      384-dimensional, matching `EMBEDDING_DIMENSIONS`) — must work offline.
- [ ] **[MVP]** Internal API client (Axios) used by AI-1: `searchSimilar(embedding, ...)`,
      `postAnalysis(problemId, payload)`, `postFailure(problemId, payload)` — typed against
      `@sih/shared-types`, `x-internal-key` header injected from env, never hardcoded.
- [ ] **[MVP]** Dedupe logic: call `search-similar`, apply the `minScore` (default 0.8) threshold,
      set `duplicateOfId`/`similarityScore` on the analysis payload when matched.
- [ ] **[MVP]** OpenAI fallback: triggered only when the rule-based classifier's confidence is
      below a tunable threshold; gated by an env flag so its absence never breaks the primary path
      (PRD §7 assumption — must degrade gracefully with zero external calls).
- [ ] **[MVP]** Fixtures + tests for dedupe threshold tuning against realistic near-duplicate pairs
      (e.g. two reports of the same pond, worded differently) — validate before demo day.

---

## Shared / cross-cutting (pick up as a pair when blocking, not solo)

- [ ] `docs/DEMO_DATA.md` content + the actual seed script producing it — needs BE-1 (schema),
      and ideally input from everyone on realistic problem text per category.
- [ ] End-to-end rehearsal of all 4 PRD flows against the real (non-mocked) stack before demo day.
- [ ] Keep `docs/API_CONTRACT.md` / `openapi.yaml` / `packages/shared-types` in sync — whoever
      touches one touches all three in the same PR, per the contract-change rule in `AGENTS.md`.
