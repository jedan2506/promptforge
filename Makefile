.PHONY: help dev up down logs install migrate reset test typecheck lint build clean

help:
	@echo "PromptForge — make targets"
	@echo "  make install    Install workspace deps (requires pnpm 10)"
	@echo "  make up         Start Postgres + Redis in docker"
	@echo "  make down       Stop docker services (keeps volumes)"
	@echo "  make migrate    Apply DB migrations"
	@echo "  make dev        Start backend + web in watch mode"
	@echo "  make test       Run all tests"
	@echo "  make typecheck  Typecheck all packages"
	@echo "  make lint       Lint all packages"
	@echo "  make build      Production build all packages"
	@echo "  make reset      Nuke DB volume + reapply migrations (destructive)"
	@echo "  make logs       Tail docker logs"

install:
	pnpm install

up:
	docker compose up -d
	@echo "Waiting for Postgres…"
	@until docker compose exec -T postgres pg_isready -U promptforge >/dev/null 2>&1; do sleep 1; done
	@echo "Ready. Postgres :5434  Redis :6380"

down:
	docker compose down

logs:
	docker compose logs -f

migrate:
	pnpm --filter @promptforge/backend run db:migrate

dev: up migrate
	pnpm -r --parallel run dev

test:
	pnpm -r run test

typecheck:
	pnpm -r run typecheck

lint:
	pnpm -r run lint

build:
	pnpm -r run build

reset:
	docker compose down -v
	docker compose up -d
	@until docker compose exec -T postgres pg_isready -U promptforge >/dev/null 2>&1; do sleep 1; done
	pnpm --filter @promptforge/backend run db:migrate

clean:
	rm -rf node_modules */node_modules */dist */.next
