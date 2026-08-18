# PromptForge Architecture

**Style**: two separate services (backend + web) speaking JSON over HTTP, plus a TS SDK and a shared schema package. Structured, honestly boring, industry-standard.

## Services

### Backend — `@promptforge/backend`

Layered:

```
config       -> env.ts                    zod-validated env
db           -> schema.ts, index.ts       Drizzle schema, postgres-js client, migrate script
repositories -> {project,prompt,binding,apiKey}Repository.ts   thin data layer, no HTTP concerns
routes       -> health.ts, projects.ts, prompts.ts             Fastify handlers, thin
plugins      -> auth.ts                   Fastify plugin: Bearer token auth, scopes
lib          -> errors.ts, apiKey.ts      typed AppError + API key crypto
server.ts    -> Fastify bootstrap, plugin registration, error mapping
```

Routes never touch `db` directly — always via a repository. Auth is a plugin that decorates `req.auth` in a `preHandler` hook. Errors thrown as `AppError` subclasses are mapped to a uniform `{ error: { code, message, details? } }` envelope by the global handler.

**Database**: Postgres 16. Drizzle ORM for typed access, Drizzle Kit for migrations.

### Web — `@promptforge/web`

Next.js 15 (App Router) + Tailwind v4 + next-themes.

```
src/
  app/           routes (App Router)
  components/
    layout/      Navbar, Footer, SiteBackground, ThemeProvider, ThemeToggle
    ui/          Card, Button, PageHeader (small, reusable)
    motion/      Reveal (framer-motion wrappers)
  services/      typed API calls (one file per domain — projectService, promptService)
  lib/           apiClient (single fetch wrapper), cn (classnames)
  config/        env.ts (one source of truth for envs + site strings)
  constants/     navConstants, defaultsConstants (never inline)
  types/         api.ts (mirrors backend DTOs)
  styles/
    theme.css    :root (light) + .dark tokens — complete matching color set
    app.css      shared snake_case classes (aurora background, container_page, gradients)
```

**FE ↔ BE**: only via `services/*` calling `lib/apiClient.ts`. Base URL from `config/env.ts`. Every call returns `ApiResult<T>` (`{ success, data?, error? }`) — components check `result.success` before rendering data.

**Theme**: `theme.css` holds ALL color tokens in `:root` (light) and `.dark`. `globals.css` exposes them to Tailwind via `@theme inline` so utilities like `bg-surface`, `text-accent`, `border-border` work. `next-themes` toggles the `.dark` class. Nothing else needs to know which theme is active.

**Backgrounds**: one continuous `SiteBackground` renders three `aurora_blob` gradients with `mix-blend-mode: screen` and slow keyframe drift — sits fixed behind everything, animation respects `prefers-reduced-motion`.

### SDK — `@promptforge/client`

Zero-runtime-dep client (`fetch`-based). One method: `registry.get(project, env, prompt)` → `PromptVersion` with a per-key in-memory TTL cache.

### Shared — `@promptforge/shared`

Zod schemas + inferred TS types. Consumed by backend for request validation and by web for API types. Single source of truth for the shape of the world.

## Auth model

- **Admin API key** — set via `ADMIN_API_KEY` env, treated as super-user, useful for bootstrap and CI. Compared via constant-time equality.
- **DB-stored keys** — created via API, `sha256`-hashed at rest, plaintext returned once. Scoped `read` / `write` / `admin`. Optionally bound to a single project (`project_id` on the key row).
- Every mutation runs through `requireScope` + `requireProjectAccess` guards.

## Error handling

- All backend errors are either `AppError` (status + code + message + details) or a bare `Error` (mapped to 500 `internal`).
- `ZodError` from request-body validation maps to `400 validation_error` automatically.
- The web SDK never throws — everything is `{ success, data?, error? }`. Components branch on `result.success`.

## What's NOT in v0.1

- User accounts / orgs (planned v0.4). Single-tenant with API keys today.
- Eval runner (planned v0.2). Storage exists conceptually but no worker yet.
- Web UI for editing prompts (planned v0.3). Read-only project list today.

See `docs/adrs/` for individual decisions.
