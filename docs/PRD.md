# Product Requirements Document — Societal Innovation Portal

**Status:** Draft for team review — Smart India Hackathon 2026
**Owner:** Whole team (this doc is the shared source of truth; edits need a PR like any other file)
**Related:** [API_CONTRACT.md](./API_CONTRACT.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [TASK_BREAKDOWN.md](./TASK_BREAKDOWN.md)

---

## 1. Problem Statement

People in Jharkhand encounter everyday civic problems — contaminated water sources, broken
roads, understaffed schools, no nearby hospital — with no channel that connects the report to
someone able to act on it. Complaints, when made at all, go to a local office by word of mouth
and disappear. There is no visibility for the citizen, no triage, and no way for a university's
student talent or an industry's CSR budget to find and fund a concrete, scoped problem.

**The Societal Innovation Portal** closes that loop: a citizen reports a problem with a photo and
location, an AI layer classifies and prioritizes it and flags duplicates, an admin routes it to a
university, the university proposes a solution with a scoped budget, and an industry funds it.
Every party can see the status change in real time.

## 2. Target Users / Personas

| Persona | Who | Primary need |
|---|---|---|
| **Citizen** | Any resident of Jharkhand, no special access needed to browse; account needed to submit | Report a problem in under a minute, see it isn't ignored |
| **Admin** | Portal operators (SIH demo: our team plays this role) | Triage the incoming stream, route it to a capable university |
| **University** | Faculty/student team at a partner institution | Find problems matching their capability, propose a scoped, budgeted solution |
| **Industry** | CSR or R&D budget holder at a partner company | Discover vetted, university-backed proposals and fund one with confidence |

## 3. Goals & Success Metrics (for the SIH demo)

The demo must show the **full loop** end-to-end, live, in front of judges, in under 5 minutes:

1. A citizen submits a real problem (with a photo) from a phone-sized viewport.
2. Within seconds, the admin dashboard shows it arrive with an AI-assigned category and
   priority — no page refresh (Socket.io).
3. Submitting a near-duplicate problem gets flagged as a duplicate, not created twice.
4. The admin assigns it to a university; the university dashboard updates live.
5. The university submits a proposal with a team and a budget.
6. The industry portal shows the proposal as fundable; funding it updates the project to
   ACTIVE and the original problem to IN_PROGRESS, visible back on the citizen's view.

**Success = that walkthrough works without a manual refresh or a hardcoded demo path.**
Secondary metrics: seeded data covers all four Jharkhand problem domains (water, roads,
education, health) across multiple districts so the map view looks real, not empty.

## 4. Scope

### 4.1 In scope (MVP, must work for the demo)

- Email/password auth with 4 roles (Citizen, Admin, University, Industry); citizens self-register,
  University/Industry accounts are pre-seeded (see [DEMO_DATA.md](./DEMO_DATA.md)) since vetting
  organizations is out of scope for a hackathon timeline.
- Citizen: submit a problem (title, description, location via map pin + district, up to 5 photos).
- Citizen: list + map view of problems, filterable by category/status/district; view own
  submissions and their status.
- AI worker: rule-based category classifier, priority scorer, pgvector duplicate detection,
  OpenAI fallback when the rule-based classifier's confidence is low.
- Admin: dashboard with live counts (by category/status/priority/district), assign a problem to
  a university.
- University: dashboard of assigned problems, accept/decline, submit a proposal (summary,
  approach, team, budget, timeline).
- Admin: review a proposal, approve (spawns a fundable project) or reject.
- Industry: browse fundable projects, pledge funding; full funding flips the project to ACTIVE
  and the source problem to IN_PROGRESS.
- Real-time notifications (bell + toast) for every state change relevant to the signed-in role.
- Seed script producing realistic Jharkhand demo data across all districts and categories.

### 4.2 Explicitly out of scope for this hackathon

- Real payment processing — funding is a recorded pledge, not a transaction.
- SMS/email delivery of notifications — in-app only.
- Native mobile apps — the web app is responsive, no separate app.
- Organization self-onboarding/verification workflow — orgs are seeded/admin-created.
- Multi-language UI (Hindi/regional) — English only for MVP; noted as a fast-follow.
- Fine-grained RBAC beyond the 4 roles (e.g. per-department admin scoping).
- Production-grade content moderation on photos/text beyond basic profanity/spam filtering.
- Offline support / PWA.

### 4.3 Nice to have (build only if MVP is done early)

- Recharts trend charts on the admin dashboard beyond the flat counts.
- CSV export of problems for the admin.
- Comment thread on a problem between citizen and assigned university.
- Mapbox clustering for dense districts.
- OpenAI-generated proposal-summary suggestions for universities.

## 5. Key Flows (expanded from the README, with acceptance criteria)

### Flow 1 — Citizen submits a problem

1. Citizen fills the submit form: title (≥10 chars), description (≥30 chars), map pin (auto-fills
   district), optional photos (≤5, ≤8MB each, jpeg/png/webp/heic).
2. **AC:** Submitting with a description under 30 characters shows an inline validation error and
   does not hit the API.
3. On submit, the API persists the problem with status `SUBMITTED`, enqueues an analysis job, and
   responds within 500ms with the created problem (category/priority still `null`).
4. **AC:** The citizen sees the problem in "My Reports" immediately with a "Processing" badge, no
   category shown yet.
5. The AI worker classifies category + priority, checks for duplicates via pgvector, and calls the
   Internal API back.
6. **AC:** Within 10 seconds of submission (demo network conditions), the citizen's "My Reports"
   card updates live (Socket.io) to show the assigned category and priority, no refresh.
7. **AC:** If the worker's dedupe check finds a match ≥0.8 cosine similarity, the new problem's
   status becomes `DUPLICATE` and it links to the original; it does not appear in the admin's
   default triage queue.

### Flow 2 — Admin assigns a problem

1. Admin's dashboard lists `TRIAGED` problems (post-AI, non-duplicate) sorted by priority.
2. Admin picks a university from a searchable dropdown (filtered by district/category capability
   in the org's profile) and assigns.
3. **AC:** Assigning moves the problem to `ASSIGNED`, creates an `Assignment` in `PENDING`, and the
   target university's dashboard shows it in real time without a refresh.
4. **AC:** A problem cannot be assigned twice while an active (`PENDING`/`ACCEPTED`) assignment
   exists for it — the API returns 409.

### Flow 3 — University submits a proposal

1. University accepts or declines the assignment; declining returns the problem to the admin's
   queue (`TRIAGED`) for reassignment.
2. **AC:** Declining requires a reason (shown to the admin) and frees the problem within the same
   request — no orphaned `PENDING` assignment left behind.
3. On accept, the university fills a proposal: title, summary (≥50 chars), approach (≥50 chars),
   ≥1 team member, budget (INR), timeline (weeks).
4. **AC:** A proposal cannot be submitted against a `DECLINED` or already-`APPROVED` assignment.
5. Admin reviews the proposal: approve or reject with an optional note.
6. **AC:** Approving atomically creates a `Project` (status `AWAITING_FUNDING`) linked to the
   proposal and problem, and notifies every Industry-role account in real time.

### Flow 4 — Industry funds a project

1. Industry browses `AWAITING_FUNDING`/`ACTIVE` projects, filterable by category/district/budget.
2. Industry pledges an amount against a project.
3. **AC:** A pledge exceeding the remaining unfunded budget is rejected (409) rather than silently
   capped.
4. **AC:** When cumulative funding reaches the budget, the project auto-flips to `ACTIVE` and the
   source problem to `IN_PROGRESS`, and the original citizen receives a notification.
5. **AC:** The project's funding ledger (who funded how much, when) is visible to any signed-in
   user viewing the project detail page.

## 6. User Stories (condensed; full AC lives in section 5 and the API contract)

- *As a Citizen*, I can report a problem with a photo and location in under a minute, and see its
  status change without refreshing.
- *As a Citizen*, I can browse other reported problems on a map to see what's already known.
- *As an Admin*, I see incoming problems ranked by AI-assigned priority, and can assign each to a
  capable university in two clicks.
- *As an Admin*, I can see aggregate stats (by category, district, status) at a glance.
- *As a University*, I see problems assigned to me, can accept/decline, and submit a scoped
  proposal with a team and budget.
- *As an Industry*, I can browse vetted proposals and fund the one that matches my CSR focus area,
  and see exactly where the money is going.
- *As any signed-in user*, I get a real-time notification when something I care about changes.

## 7. Assumptions

- The hackathon demo runs against seeded data plus a handful of live submissions made on stage —
  not real user-generated traffic at scale. Performance targets are "feels instant in a demo,"
  not load-tested for production volume.
- University and Industry organizations are trusted and pre-vetted (seeded by the admin); the
  portal does not need an onboarding/KYC flow.
- One AI worker instance is sufficient; horizontal scaling of the queue consumer is a documented
  future step, not built now.
- OpenAI API access (a fallback path, not the primary classifier) may not be available during the
  offline demo; the rule-based classifier must work standalone with zero external calls.
- Judges will look at the code, not just the demo — so contract discipline and clean seams matter
  as much as the happy path.

## 8. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Contract drifts between FE/BE/AI mid-build | Integration breaks late | `packages/shared-types` is the single source of truth; CI checks the API against `docs/openapi.yaml` (see [ARCHITECTURE.md](./ARCHITECTURE.md)) |
| Live demo depends on network (Socket.io, Mapbox tiles, DB) | Demo fails on bad venue wifi | Rehearse on a hotspot; seed enough data that a frozen network still shows a populated, plausible-looking UI |
| pgvector dedupe threshold miscalibrated | Either misses real dupes or flags unrelated problems | Tunable `minScore` (default 0.8) behind a constant in `shared-types`; validate against seed data before demo day |
| 6 people, ~short timeline, first time working this contract-first | Scope creep past MVP | Section 4.2/4.3 are the guardrail; anything not in 4.1 does not get built before MVP is demo-ready |
| OpenAI fallback costs/availability | Blocked worker on a bad demo day | Fallback is optional by design (env-flag gated); rule-based path never depends on it |

## 9. Open Questions

See the end of this response for the consolidated list across all docs — they are collected once
rather than repeated per file.
