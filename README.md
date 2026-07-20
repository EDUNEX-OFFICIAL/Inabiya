# Inabiya — Production Monorepo

Phase **0 — Platform Foundation** scaffold.

Canonical path: `/srv/Inabiya`  
Docs: `Docs/` (symlink `docs` → `Docs`) · Cursor rules: `.cursor/rules/`  
GitHub: `https://github.com/EDUNEX-OFFICIAL/Inabiya`

## Stack

| Layer      | Choice                                       |
| ---------- | -------------------------------------------- |
| Web        | Next.js App Router (`apps/web`)              |
| API        | NestJS modular monolith (`apps/api`)         |
| Worker     | BullMQ (`apps/worker`)                       |
| DB         | PostgreSQL + Prisma (`prisma/` at repo root) |
| Cache/Jobs | Redis + BullMQ                               |
| Packages   | pnpm workspaces                              |

**Prisma location:** repo-root `prisma/` (shared by api + worker). Do not add a second schema under `apps/api/prisma`.

## Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for Postgres + Redis)

## Windows-friendly boot

```bat
:: 1) Infra
cd /d C:\path\to\Inabiya
docker compose up -d postgres redis

:: 2) Env
copy .env.example .env

:: 3) Install + DB
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed

:: 4) Run (three terminals)
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

PowerShell equivalent:

```powershell
cd C:\path\to\Inabiya
docker compose up -d postgres redis
Copy-Item .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
# then: pnpm dev:api / pnpm dev:worker / pnpm dev:web
```

## Linux / macOS boot

```bash
cd /srv/Inabiya   # or your clone path
cp .env.example .env
docker compose up -d postgres redis
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev:api      # http://localhost:4001/api/v1/health
pnpm dev:worker   # enqueues + processes sample BullMQ job
pnpm dev:web      # http://localhost:3001
```

Optional extras (MinIO + Mailhog):

```bash
docker compose --profile extras up -d
```

## Local host ports

Registered in `/srv/scripts/PORT_REGISTRY.md` (localhost only):

| Bind                  | Service                              |
| --------------------- | ------------------------------------ |
| `127.0.0.1:5433`      | Postgres                             |
| `127.0.0.1:6381`      | Redis                                |
| `127.0.0.1:3001`      | Web (prod compose / or Next on host) |
| `127.0.0.1:4001`      | API (prod compose / or Nest on host) |
| `127.0.0.1:9002/9003` | MinIO (profile `extras`)             |
| `127.0.0.1:1025/8025` | Mailhog (profile `extras`)           |

## Health checks

- Liveness: `GET http://localhost:4001/api/v1/health`
- Readiness (DB + Redis): `GET http://localhost:4001/api/v1/ready`
- Version: `GET http://localhost:4001/api/v1/version`

## Deploy (VPS CI/CD)

Push to `main` → GitHub Actions **verify** (lint / format / typecheck / test) → SSH to this VPS → `git reset --hard origin/main` → **BuildKit** builds Docker images **on the VPS** → recreate containers → smoke.

```bash
# Manual / first-time on VPS
cp -n .env.example .env   # edit secrets
docker network create vps_edge 2>/dev/null || true
bash scripts/deploy-vps.sh
# or force all apps:
FORCE_ALL=1 bash scripts/deploy-vps.sh
```

Prod compose:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

GitHub repo secrets required for auto-deploy:

| Secret            | Purpose                               |
| ----------------- | ------------------------------------- |
| `VPS_HOST`        | VPS hostname/IP                       |
| `VPS_USER`        | SSH user (usually `root`)             |
| `VPS_SSH_KEY_B64` | Base64 private key (or `VPS_SSH_KEY`) |
| `VPS_PORT`        | Optional; default `22`                |

Smoke after deploy: `http://127.0.0.1:4001/api/v1/health`, `http://127.0.0.1:3001`.  
Public domain / Caddy site is not wired yet (`web` already joins `vps_edge`).

## Workspace scripts

| Script            | Purpose             |
| ----------------- | ------------------- |
| `pnpm dev:web`    | Next.js             |
| `pnpm dev:api`    | NestJS              |
| `pnpm dev:worker` | BullMQ worker       |
| `pnpm lint`       | ESLint all packages |
| `pnpm typecheck`  | `tsc --noEmit`      |
| `pnpm db:migrate` | Prisma migrate dev  |
| `pnpm db:seed`    | Seed baseline roles |

## Phase 0 scope (what is / is not built)

**Built:** monorepo boots, health/ready, Prisma foundation models, Redis, sample job, error envelope, S3 adapter stub, role seed, empty domain folders, theme route shells, Docker prod compose, VPS deploy pipeline.

**Not built:** auth, catalog, checkout, payments, editorial workflow, creator marketplace, or any product features.
