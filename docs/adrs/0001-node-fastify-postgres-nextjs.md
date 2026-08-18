# ADR-0001: Node/Fastify + Postgres + Next.js

**Status**: accepted
**Date**: 2026-08-14

## Context

Need to pick a stack for PromptForge that:

- Feels **industry-standard** — nothing exotic that scares contributors.
- Ships **v0.1 fast** (~3-4 weeks solo).
- **Types end-to-end** with a single source of truth.
- Deploys **cheaply** and self-hostably.
- Has a **healthy contributor pool** for an OSS project.

## Options considered

| Stack                          | Pros                                                  | Cons                                                             |
| ------------------------------ | ----------------------------------------------------- | ---------------------------------------------------------------- |
| **Go/Gin + Postgres + Next.js**| Single binary, sub-10MB memory, ops-friendly          | Two languages in the repo, slower iteration, smaller contributor overlap |
| **Node/Fastify + Postgres + Next.js** ✅ | One language across FE/BE/SDK, huge contributor pool, Drizzle gives typed SQL, Zod schemas cross packages | Higher memory than Go, GC pauses possible under high load |
| Rust/Axum                      | Screaming fast, memory-safe                           | Massive learning curve for contributors, slow iteration          |
| Python/FastAPI                 | Familiar to ML teams                                  | Weaker types across boundaries, no cheap shared schemas          |

## Decision

**Node 22 + Fastify + Drizzle + Postgres + Next.js 15 + Tailwind v4.**

Rationale:

- The whole repo speaks TypeScript. `shared/` is a real workspace package with Zod schemas imported by backend for validation and by web for types — no drift possible.
- Contributor pool is enormous. A JS developer can grok the repo in an evening.
- Drizzle + Zod is the best-in-class typed SQL / typed validation combo right now — nothing runtime-magical.
- Fastify is faster than Express, has better typing, and its plugin model matches our layered architecture cleanly.
- Postgres is the boring correct default. Migrations via drizzle-kit.
- Ops story: single container per service, deploy to Fly.io / Render / Railway. Volume-backed Postgres. Nothing exotic.

## Consequences

**+** Fast v0.1 iteration; every layer type-safe; SDK trivial to write in the same language.
**+** Familiar to most OSS contributors; low barrier to first PR.
**+** Zod schemas doubly-useful: request validation + shared TS types.
**–** Node memory footprint > Go (~50-80 MB vs ~10-20 MB for a Gin service of the same shape). Fine at PromptForge scale; would revisit at 10K+ QPS.
**–** ESM-only backend (Node 22, `type: module`, `.js` extensions on imports) adds mild friction for contributors who grew up on CommonJS.

## Follow-ups

- If server-side load grows past what a $10/mo VM handles, consider extracting the eval-runner worker into Go — it's a natural microservice boundary.
- If the JVM crowd asks for a Java SDK: TypeScript client stays canonical; port only if there's contributor pull.
