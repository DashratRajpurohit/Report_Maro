# Architecture — Societal Innovation Portal

## 1. System diagram

```
┌────────────┐        HTTPS/REST         ┌──────────────┐
│  apps/web  │ ────────────────────────▶ │   apps/api   │
│ React+Vite │ ◀──────────────────────── │ Express + TS │
│            │        Socket.io          │              │
└────────────┘ ◀────────────────────────▶└──────┬───────┘
                                                 │
                          ┌──────────────────────┼───────────────────────┐
                          │                       │                       │
                     ┌────▼────┐            ┌─────▼─────┐           ┌─────▼─────┐
                     │Postgres │            │   Redis   │           │  MongoDB  │
                     │(+pgvec) │            │ (BullMQ)  │           │ raw/logs  │
                     └─────────┘            └─────┬─────┘           └───────────┘
                                                   │ enqueue "analyze-problem"
                                             ┌─────▼──────┐
                                             │ apps/      │
                                             │ ai-worker  │
                                             │ (BullMQ    │
                                             │  consumer) │
                                             └─────┬──────┘
                                                    │ POST /api/v1/internal/*
                                                    │ (x-internal-key header)
                                             back to apps/api ──▶ Socket.io ──▶ apps/web
```

Object storage (MinIO locally / S3-compatible in prod) sits beside Postgres for problem photos;
the API only ever hands out presigned URLs, it never proxies image bytes (see
[API_CONTRACT.md](./API_CONTRACT.md#uploads)).

## 2. Tech stack per app, and why

| App | Stack | Why this over the alternative |
|---|---|---|
| `apps/web` | React 18, Vite, TypeScript, Tailwind, shadcn/ui, Zustand, React Hook Form + Zod, Mapbox GL JS, Socket.io-client, MSW for contract-mocked dev | React for hiring/help availability; Vite for iteration speed; shadcn over a full component library keeps bundle small and Tailwind-native; Zustand over Redux — this app's state (auth, active filters, socket cache) doesn't need Redux's ceremony; MSW lets FE build against `docs/openapi.yaml`-shaped mocks before `apps/api` has a single real route |
| `apps/api` | Node + Express + TypeScript, Prisma → PostgreSQL (+pgvector extension), MongoDB (raw/unstructured payloads, e.g. original AI model output blobs), Redis + BullMQ, Socket.io, JWT | Express for a 6-person team's familiarity and hackathon velocity over a heavier framework; Prisma for a fast, type-safe schema iteration loop; Postgres because the domain is fundamentally relational (users↔problems↔assignments↔proposals↔projects) with one true ownership graph; pgvector so duplicate-detection embeddings live next to the rows they describe instead of a separate vector DB; Mongo reserved narrowly for messy/raw data the relational schema shouldn't be forced to model |
| `apps/ai-worker` | Node + TypeScript, BullMQ consumer, rule-based classifier (keyword/regex taxonomy) as the primary path, OpenAI API as an optional low-confidence fallback, Axios internal-API client | Node/TS to share `packages/shared-types` with zero translation layer and let AI-1/AI-2 move without context-switching languages; rule-based-first (not a hosted model) so the demo works with **zero external network calls** if venue wifi or API quota fails; OpenAI is additive, gated by an env flag, never a hard dependency |

## 3. Data model overview

Core relational entities (PostgreSQL via Prisma) — exact field names are a `BE-1` implementation
decision made when the Prisma schema is written, not fixed here; the shapes below are what the
API contract guarantees regardless of column names:

- **User** — id, email, passwordHash, name, phone?, role, organizationId? (null for CITIZEN/ADMIN)
- **Organization** — id, name, type (UNIVERSITY/INDUSTRY/GOVERNMENT), district?, contactEmail?
- **Problem** — id, title, description, location (lat/lng/district/address), photos (jsonb array
  of `{key,url}`), status, reporterId, category?, priority?, duplicateOfId?, embedding
  (`vector(384)`, pgvector), createdAt/updatedAt
- **Assignment** — id, problemId (1:1 while active), universityId, status, note?, dueDate?,
  assignedById, respondedAt?
- **Proposal** — id, assignmentId, title, summary, approach, teamMembers (jsonb), budgetInr,
  timelineWeeks, status, reviewNote?, submittedById
- **Project** — id, proposalId (1:1), status, budgetInr, fundedInr (derived from Funding sum)
- **Funding** — id, projectId, industryId, amountInr, note?, fundedById
- **Notification** — id, userId, type, title, body, link?, readAt?

MongoDB holds one loosely-structured collection: raw AI worker output (full classifier
scores/keyword hits per run) kept for debugging/tuning, keyed by problemId — never the system of
record for anything the API guarantees in its contract.

Redis holds only the BullMQ queue state (no application data is read from Redis directly by any
route handler).

## 4. Why contract-first, not phase-first

The original README plan was Backend → AI → Frontend in sequence, which idles 4 of 6 people
waiting on the phase ahead of them. This project instead fixes
[`docs/API_CONTRACT.md`](./API_CONTRACT.md) (and its machine-readable twin,
[`docs/openapi.yaml`](./openapi.yaml)) on Day 0, before any app code, and all three surfaces build
against it simultaneously:

- **apps/web** ships MSW handlers that return contract-shaped fixtures — every page is buildable
  and demoable against mocks before `apps/api` exists.
- **apps/ai-worker** ships seeded job fixtures matching the queue contract — the classifier and
  scorer are testable without Redis or Postgres running.
- **apps/api** is graded against the contract in CI (a script diffs implemented routes against
  `openapi.yaml`; see `AGENTS.md`), not against whatever the frontend happened to assume.

Integration is continuous (every PR's CI run), not a big-bang event at the end of the hackathon
timeline.

## 5. Local dev infra

`infra/docker-compose.yml` (to be written when scaffolding is approved) brings up Postgres (with
the pgvector extension enabled via init SQL), Redis, MongoDB, and optionally MinIO for local
S3-compatible photo storage — so no team member needs a cloud account to run the full stack
locally.

## 6. Deferred / future architecture (not built for the hackathon)

- Horizontal scaling of `apps/ai-worker` (multiple BullMQ consumers) — the code should not
  preclude it (jobs are already idempotent-safe), but only one instance runs for the demo.
- A real payment gateway behind the funding pledge.
- k8s manifests (`infra/k8s/`) — placeholder only; not needed to run or demo the project.
- Multi-region / CDN concerns for the deployed demo (Render + a static host is sufficient).

## 7. Decisions made on the team's behalf (project-manager call, final)

- **Root-level monorepo** — this repo *is* the portal, not a nested `sih2026-portal/` folder. The
  original `backend/` hello-world stub has been removed in favor of `apps/api`.
- **pnpm workspaces without Turborepo** — one less moving part for a 6-person team on a tight
  clock; CI gets per-app parallelism from a job matrix instead of build caching.
- **Single shared repo, not a fork model** — everyone pushes feature branches to this repo and
  opens PRs into `main`; branch protection requires 2 approvals (1 same-surface, 1 cross-surface)
  per [CONTRIBUTING.md](../CONTRIBUTING.md). Simpler to administer for a 6-person hackathon team
  than coordinating 6 forks.
- **Embeddings: local, offline, 384-dim** — `apps/ai-worker` uses `@xenova/transformers` running
  `Xenova/all-MiniLM-L6-v2` entirely in-process (ONNX, no network call per request, only a one-time
  model download). `EMBEDDING_DIMENSIONS = 384` in `shared-types` matches this model's output
  width. Chosen specifically so the dedupe pipeline works with zero external API dependency, per
  the PRD's offline-demo assumption.
- **OpenAI is strictly a fallback** — only invoked when the local classifier's confidence is below
  `CLASSIFIER_CONFIDENCE_FALLBACK_THRESHOLD`, and only if `OPENAI_API_KEY` is set; its absence
  never breaks analysis.
- **Object storage: S3-compatible client (`@aws-sdk/client-s3`) against MinIO locally** — the same
  client code works against real AWS S3 (or any S3-compatible provider) in production by changing
  only `S3_ENDPOINT` and credentials.
- **pgvector access is API-mediated, not direct** — `apps/ai-worker` never holds Postgres
  credentials; it calls `POST /internal/problems/search-similar` and lets `apps/api` run the raw
  `<=>` cosine-distance query. Keeps the worker's blast radius small and the DB schema in one
  place.
- **`Dev-Work/` is local-only** — gitignored at the repo root; it holds the team's original
  scratch/planning materials (problem-statement notes, an early architecture sketch) and is
  intentionally never pushed.
- **Deployment targets (unblocking, not required for the demo):** `apps/api` continues to target
  Render (matching the previous deployment already linked in `README.md`); `apps/web` targets
  Vercel rather than GitHub Pages, since the router needs SPA rewrite support that Pages doesn't
  provide out of the box.
