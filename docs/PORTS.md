# Inabiya — Port allocation

Canonical registry: [`/srv/scripts/PORT_REGISTRY.md`](/srv/scripts/PORT_REGISTRY.md)  
VPS rules: [`/srv/VPS_MULTI_PROJECT_GUIDELINE.md`](/srv/VPS_MULTI_PROJECT_GUIDELINE.md)

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
docker compose up -d postgres redis   # 5433 / 6381 only (already up on VPS)
pnpm dev
# → 3101 / 4101 — script forces these so Docker prod can stay on 3001/4001
# Do not copy `.env.development.example` over VPS `.env` (prod APP_URL lives there)
```

### C — Dev without Docker prod conflict

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml stop api web worker
pnpm dev
```

## GitHub Actions deploy SSH

`Build and deploy VPS` SSHes from **GitHub-hosted** `ubuntu-latest` into this machine, then runs `scripts/deploy-vps.sh`.

- App ports stay loopback (`3001`/`4001`). SSH is the only inbound the runner needs.
- **Do not use port 22 from Actions.** Many GitHub runner IPs cannot TCP `:22` on this VPS (ISP filter). `sshd` listens on **`2222`** as well (`ufw` comment `ssh-alt-isp-bypass`; host registry).
- Workflow maps empty/`22` `VPS_PORT` → **`2222`**. Repo secrets (`VPS_HOST` / `VPS_USER` / key) have been set since first deploy — a `Cannot reach ***:***` log is that TCP check, not missing tokens.
- VPS `gh` PAT: local git/GitHub API. Unrelated to runner → VPS reachability.

## Why EADDRINUSE happened

`pnpm dev` and `inabiya-api` Docker both tried **4001**. Split prod (3001/4001) vs dev (3101/4101) fixes this permanently.
