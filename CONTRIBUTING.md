# Contributing — Societal Innovation Portal

This repo uses **contract-first parallel work**: all six of us build against
[`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) simultaneously, not in a backend→AI→frontend
sequence. See [AGENTS.md](AGENTS.md) for repo conventions and [docs/TASK_BREAKDOWN.md](docs/TASK_BREAKDOWN.md)
for who owns what.

## Standard workflow (single shared repo, everyone with push access)

```bash
git checkout main && git pull
git checkout -b feat/<surface>-<desc>        # e.g. feat/be-assignment-api

# ... work, committing with Conventional Commits ...
git add <specific files>                      # never `git add -A` blindly
git commit -m "feat(api): add assignment accept/decline endpoint"

git push origin feat/<surface>-<desc>
```

Then open a PR into `main` using `.github/PULL_REQUEST_TEMPLATE.md` (GitHub applies it
automatically).

1. **CI must pass** (lint, typecheck, tests, build — see `.github/workflows/ci.yml`) before
   review starts. A failing CI run is not sent for review.
2. **Needs 2 approvals:**
   - 1 teammate on the **same surface** (e.g. another Backend dev) — catches implementation bugs.
   - 1 teammate from a **different surface** (e.g. a Frontend or AI dev) — keeps everyone aware of
     the whole system and catches contract drift early.
3. **Squash-merge**, delete the branch after merge.

## If we switch to a fork/upstream model instead

(Use this instead of the shared-repo flow above only if we decide each member forks the org repo
— e.g. to keep individual GitHub activity graphs clean. Not the default; pick one model as a team
and stick to it.)

```bash
git remote add upstream https://github.com/<org>/<repo>.git
git fetch upstream
git checkout -b feat/<surface>-<desc> upstream/main

# ... work, commit ...

git push origin feat/<surface>-<desc>          # origin = your fork
git fetch upstream && git rebase upstream/main # before opening the PR
# open PR: your-fork:feat/... -> upstream:main
```

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`,
`test:`, `refactor:`, optionally scoped (`feat(web): ...`, `fix(ai-worker): ...`).

## Branch naming

`feat/<surface>-<short-desc>` / `fix/<surface>-<short-desc>`, where `<surface>` is one of
`fe`, `be`, `ai`. Examples: `feat/be-assignment-api`, `fix/ai-dedupe-threshold`,
`feat/fe-citizen-submit-form`.

## Review expectations

- Reviewers check the diff against [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md) when it touches
  a route, socket event, or queue payload — not just "does it run."
- If a PR needs to change the contract itself, that change is called out explicitly in the PR
  description (see the template's "API contract updated?" line) and the author pings all 6
  members before merging, per [AGENTS.md](AGENTS.md).
- Frontend PRs include a screenshot or short clip of the affected screen.

## Never

- Never push directly to `main`.
- Never skip CI or merge on a red build.
- Never merge your own PR without the two required approvals.
