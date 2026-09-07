## Linked issue / ticket

Closes #<!-- issue number, or link to the docs/TASK_BREAKDOWN.md item -->

## What changed

<!-- 2-5 bullet points. What, and briefly why. -->

-
-

## Screenshots (frontend changes)

<!-- Drag in before/after screenshots or a short clip. Delete this section for non-UI PRs. -->

## API contract updated?

- [ ] Yes — I updated `docs/API_CONTRACT.md` / `docs/openapi.yaml` / `packages/shared-types`
      **and** pinged all 6 members before requesting review (per AGENTS.md).
- [ ] No — this PR doesn't change any request/response/event shape.

## Tests

- [ ] Added/updated tests covering this change (happy path + at least one failure/validation path
      for API routes).
- [ ] Existing tests pass locally (`pnpm test`).

## Breaking change?

- [ ] Yes — describe what breaks and who needs to update their code below.
- [ ] No.

## Checklist

- [ ] `pnpm lint` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes for every app this PR touches
- [ ] No `any` introduced
- [ ] No secrets committed (checked `.env`, API keys, the internal API secret)
