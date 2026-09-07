# API Contract — Societal Innovation Portal

**This is the seam.** Every surface (`apps/web`, `apps/api`, `apps/ai-worker`) builds against
this document from Day 0, in parallel, without waiting on another team's implementation.

- **Machine-readable spec:** [`openapi.yaml`](./openapi.yaml) — 28 paths / 34 operations, request
  and response schemas in full. This markdown file is the narrative layer on top of it.
- **Runtime source of truth once code exists:** `packages/shared-types` (Zod). If this document,
  `openapi.yaml`, and the Zod schemas ever disagree, the Zod schemas win and the others are the
  bug — CI will enforce this (see `scripts/check-contract.mjs`, referenced in
  [ARCHITECTURE.md](./ARCHITECTURE.md)).
- **Change rule:** any change to this file or `openapi.yaml` requires pinging all 6 members before
  merging (see [AGENTS.md](../AGENTS.md)). Bump `API_CONTRACT_VERSION` in `shared-types` on any
  breaking shape change.


## Conventions

- Base path: `/api/v1`. Health check is the one exception, at `/health`.
- Auth: `Authorization: Bearer <accessToken>` (JWT, short-lived). Refresh via
  `POST /api/v1/auth/refresh` with a long-lived `refreshToken`. Socket.io authenticates the same
  access token in the handshake (`auth: { token }`).
- Success envelope: `{ success: true, data: <payload> }`. List endpoints add
  `meta: { pagination: { page, pageSize, total, totalPages } }`.
- Error envelope: `{ success: false, error: { code, message, details? }, requestId }`.
  `code` is one of `VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT |
  RATE_LIMITED | PAYLOAD_TOO_LARGE | INTERNAL_ERROR | SERVICE_UNAVAILABLE`. The UI switches on
  `code`, never on `message`.
- All input validated with Zod at the route boundary; no unvalidated field reaches a handler.
- IDs are opaque strings. Dates are ISO-8601 with offset.
- Pagination: `?page=1&pageSize=20` (max `pageSize` 100) on every list endpoint.

## Enums (shared vocabulary — never redeclare these string literals elsewhere)

| Enum | Values |
|---|---|
| `UserRole` | `CITIZEN`, `ADMIN`, `UNIVERSITY`, `INDUSTRY` |
| `OrganizationType` | `UNIVERSITY`, `INDUSTRY`, `GOVERNMENT` |
| `ProblemCategory` | `WATER_SANITATION`, `ROADS_TRANSPORT`, `EDUCATION`, `HEALTHCARE`, `ELECTRICITY`, `WASTE_MANAGEMENT`, `AGRICULTURE`, `PUBLIC_SAFETY`, `OTHER` |
| `Priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `ProblemStatus` | `SUBMITTED` → `PROCESSING` → `TRIAGED` → (`DUPLICATE` \| `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`) \| `REJECTED` |
| `AssignmentStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `COMPLETED` |
| `ProposalStatus` | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` |
| `ProjectStatus` | `AWAITING_FUNDING`, `ACTIVE`, `COMPLETED`, `CANCELLED` |
| `NotificationType` | `PROBLEM_ANALYZED`, `PROBLEM_ASSIGNED`, `PROBLEM_STATUS_CHANGED`, `PROPOSAL_SUBMITTED`, `PROPOSAL_REVIEWED`, `PROJECT_FUNDED` |

Jharkhand's 24 districts are the closed set for `district` fields (full list in
`shared-types/enums`, e.g. `Ranchi`, `Dhanbad`, `East Singhbhum`, `Palamu`, …).

## Endpoint summary

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /health` | none | Liveness + Postgres/Redis/Mongo dependency status |
| `POST /api/v1/auth/register` | none | Create CITIZEN/UNIVERSITY/INDUSTRY account (org id required for the latter two) |
| `POST /api/v1/auth/login` | none | Get a token pair |
| `POST /api/v1/auth/refresh` | none (refresh token) | Rotate access token |
| `POST /api/v1/auth/logout` | bearer | Revoke a refresh token |
| `GET /api/v1/auth/me` | bearer | Current user |
| `GET /api/v1/problems` | optional | List/search/filter/map-bbox problems |
| `POST /api/v1/problems` | CITIZEN | Submit a problem; enqueues AI analysis |
| `GET /api/v1/problems/:id` | optional | Problem detail incl. AI analysis |
| `PATCH /api/v1/problems/:id/status` | ADMIN | Manual status override |
| `GET /api/v1/organizations` | optional | Universities/industries for pickers |
| `POST /api/v1/uploads/presign` | bearer | Presigned PUT URL for a problem photo |
| `GET/POST /api/v1/assignments` | ADMIN (post), bearer (get) | List / create assignments |
| `GET /api/v1/assignments/:id` | bearer | Assignment detail |
| `PATCH /api/v1/assignments/:id` | UNIVERSITY (owner) | Accept / decline / complete |
| `GET/POST /api/v1/proposals` | bearer | List / submit proposals |
| `GET /api/v1/proposals/:id` | bearer | Proposal detail |
| `PATCH /api/v1/proposals/:id` | UNIVERSITY (owner) | Edit a draft / submit |
| `PATCH /api/v1/proposals/:id/review` | ADMIN | Approve (spawns Project) / reject |
| `GET /api/v1/projects` | optional | Fundable / active projects |
| `GET /api/v1/projects/:id` | optional | Project detail + funding ledger |
| `PATCH /api/v1/projects/:id/status` | UNIVERSITY (owner) / ADMIN | Advance / cancel |
| `GET/POST /api/v1/projects/:id/fundings` | bearer (post: INDUSTRY) | Ledger / pledge funding |
| `GET /api/v1/notifications` | bearer | Caller's notification feed |
| `GET /api/v1/notifications/unread-count` | bearer | Badge count |
| `POST /api/v1/notifications/:id/read` \| `/read-all` | bearer | Mark read |
| `GET /api/v1/stats/overview` | ADMIN | Dashboard aggregates |
| `POST /api/v1/internal/problems/search-similar` | internal key | pgvector nearest-neighbour lookup |
| `POST /api/v1/internal/problems/:id/analysis` | internal key | AI writes results back (idempotent) |
| `POST /api/v1/internal/problems/:id/failure` | internal key | AI reports a permanently failed job |

Full request/response bodies for each row are in [`openapi.yaml`](./openapi.yaml).

## The Internal API (AI ↔ Backend seam)

- Mounted at `/api/v1/internal/*`, **never** reachable from the browser (not in any CORS allowlist).
- Authenticated with a static header, not a JWT: `x-internal-key: <INTERNAL_API_SECRET>`. The
  secret lives in each app's `.env`, never committed (see [AGENTS.md](../AGENTS.md) — "Do NOT").
- `POST /internal/problems/:id/analysis` must be **idempotent**: replaying the same payload for a
  problem that already has an analysis must not create duplicate notifications or re-trigger
  Socket.io events — it returns `applied: false` on a no-op replay.
- Embeddings are fixed-width vectors of **384 dimensions** (constant `EMBEDDING_DIMENSIONS`); a
  mismatched length is a validation error, not a silently truncated one.
- `POST /internal/problems/:id/failure` exists so a problem never sits in `PROCESSING` forever if
  BullMQ exhausts its retry budget (default 3 attempts, exponential backoff) — the API returns the
  problem to `SUBMITTED` for manual admin triage.

## Queue contract (Backend ↔ AI Worker)

- Queue name: `problem-analysis`. Job name: `analyze-problem`. Both are shared constants, never
  string literals duplicated on either side.
- Job payload: `{ problemId, title, description, district, latitude, longitude,
  suggestedCategory?, submittedAt }` — enough for the worker to classify without a DB round-trip
  back to Postgres.
- Retry policy: 3 attempts, exponential backoff starting at 2s; completed jobs are pruned after 1h
  / 1000 jobs, failed jobs kept 24h for debugging.

## Socket.io events (Backend → Web)

Handshake: `auth: { token: <accessToken> }`. The server derives room membership from the JWT —
a client can never subscribe to another user's or role's room by guessing an id.

Rooms: `user:<userId>`, `role:<ROLE>`, `org:<organizationId>`, `problem:<problemId>` (joined via
the one client→server event, `subscribe:problem`, when viewing a problem's detail page).

| Event | Fired when | Delivered to |
|---|---|---|
| `problem:created` | Citizen submits | `role:ADMIN` |
| `problem:analyzed` | AI callback lands | reporter (`user:`), `role:ADMIN`, `problem:<id>` room |
| `problem:status_changed` | Any status transition | reporter, `problem:<id>` room |
| `assignment:created` | Admin assigns | target `org:<universityId>` |
| `assignment:updated` | University responds | `role:ADMIN`, problem reporter |
| `proposal:submitted` | University submits | `role:ADMIN` |
| `proposal:reviewed` | Admin approves/rejects | `org:<universityId>` |
| `project:created` | Proposal approved | `role:INDUSTRY` |
| `project:funded` | A pledge lands | `org:<universityId>`, problem reporter, `role:ADMIN` |
| `project:status_changed` | Project advances/cancels | problem reporter, `role:ADMIN` |
| `notification:new` | Any of the above, role-scoped | the specific `user:<id>` it's for |

Every payload shape is a named Zod schema (`ProblemCreatedEvent`, `ProjectFundedEvent`, …) so the
web client's socket handlers are fully typed, not `any`.

## Uploads

Photos never pass through the API as bytes. Flow: client asks
`POST /api/v1/uploads/presign` (fileName, contentType, sizeBytes ≤ 8MB, jpeg/png/webp/heic only)
→ gets a presigned `PUT` URL → uploads directly to object storage → sends only `{ key, url }`
back as part of `CreateProblemRequest.photos`. Storage backend (S3-compatible / MinIO locally) is
an infra decision, not an API-shape decision — see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Versioning

`API_CONTRACT_VERSION` (currently `1.0.0` in the draft `shared-types`) bumps on any breaking
change to a request/response shape. Additive, backward-compatible fields don't require a bump but
still need the "ping all 6" rule in [AGENTS.md](../AGENTS.md).
