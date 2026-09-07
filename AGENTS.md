# AGENTS.md — Societal Innovation Portal

Instructions for any AI coding agent (Claude Code, Antigravity, Cursor, etc.) working in this repo.

## Project summary

A civic-issue reporting platform for Jharkhand (SIH 2026). Citizens report problems with photos
and location; an AI worker classifies category/priority and flags duplicates; admins route
problems to universities; universities propose solutions; industries fund them — with every step
visible in real time. Full detail: [docs/PRD.md](docs/PRD.md).

## Repo map

```
sih2026-portal/            (this repo root)
├── apps/
│   ├── web/                # React + Vite + Tailwind + shadcn — Frontend team (FE-1, FE-2)
│   ├── api/                 # Node + Express + TS — Backend team (BE-1, BE-2)
│   └── ai-worker/           # Node + TS BullMQ worker — AI team (AI-1, AI-2)
├── packages/
│   ├── shared-types/         # Zod schemas + TS types — the API contract in code, imported by all 3 apps
│   └── config/               # Shared eslint / tsconfig / prettier bases
├── infra/
│   ├── docker-compose.yml    # Postgres (+pgvector), Redis, MongoDB, MinIO — local dev only
│   └── k8s/                  # Placeholder, not used for the hackathon
├── docs/
│   ├── PRD.md                 # Product requirements — read this first
│   ├── API_CONTRACT.md        # Human-readable API/socket/queue contract
│   ├── openapi.yaml            # Machine-readable twin of API_CONTRACT.md
│   ├── ARCHITECTURE.md         # System diagram, stack choices, data model
│   ├── TASK_BREAKDOWN.md       # Per-member ticket list
│   └── DEMO_DATA.md            # Seed data plan for the SIH demo
├── AGENTS.md                 # This file
├── CONTRIBUTING.md           # PR / branch workflow
└── .github/
    ├── workflows/ci.yml       # Lint, typecheck, test, build — per app
    └── PULL_REQUEST_TEMPLATE.md
```

> **Status note:** the full scaffold described above exists — `apps/web`, `apps/api`,
> `apps/ai-worker`, `packages/*`, and `infra/docker-compose.yml` all have working, non-placeholder
> code covering the MVP flows in `docs/PRD.md` §4.1. What's *not* filled in yet is the "nice to
> have" list (PRD §4.3) and anything a ticket in `docs/TASK_BREAKDOWN.md` still shows unchecked —
> pick those up as the team starts.

## Setup commands

```bash
pnpm i                       # install all workspaces
docker compose -f infra/docker-compose.yml up -d   # Postgres, Redis, Mongo, MinIO
pnpm dev                     # run every app in parallel (once apps/ exists)
```

## Per-app dev commands

```bash
pnpm --filter web dev
pnpm --filter api dev
pnpm --filter ai-worker dev
pnpm --filter @sih/shared-types build   # rebuild the shared contract package
```

(Package names inside `apps/*` are expected to be `web`, `api`, `ai-worker`; `packages/*` are
scoped `@sih/*` — see each `package.json` once scaffolded.)

## Coding conventions

- TypeScript **strict mode** everywhere (`packages/config/tsconfig.base.json` — already enforces
  `strict`, `noUnusedLocals`, `noUncheckedIndexedAccess`).
- ESLint + Prettier from `packages/config` (`eslint.base.js` for Node apps, `eslint.react.js` for
  `apps/web`). Don't hand-roll a different config per app.
- **No `any`** — enforced as an ESLint error (`@typescript-eslint/no-explicit-any`), not just a
  guideline.
- **Every API route validates its input with a Zod schema from `@sih/shared-types`** before the
  handler touches it. Never trust `req.body`/`req.query` directly.
- Prefer named exports; one concern per file (see `packages/shared-types/src/*.ts` for the
  pattern — one domain per file, re-exported from `index.ts`).

## Testing

- Vitest across all three apps (already the choice in `packages/shared-types`).
- Run per app: `pnpm --filter <app> test`. Run everything: `pnpm test`.
- **Minimum expectation for a PR touching an API route:** a test covering at least the happy path
  and one validation-failure path for that route, plus any new Zod schema getting a unit test
  (see `packages/shared-types/src/__tests__/schemas.test.ts` for the expected shape of such a
  test file).
- AI worker: classifier/scorer/dedupe logic must be unit-testable against fixtures without a live
  Redis/Postgres connection.

## Branch naming

`feat/<surface>-<short-desc>`, e.g. `feat/be-assignment-api`, `feat/ai-dedupe-scorer`,
`feat/fe-citizen-submit-form`. Fixes: `fix/<surface>-<short-desc>`.

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`,
`test:`, `refactor:`. Scope is optional but encouraged: `feat(api): add assignment endpoint`.

## Environment variables

Each app that needs secrets ships a `.env.example` (to be added when that app is scaffolded).
Copy it to `.env` locally. **Never commit a real `.env`** — it's gitignored at the root; don't
override that per-app.

## API contract rule

Any change to `docs/API_CONTRACT.md`, `docs/openapi.yaml`, or the schemas in
`packages/shared-types` requires pinging all 6 members before merging — this is the one seam
where an unannounced change breaks three other people's in-flight work simultaneously.

## Do NOT

- Do not hardcode the Internal API secret (`INTERNAL_API_SECRET` / `x-internal-key`) anywhere —
  env var only, never a literal in source or a test fixture committed to the repo.
- Do not bypass Zod validation on an API route "just for now" — it doesn't get cleaned up later.
- Do not push directly to `main` — see [CONTRIBUTING.md](CONTRIBUTING.md) for the required PR flow.
- Do not introduce a second state-management or component library in `apps/web` beyond
  Zustand/shadcn without a team discussion — consistency matters more than any one person's
  preference here.
- Do not add a new top-level dependency to `packages/shared-types` casually — every app imports
  it, so its dependency footprint is everyone's dependency footprint.
