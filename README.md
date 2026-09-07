# Societal Innovation Portal — SIH 2026

A civic-issue reporting platform for Jharkhand: citizens report problems (water, roads, schools,
health, and more), an AI worker classifies and prioritizes them, admins route them to
universities, universities propose solutions, and industries fund them — with every step visible
in real time.

Start with [AGENTS.md](AGENTS.md) for the repo map and dev commands, or
[docs/PRD.md](docs/PRD.md) for the full product spec.

## Quick start

```bash
pnpm i
pnpm infra:up                          # Postgres+pgvector, Redis, MongoDB, MinIO
cp apps/api/.env.example apps/api/.env
cp apps/ai-worker/.env.example apps/ai-worker/.env
cp apps/web/.env.example apps/web/.env
pnpm db:migrate
pnpm db:seed                            # demo data — see docs/DEMO_DATA.md
pnpm dev                                # web :5173, api :4000, ai-worker (queue consumer)
```

Seeded accounts (see [docs/DEMO_DATA.md](docs/DEMO_DATA.md)) all share the password `Passw0rd!`:
`admin@sihportal.dev`, `asha.devi@example.com` (citizen), `dean@nitjsr.ac.in` (university),
`csr@tatasteel.com` (industry).

## Docs

- [docs/PRD.md](docs/PRD.md) — product requirements, personas, scope, flows
- [docs/API_CONTRACT.md](docs/API_CONTRACT.md) / [docs/openapi.yaml](docs/openapi.yaml) — the API contract
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — system design and stack rationale
- [docs/TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md) — per-member tickets
- [docs/DEMO_DATA.md](docs/DEMO_DATA.md) — what's seeded and why
- [CONTRIBUTING.md](CONTRIBUTING.md) — branch/PR workflow

## Live links (previous deployment — being replaced by this monorepo)

| Platform | Link |
|---|---|
| 🖥️ Project / Frontend | https://amrit-raj50.github.io/PS/ |
| ⚙️ Backend API | https://report-maro-c8m1.onrender.com/ |
