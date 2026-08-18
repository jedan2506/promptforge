# Contributing to PromptForge

Thanks for wanting to help. This doc is short on purpose.

## Setup (5 min)

1. Node ≥ 22 and pnpm 10 (`corepack enable && corepack prepare pnpm@10.28.2 --activate`).
2. Docker for Postgres + Redis.
3. `cp .env.example .env` and set `ADMIN_API_KEY` to any random string ≥ 16 chars.
4. `make install && make dev` — brings up the stack.

Verify: `curl http://localhost:4400/api/health/ready` returns `{ "ok": true }`.

## The three checks that must pass before merge

```bash
pnpm typecheck   # tsc across every package
pnpm test        # vitest across every package that has tests
pnpm --filter @promptforge/backend run db:migrate   # migrations apply cleanly on a fresh DB
```

CI runs all three on every PR. Green CI = mergeable.

## House style

- **Small PRs.** One conceptual change per PR. `feat:` / `fix:` / `docs:` conventional-commit prefix.
- **No unrequested refactors.** Change the code that solves the task; leave the rest.
- **No code comments unless the WHY is non-obvious.** One line max. Never restate what the identifier already says.
- **Zod at every input boundary.** New routes → new schema in `shared/src/schemas.ts` → validated in the handler.
- **Migrations always via `pnpm db:generate`** after schema edits. Never hand-edit `migrations/*.sql`.
- **Prefer typed errors** — throw one of the helpers from `backend/src/lib/errors.ts` (`badRequest`, `notFound`, etc.); the global handler formats them.

## Where things live

- New API route: `backend/src/routes/`. Register it in `backend/src/server.ts`.
- New schema table: `backend/src/db/schema.ts` → `pnpm db:generate` → commit generated SQL → `pnpm db:migrate`.
- New shared type: `shared/src/schemas.ts` — imported by backend and web.
- New SDK method: `sdk/src/index.ts`. Bump `sdk/package.json` version; publish handled separately.
- New Web page: `web/src/app/`. Use the shared types, no duplicated DTOs.

## Good first issues

Look for the `good first issue` label. If none are open, ping in an issue with what you want to work on and we'll scope one for you.

## Things worth reading first

- `docs/ARCHITECTURE.md` — high-level shape and why we made the calls we did
- `docs/adrs/` — architecture decision records with alternatives considered
- `README.md` — quickstart + roadmap

Questions welcome. Bad-taste PRs are better than no PRs.
