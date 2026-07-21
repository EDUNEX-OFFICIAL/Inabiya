# Inabiya — Port allocation

Canonical registry: [`/srv/scripts/PORT_REGISTRY.md`](/srv/scripts/PORT_REGISTRY.md)

## Reserved block (this VPS)

| Port | Service | When |
|------|---------|------|
| **3001** | Web (Next.js) | Docker prod only |
| **4001** | API (NestJS) | Docker prod only |
| **3101** | Web | `pnpm dev:web` / `pnpm dev` |
| **4101** | API | `pnpm dev:api` / `pnpm dev` |
| **5433** | PostgreSQL | Always (docker compose infra) |
| **6381** | Redis | Always (docker compose infra) |
| 9002/9003 | MinIO | Optional (`--profile extras`) |
| 1025/8025 | Mailhog | Optional (`--profile extras`) |

## Correct URLs

API has **no** page at `/` — use prefixed routes:

- Health: http://127.0.0.1:4001/api/v1/health (prod) or `:4101` (dev)
- Storefront: http://127.0.0.1:3001/gift (prod) or `:3101` (dev)
- Admin: http://127.0.0.1:3001/admin/commerce

## Workflows

### A — Docker prod only (VPS default)

```bash
bash scripts/deploy-vps.sh
# → 3001 / 4001
```

### B — Local dev (hot reload)

```bash
cp .env.development.example .env
docker compose up -d postgres redis   # 5433 / 6381 only
pnpm dev
# → 3101 / 4101 (prod containers can stay on 3001/4001)
```

### C — Dev without Docker prod conflict

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop api web worker
cp .env.development.example .env
pnpm dev
```

## Why EADDRINUSE happened

`pnpm dev` and `inabiya-api` Docker both tried **4001**. Split prod (3001/4001) vs dev (3101/4101) fixes this permanently.
