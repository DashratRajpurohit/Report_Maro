# API Contract

This documents `backend/`'s **actual, currently-implemented** API (PRs #4–#9
by Amrit-raj50), plus three small additive endpoints added alongside
`frontend` in this PR. It is the source of truth `frontend` and
`frontend/src/schemas` are built against — if this doc and the code
disagree, the code wins and this doc is out of date; please fix it.

Base URL: `http://localhost:3000` locally. All routes below are prefixed
with `/api` except `/health`.

Every response is JSON with a `success: boolean` field. Most error
responses look like `{ success: false, message: "..." }`; uncaught errors
(via `middleware/errorHandler.middleware.js`) look like
`{ success: false, error: { code, message } }`. `frontend`'s
`apiErrorMessage()` helper (`frontend/src/lib/apiClient.ts`) unwraps both.

## Auth (`backend/src/routes/auth.route.js`)

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| POST | `/api/auth/register` | — | `{ full_name, email, password, role?, organization? }` | `role` defaults to `citizen`. Returns `{ success, message, token, user }` — a single JWT, not a token pair. |
| POST | `/api/auth/login` | — | `{ email, password }` | Same response shape as register. |
| GET | `/api/auth/me` | Bearer | — | Returns `{ success, user }` (current user, `password_hash` excluded). |

## Problems (`backend/src/routes/problem.route.js`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/problems` | Bearer, `citizen` only | `{ title, description, location: { lat, lng, district, address? }, image_urls? }`. Enqueues a BullMQ classification job and returns 202 immediately with `{ id, title, status, created_at }`. |
| GET | `/api/problems` | Bearer | Query: `category`, `district`, `status`, `page`, `limit`. Returns `{ success, data, pagination: { page, limit, total, pages } }` — **not** a `meta` wrapper. |
| GET | `/api/problems/:id` | Bearer | Populates `submitted_by` and `assigned_university`. |
| PUT | `/api/problems/:id/assign` | Bearer, `admin` only | `{ universityId }`. Problem must be `verified`; creates a `Project` stub and notifies the university. |
| GET | `/api/problems/stats/dashboard` | Bearer, `admin` only | Redis-cached 5 min. Returns `{ success, source: 'cache'|'database', data: { total, byCategory, byStatus, byDistrict, lastUpdated } }`. |

Problem `status` values: `submitted → verified → assigned → in_progress → resolved`.
`category`: `water | road | health | other`. `priority`: `low | medium | high`.

## Projects (`backend/src/routes/project.route.js`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/projects` | Bearer | **Additive** (this PR). Query: `status`, `university_id`. |
| GET | `/api/projects/:id` | Bearer | **Additive** (this PR). |
| POST | `/api/projects/:id/proposal` | Bearer, `university` (owner only) | `{ proposal_text, budget, milestones? }`. Project must be `proposed`; moves it to `under_review`. |
| PUT | `/api/projects/:id/fund` | Bearer, `industry` only | `{ amount }`. Moves the project to `active` and the linked problem to `in_progress`. |

Project `status` values: `proposed → under_review → active → completed`.

## Users (`backend/src/routes/user.route.js` — additive, this PR)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/users?role=university` | Bearer | Added because nothing let an admin discover which users to assign a problem to, or let anyone browse partner organizations. `password_hash` always excluded. |

## Notifications (`backend/src/routes/notification.route.js`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/notifications` | Bearer | Returns `{ success, data, unreadCount }`, unread-first. |
| PATCH | `/api/notifications/:id/read` | Bearer | Marks one notification read (owner only). |
| POST | `/api/notifications/read-all` | Bearer | Marks all of the caller's notifications read. |

## Internal (`backend/src/routes/internal.route.js`)

| Method | Path | Auth | Notes |
|---|---|---|---|
| PATCH | `/api/internal/problems/:id` | `x-internal-api-key` header | Called by the AI worker (`backend/src/queue/worker.js`) with `{ category, priority, confidence, status }`. Never call this from the browser. |

## Socket.io events

Rooms: `admins`, `industry`, `university_<userId>`. A client authenticates
the handshake with `auth: { token: <jwt> }` — see
`backend/src/config/socket.js` (added in this PR; see
[ARCHITECTURE.md](./ARCHITECTURE.md) for why it was needed).

| Event | Room | Payload | Emitted from |
|---|---|---|---|
| `problem_verified` | `admins` | `{ problemId, title, category, priority }` | `internal.controller.js` |
| `problem_assigned` | `university_<id>` | `{ problemId, title, category }` | `problem.controller.js` |
| `new_proposal` | `industry` | `{ projectId, problemId, budget }` | `project.controller.js` |
| `project_funded` | `university_<id>` | `{ projectId, amount }` | `project.controller.js` |
| `project_active` | `admins` | `{ projectId, amount }` | `project.controller.js` |

## Known gaps (tracked in [TASK_BREAKDOWN.md](./TASK_BREAKDOWN.md))

- No refresh-token flow — a single JWT is issued with a 7-day expiry.
- No endpoint to list a citizen's own problems (`GET /api/problems?submitted_by=me`-style filter).
- No proposal/assignment history — the `Project` document *is* the proposal; there's no separate audit trail.
- `AuditLog` model exists but nothing writes to it yet.
- `backend/src/queue/worker.js`'s classifier is a dummy keyword-count stub — real NLP is an open AI-track ticket.
