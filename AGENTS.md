# AGENTS.md

## Project summary

Societal Innovation Portal (SIH 2026): citizens report civic problems in
Jharkhand, AI classifies and prioritizes them, admins assign them to
universities, universities propose solutions, and industries fund them.

## Repo map

```
backend/          Express + MongoDB API (Amrit-raj50, PRs #4-#9). Own npm
                   project, not part of the pnpm workspace. See below before
                   touching anything in here.
frontend/          React + Vite frontend, built against backend/'s real API.
packages/
  shared-types/    Zod schemas mirroring backend/'s actual response shapes.
                   Consumed by frontend only.
  config/          Shared eslint/tsconfig bases.
infra/             docker-compose.yml (Mongo + Redis).
docs/              API_CONTRACT.md, ARCHITECTURE.md, TASK_BREAKDOWN.md.
```

## Setup commands

```bash
pnpm install                                        # frontend + frontend/src/schemas
cd backend && npm install && cp .env.example .env    # backend/ is separate
docker compose -f infra/docker-compose.yml up -d     # Mongo + Redis
```

## Per-app dev commands

```bash
cd backend && npm run dev     # backend, port 3000
pnpm --filter web dev         # frontend, port 5173
```

## Coding conventions

- **`backend/` stays exactly as PRs #4–#9 left it**: plain JS, CommonJS,
  Mongoose. Don't introduce TypeScript, Prisma, or a different ORM there.
  Add new files/exports rather than rewriting existing ones — see
  docs/ARCHITECTURE.md's "why this shape" for the reasoning.
- **`frontend`**: TypeScript strict mode, ESLint + Prettier from
  `frontend`, no `any`, Zod-validated forms using
  `frontend/src/schemas`.
- Any endpoint change updates `docs/API_CONTRACT.md` and
  `frontend/src/schemas` in the same PR.

## Testing

- `frontend`, `frontend/src/schemas`: `pnpm test` (Vitest).
- `backend/`: currently a stub (`npm test` always exits 1) — see
  docs/TASK_BREAKDOWN.md.

## Branch naming

`feat/<surface>-<short-desc>`, e.g. `feat/be-refresh-tokens`,
`fix/ai-priority-scoring`, `feat/fe-photo-upload`.

## Commit style

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

## Environment variables

- `backend/.env.example` — copy to `backend/.env`, fill in real values.
- `frontend/.env.example` — copy to `frontend/.env`.
- Never commit a real `.env`.

## Do NOT

- Don't restructure or delete anything under `backend/` without discussing
  it first — it's a teammate's already-merged, working code.
- Don't hardcode `INTERNAL_API_KEY` or `JWT_SECRET`.
- Don't bypass Zod validation in `frontend`.
- Don't push directly to `main`.
