# Demo Data — Societal Innovation Portal

What gets seeded for the SIH demo, and why, so the judges see a portal that already looks lived-in
rather than an empty shell — while the live on-stage walkthrough (PRD §3) still runs against the
real end-to-end pipeline, not canned data.

## Source of truth

`apps/api/prisma/seed.ts`, run via `pnpm db:seed` (or `pnpm bootstrap` for a clean setup: installs,
starts infra, migrates, and seeds in one command). Idempotent — every `create` is an `upsert` keyed
by a stable id or unique email, so re-running it doesn't duplicate rows.

## What's seeded

**5 organizations**, spanning the three types the portal cares about, across real Jharkhand
districts:

| Org | Type | District |
|---|---|---|
| Jharkhand Urban Development Dept. | GOVERNMENT | Ranchi |
| NIT Jamshedpur | UNIVERSITY | East Singhbhum |
| BIT Mesra | UNIVERSITY | Ranchi |
| Tata Steel Foundation | INDUSTRY | East Singhbhum |
| CMPDI CSR Cell | INDUSTRY | Ranchi |

**7 users**, one per role needed to demo every dashboard, all sharing the password `Passw0rd!`
(a hackathon-demo-only convenience — see the "Do NOT" section of [AGENTS.md](../AGENTS.md) for why
this must never happen with a real secret):

- `admin@sihportal.dev` — ADMIN
- `asha.devi@example.com`, `ravi.kumar@example.com` — CITIZEN
- `dean@nitjsr.ac.in` (NIT Jamshedpur), `research@bitmesra.ac.in` (BIT Mesra) — UNIVERSITY
- `csr@tatasteel.com` (Tata Steel), `csr@cmpdi.co.in` (CMPDI) — INDUSTRY

**6 problems**, one per `ProblemCategory` that the demo needs to showcase, each in a different
district so the map view isn't a single cluster, each pre-triaged (`status: TRIAGED`,
category/priority already set) so the admin/university/industry dashboards look populated the
moment the app opens — no dependency on `apps/ai-worker` running before a reviewer looks at it:

| Category | District | Priority |
|---|---|---|
| Water & Sanitation | Ranchi | HIGH |
| Roads & Transport | East Singhbhum | CRITICAL |
| Education | Gumla | MEDIUM |
| Healthcare | Simdega | CRITICAL |
| Electricity | Dumka | MEDIUM |
| Waste Management | Dhanbad | MEDIUM |

## What is deliberately left un-seeded

No assignments, proposals, projects, or fundings are pre-created. This is intentional: the live
demo walkthrough (PRD §3, the 5-minute judge-facing flow) performs the assign → propose → approve
→ fund sequence itself, on top of the seeded problems, so judges watch the actual state machine run
rather than a fabricated "already funded" screen. If you need a fully-funded example project for a
screenshot outside the live demo, run through that flow once locally against the seed data — don't
add a shortcut to the seed script for it.

## Live-submission demo path

The one part of the walkthrough that isn't seeded at all: on stage, submit a **new** problem as
`asha.devi@example.com` (or register fresh) so the audience watches
`SUBMITTED → PROCESSING → TRIAGED` happen for real, including the AI worker's classification,
priority score, and Socket.io push to the admin dashboard. Rehearse this specific path before demo
day — see the risk entry in [PRD.md](./PRD.md#8-risks) about live-network dependence.

## Regenerating demo data

```bash
pnpm infra:up      # if not already running
pnpm db:migrate    # first time only, or after a schema change
pnpm db:seed       # safe to re-run — upserts, doesn't duplicate
```

To wipe and start clean (drops all local data): `pnpm infra:reset && pnpm db:migrate && pnpm db:seed`.
