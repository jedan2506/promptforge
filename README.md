# PromptForge

> Prompt registry + eval harness for LLM apps. **Git for prompts, Vitest for LLM behavior.**

Version your prompts, bind them to environments, run diffs against golden inputs before you ship. Self-hostable, MIT-licensed, single-tenant on day one.

**Status**: v0.2 — registry + eval harness + web UI shipped end-to-end. Contributions very welcome.

---

## Why

Every team shipping LLM features hacks the same three things together in a Notion doc and a Google Sheet:

1. **Where does the prompt live?** Usually a `const SYSTEM = "…"` in a file, with no history.
2. **Did the last edit break anything?** No idea — evals are usually a folder of `.py` scripts run once.
3. **How do I roll back?** git revert + redeploy the whole service.

PromptForge fixes all three:

- **Registry**: prompts live in a Postgres DB, immutable versions, addressable by hash + human tag.
- **Environments**: `prod`, `staging`, `dev` are pointers from prompt-slug → version-number. Change with one PATCH.
- **SDK**: `registry.get('my-project', 'prod', 'summary')` in your app. In-memory cache, so it's cheap.
- **Eval harness** (v0.2): run a golden set against two versions, get a pass/fail diff, gate deploys on it.

---

## Quickstart (local dev, 3 minutes)

Requirements: **Docker**, **Node ≥ 22**, **pnpm 10**.

```bash
git clone <your-fork>
cd promptforge

cp .env.example .env
# edit .env — at minimum set ADMIN_API_KEY to something random

pnpm install          # or: make install
make up               # starts Postgres + Redis in docker
make migrate          # applies schema
make dev              # backend :4400 + web :4300

open http://localhost:4300
```

Create your first project + prompt via the API:

```bash
export ADMIN=<your ADMIN_API_KEY>

curl -X POST http://localhost:4400/api/projects \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"slug":"acme","name":"Acme","description":"Test project"}'

curl -X POST http://localhost:4400/api/projects/acme/prompts \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"slug":"summarize","name":"Summarize doc"}'

curl -X POST http://localhost:4400/api/projects/acme/prompts/summarize/versions \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"system":"You summarize.","user":"Doc: {{doc}}","tier":"haiku","message":"initial"}'

curl -X POST http://localhost:4400/api/projects/acme/environments/prod/bindings \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"promptSlug":"summarize","versionNumber":1}'

# fetch via SDK-style endpoint
curl http://localhost:4400/api/projects/acme/environments/prod/prompts/summarize \
  -H "Authorization: Bearer $ADMIN"
```

---

## Architecture

Two services + SDK + shared schemas, all TypeScript, all industry-standard.

```
promptforge/
├── shared/                       Zod schemas + TS types — single source of truth
├── backend/                      Fastify + Drizzle + Postgres
│   └── src/
│       ├── config (env.ts)       zod-validated env
│       ├── db/                   schema + migrations + client
│       ├── repositories/         data layer — routes NEVER touch db directly
│       ├── routes/               thin HTTP handlers
│       ├── plugins/              Fastify plugins (auth)
│       ├── lib/                  typed errors, api-key crypto
│       └── server.ts             bootstrap + error mapping
├── web/                          Next.js 15 + Tailwind v4 + next-themes
│   └── src/
│       ├── app/                  App Router routes
│       ├── components/
│       │   ├── layout/           Navbar, Footer, SiteBackground, ThemeProvider/Toggle
│       │   ├── ui/               Card, Button, PageHeader
│       │   └── motion/           Reveal (framer-motion)
│       ├── services/             typed API calls, one file per domain
│       ├── lib/                  apiClient (single fetch wrapper), cn
│       ├── config/               env + site constants
│       ├── constants/            nav, defaults — never inline
│       ├── types/                mirrors backend DTOs
│       └── styles/
│           ├── theme.css         :root (light) + .dark tokens (complete matching sets)
│           └── app.css           shared snake_case classes (aurora bg, containers)
├── sdk/                          @promptforge/client — zero-dep TS SDK
├── docs/                         ARCHITECTURE.md + adrs/
└── .github/workflows/            CI: typecheck, test, migrations, docker build
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for depth and [docs/adrs/](docs/adrs/) for design decisions.

**Backend routes** (all under `/api`):

| Method | Path                                                                        | Scope   |
| ------ | --------------------------------------------------------------------------- | ------- |
| GET    | `/health/live`, `/health/ready`                                             | public  |
| GET    | `/projects`                                                                 | read    |
| POST   | `/projects`                                                                 | admin   |
| GET    | `/projects/:slug`                                                           | read    |
| DELETE | `/projects/:slug`                                                           | admin   |
| GET    | `/projects/:slug/prompts`                                                   | read    |
| POST   | `/projects/:slug/prompts`                                                   | write   |
| GET    | `/projects/:slug/prompts/:promptSlug`                                       | read    |
| DELETE | `/projects/:slug/prompts/:promptSlug`                                       | admin   |
| GET    | `/projects/:slug/prompts/:promptSlug/versions`                              | read    |
| POST   | `/projects/:slug/prompts/:promptSlug/versions`                              | write   |
| GET    | `/projects/:slug/environments/:env/prompts/:promptSlug`                     | read    |
| POST   | `/projects/:slug/environments/:env/bindings`                                | write   |
| GET    | `/keys`                                                                     | admin   |
| POST   | `/keys`                                                                     | admin   |
| DELETE | `/keys/:id`                                                                 | admin   |
| GET    | `/projects/:p/prompts/:pr/evals`                                            | read    |
| POST   | `/projects/:p/prompts/:pr/evals`                                            | write   |
| DELETE | `/projects/:p/prompts/:pr/evals/:setSlug`                                   | admin   |
| GET    | `/projects/:p/prompts/:pr/evals/:setSlug/items`                             | read    |
| POST   | `/projects/:p/prompts/:pr/evals/:setSlug/items`                             | write   |
| DELETE | `/projects/:p/prompts/:pr/evals/:setSlug/items/:itemId`                     | admin   |
| GET    | `/projects/:p/prompts/:pr/evals/:setSlug/runs`                              | read    |
| POST   | `/projects/:p/prompts/:pr/evals/:setSlug/runs`                              | write   |
| GET    | `/projects/:p/prompts/:pr/evals/:setSlug/runs/:runId`                       | read    |

**Auth**: Bearer token (`Authorization: Bearer pf_...`). `ADMIN_API_KEY` from env grants full access; DB-stored keys can be scoped to `read` / `write` / `admin` and (optionally) a specific project.

**Database**: Postgres 16. Migrations via Drizzle Kit (`pnpm db:generate` after schema edits, `pnpm db:migrate` to apply).

---

## Industry-standard practices we follow

- **Type-safe end to end**: Zod schemas in `shared/` are the source of truth for API + SDK + web.
- **Migrations always through drizzle-kit** — never hand-write SQL migrations.
- **Health probes split**: `/health/live` (process up) vs `/health/ready` (DB reachable) for correct k8s / LB integration.
- **Rate limiting** per API key (or IP if unauth), Redis-ready.
- **Helmet + CORS** on every response.
- **Structured logs** via pino, `LOG_LEVEL` env-tunable, human-readable in dev via pino-pretty.
- **Graceful shutdown** on SIGINT/SIGTERM: drain connections, close DB.
- **API keys hashed at rest** (SHA-256); plaintext returned once at creation. Same pattern as Stripe.
- **Errors as a typed envelope**: `{ error: { code, message, details? } }` uniformly. Zod validation errors auto-map to 400.
- **CI** runs typecheck + tests + migrations + docker build on every PR.
- **Multi-stage Docker** for a small production image (Node 22 slim base).
- **Frontend theme**: `theme.css` holds ALL color tokens as CSS variables in `:root` + `.dark`. Nothing hardcodes hex — every color is a token, both light and dark are first-class.
- **snake_case theme classes** in `app.css` (`site_bg`, `aurora_blob`, `container_page`, `text_gradient`) so they can never collide with Tailwind's kebab-case utilities.
- **FE ↔ BE goes through `services/`** — every domain has one file of typed API calls; components never call `fetch` directly.
- **Continuous animated background** — one `SiteBackground` component owns the aurora effect; no per-section glow that clips at edges.

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/adrs/](docs/adrs/) for design decisions.

---

## Roadmap

- **v0.1** — Registry: projects, prompts, versions, environment bindings, SDK.
- **v0.2** *(current)* — Web UI for authoring + version diff, API-key management (`/keys`), eval harness (golden sets, 4 graders including LLM-judge, provider fallback Anthropic ↔ OpenAI, run history with pass/fail + tokens + cost).
- **v0.3** — Cost caps enforced against real Postgres ledger, batch/async run mode via BullMQ (Redis).
- **v0.4** — User accounts + orgs (currently single-tenant with API-key admin).
- **v1.0** — A/B routing between versions with statistical significance testing.

---

## Contributing

We especially want help with: **eval harness design**, **web UI/UX**, **SDK for languages beyond TS** (Python, Go, Ruby), and **provider adapters** (Google, Azure, Bedrock, Ollama).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and [good-first-issue label on the repo](https://github.com/).

## License

MIT
