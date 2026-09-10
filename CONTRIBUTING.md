# Contributing

1. `git checkout main && git pull`
2. `git checkout -b feat/<surface>-<desc>`
3. Work, commit with [Conventional Commits](https://www.conventionalcommits.org/)
4. `git push origin feat/<surface>-<desc>`
5. Open a PR into `main` using `.github/PULL_REQUEST_TEMPLATE.md`
6. CI must pass before review
7. Squash-merge, delete branch

## Working in `backend/`

`backend/` is a separate npm project (not part of the pnpm workspace) — run
its own `npm install` / `npm run dev` from inside `backend/`. If your change
touches an existing exported function's behavior or an existing route's
request/response shape, call that out explicitly in the PR description and
update `docs/API_CONTRACT.md` — other people (and `frontend`) depend on it
staying accurate.

## Working in `frontend` / `frontend/src/schemas`

Standard pnpm workspace: `pnpm install` at the repo root, then
`pnpm --filter <name> <script>` or `pnpm -r <script>` to run across all of
them.

## Env setup

- `cp backend/.env.example backend/.env` and fill in real values.
- `cp frontend/.env.example frontend/.env`.
- Real `.env` files are gitignored — never commit one.
