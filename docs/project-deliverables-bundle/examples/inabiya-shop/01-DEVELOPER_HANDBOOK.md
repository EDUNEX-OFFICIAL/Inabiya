# Inabiya — Developer Handbook

Version: 1.0.0  
Date: 18 August 2026  
Who this is for: engineers, hosting staff, future vendors

Also read: [What is left](05-RESIDUAL_AND_NEXT.md) and the [Handover certificate](04-HANDOVER_CERTIFICATE.md).

This is the tech guide for the **shop**, **Commerce Ops**, and **CMS**.  
Long product rules stay in `docs/PRD.md`. Day-to-day build status stays in `docs/Memory.md`.

---

## 1. What you are taking over

| Part | What it does | URL on this server (local) |
|---|---|---|
| Shop | Browse, cart, pay (test pay), my orders | `http://127.0.0.1:3001/` |
| Commerce Ops | Orders, products, stock, customers, reports | `http://127.0.0.1:3001/admin/commerce` |
| CMS | Build marketing pages + header/footer | `http://127.0.0.1:3001/admin/cms/pages` |
| API | Backend that stores the real data | `http://127.0.0.1:4001/api/v1` |

The same code also has a journal (`/articles`) and a creator area (`/creator`). Those are not the focus of this handover pack.

- Code: `https://github.com/EDUNEX-OFFICIAL/Inabiya`
- On this VPS: `/srv/Inabiya`

---

## 2. How the system is built

Three apps work together:

1. **Web** (`apps/web`) — what people see (Next.js)
2. **API** (`apps/api`) — business rules and database (NestJS)
3. **Worker** (`apps/worker`) — background jobs (email stub, image sizes, queues)

Data:

- **Postgres** — the source of truth (orders, stock, pages)
- **Redis** — cache, rate limits, job queue (not the main database)
- **Files on disk** — uploaded images (real Amazon S3 is not wired yet)

```text
Browser
   → Web app
      → API  (/api/v1)
         → Postgres
         → Redis
         → Worker
```

Money is stored as **paise** (integer). Example: ₹199 = `19900`. Never use decimal rupees in code.

Do not mix the three looks:

| Look | Where |
|---|---|
| Soft Gift (`gift`) | Shop + Commerce Ops + CMS |
| Journal (`blog`) | Articles |
| Creator (`creator`) | Creator Collective |

Admin does **not** get a fourth look. Ops uses Soft Gift with a tighter (compact) layout.

Full architecture: `docs/Architecture.md`.

---

## 3. Locked tech (do not swap)

| Layer | Use |
|---|---|
| Language | TypeScript |
| Website | Next.js App Router |
| API | NestJS |
| Database | PostgreSQL + Prisma |
| Cache / jobs | Redis + BullMQ |
| UI | Tailwind + shadcn |
| Validation | Zod |
| Packages | pnpm |

Prisma schema lives at the **repo root**: `prisma/`. Do not add a second schema under `apps/api`.

---

## 4. Ports (easy to mix up — read this)

This machine can run **Docker production** and **local pnpm** at the same time. They use **different ports**.

| Address | What | When |
|---|---|---|
| `127.0.0.1:3001` | Website | Docker production |
| `127.0.0.1:4001` | API | Docker production |
| `127.0.0.1:3101` | Website | `pnpm dev` |
| `127.0.0.1:4101` | API | `pnpm dev` |
| `127.0.0.1:5433` | Postgres | Always (Docker) |
| `127.0.0.1:6381` | Redis | Always (Docker) |

Checks:

- Alive: `GET http://127.0.0.1:4001/api/v1/health`
- Ready (database + Redis): `GET http://127.0.0.1:4001/api/v1/ready`
- Version: `GET http://127.0.0.1:4001/api/v1/version`

The API has no useful page at `/`. Always use `/api/v1/...`.

Apps bind to **localhost only**. A public website needs Caddy in front (not finished — see doc 5).

More: `docs/PORTS.md`.

---

## 5. How to run it

Need: Node.js 20+, pnpm 8+, Docker.

```bash
cd /srv/Inabiya
cp -n .env.example .env
# Edit .env. Change JWT secrets. Never commit .env.

docker compose up -d postgres redis
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

**Production on this VPS (Docker):**

```bash
bash scripts/deploy-vps.sh
# website 3001 · API 4001 · worker
```

**Local coding (hot reload):**

```bash
pnpm dev
# website 3101 · API 4101
# Use .env.development.example. Do not overwrite the VPS .env.
```

### 5.1 Env names (not the secret values)

| Name | Meaning |
|---|---|
| `DATABASE_URL` | Postgres |
| `REDIS_URL` | Redis |
| `APP_URL` | Public website origin |
| `API_URL` / `NEXT_PUBLIC_API_URL` | API origin |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | At least 32 characters. Do not leave `change-me` |
| `COOKIE_SECURE` | Set `true` when you have https |
| `PAYMENT_PROVIDER` | `mock` until live payments |
| `RAZORPAY_*` | Empty until live. Never put the secret in the website |
| `SMTP_*` | Mail. Still a stub |
| `MEDIA_LOCAL_ROOT` | Where uploaded files sit |

### 5.2 Useful commands

| Command | What it does |
|---|---|
| `pnpm lint` / `pnpm typecheck` | Checks used in CI |
| `pnpm db:migrate` | Apply database changes |
| `pnpm db:seed` | Create test users and sample data |
| `bash scripts/deploy-vps.sh` | Build and restart Docker apps |
| `bash scripts/backup-postgres.sh` | Database backup |
| `bash scripts/dr-smoke.sh` | Test restore (does not touch live data) |

---

## 6. How we deploy

1. Push to `main`
2. GitHub Actions runs lint, format, typecheck, tests
3. The runner SSHs into this VPS
4. Code updates, Docker images build **on the VPS**, containers restart
5. Smoke: health URL + website

Manual:

```bash
FORCE_ALL=1 bash scripts/deploy-vps.sh
```

GitHub must SSH on port **2222**, not 22. If you see `Cannot reach host:port`, that is a network problem, not “missing GitHub secrets”.

Details: `docs/RUNBOOKS.md` section 11.

---

## 7. API (short map)

Base path: `/api/v1`.

If something fails, the API returns:

```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "One or more items are no longer available.",
    "details": [],
    "requestId": "req_..."
  }
}
```

Login uses email + password. Tokens go in **httpOnly cookies**. You can also send `Authorization: Bearer …`.

A short list of paths is in `docs/openapi.stub.yaml`. There is no full Swagger UI yet.

### 7.1 Always-on

| Method | Path |
|---|---|
| GET | `/health` |
| GET | `/ready` |
| GET | `/version` |
| POST | `/auth/login` |
| POST | `/auth/register` |
| POST | `/auth/refresh` |
| POST | `/auth/logout` |
| GET | `/auth/me` |

Login is limited: **20 tries per 15 minutes per IP**.

### 7.2 Shop

| Topic | Paths |
|---|---|
| Products | `GET /catalog/products`, `GET /catalog/products/:slug` |
| Cart | `/cart` (guest cart header: `x-cart-token`) |
| Checkout | `POST /checkout/preview`, `POST /checkout/place-order` |
| Test pay | `POST /checkout/payments/:paymentId/confirm` |
| My orders | `GET /orders/me`, invoice JSON + PDF |
| Public CMS page | `GET /cms/pages/:slug` (published only) |

Place-order rules (do not change casually):

1. Create the order and **reserve stock** in one database transaction
2. Order starts as `PENDING_PAYMENT`
3. Payment webhooks use a unique event id (same event twice = no second capture)
4. Paid → stock is taken. Failed pay → stock is released
5. The browser must not be trusted to say “payment succeeded”

### 7.3 Admin

| Topic | Prefix |
|---|---|
| Dashboard, reports, search, settings | `/admin/commerce/...` |
| Coupons | `/admin/commerce/coupons` |
| Customers | `/admin/commerce/customers` |
| Stock | `/admin/commerce/inventory` |
| Header/footer | `/admin/commerce/gift-chrome` |
| Tracking IDs | `/admin/commerce/tracking` (Super Admin write only) |
| Products (admin) | `/admin/catalog/...` |
| Orders (admin) | `/admin/orders/...` |
| CMS | `/admin/cms/pages` (including publish / unpublish) |
| Uploads | `/media` |

Who may call what is checked in the **API**, not only in the menu.

---

## 8. Database

- Schema file: `prisma/schema.prisma`
- Every schema change needs a **migration file** in the same change
- IDs are UUID strings
- Stock has `onHand` and `reserved`. Stock must not go below zero by accident
- Redis is not where orders live

---

## 9. Who is allowed to do what

Roles: Customer, Commerce Admin, Content Admin, Writer, SEO Editor, Medical Reviewer, Creator, Brand, Finance, Support, Super Admin.

| Action | Who |
|---|---|
| Place an order | Logged-in customer (blocked if the account is suspended) |
| Pack / ship | Commerce Admin / Super Admin. Support has a smaller set |
| Refund | Commerce + Finance as coded. This is logged |
| Publish a CMS page | Commerce Admin, Content Admin, Super Admin |
| Change Google/Meta tracking IDs | Super Admin only |

When you load an order (or similar), check **id + owner/role**. Do not trust an owner id sent by the client.

We log: publish, refund, stock change, suspend, policy change, tracking change.

---

## 10. If something breaks

Full steps: `docs/RUNBOOKS.md`. Short version:

**Backup / test restore**

```bash
bash scripts/backup-postgres.sh
bash scripts/dr-smoke.sh
```

**Change secrets**

1. Make new JWT secrets and a new DB password (32+ characters)
2. Put them in `/srv/Inabiya/.env` (not git)
3. `bash scripts/deploy-vps.sh api worker`
4. Everyone must log in again
5. Write the date in `docs/Memory.md`

**Payment stuck**

- Test path: `POST /api/v1/webhooks/payments/mock`
- Same event id must not pay twice
- If the order stays pending: read API logs. Do not add stock twice

**Job queue**

```bash
docker logs inabiya-worker --tail 200
docker exec inabiya-redis redis-cli ping
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart worker
```

Email jobs only **write to logs** today. A big queue is not a big risk until real email is on.

**Go back to an old version**

1. Note the current git commit
2. Deploy a known good commit: `bash scripts/deploy-vps.sh api web worker`
3. If a database change cannot be undone: restore the backup **first**
4. Check `/ready` and one login

**Who to call**

Primary: VPS engineer (`/srv/Inabiya`). Backup: project lead. Put real names and phones in before a public launch.

---

## 11. Security (simple)

Source: `docs/SECURITY.md`. This is **not** an outside security test.

| Topic | Today |
|---|---|
| Apps listen on localhost only | On purpose, until public Caddy |
| Login flood | Limited |
| Place-order flood | Limited |
| Security headers on API | On |
| Cookie `Secure` flag | Off on http. Turn on with https |
| Example JWT in `.env.example` | Change them in real `.env` |
| Payments | Test/mock only |
| Email | Log only |
| Cookies / ads tags | Load after the visitor accepts |

Do not put `.env` or database dumps in git. Do not log passwords, tokens, OTPs, or card numbers.

Before a public site: new secrets, https, live payments, and a real security test.

---

## 12. Login pages (keep them separate)

| Page | Path | Who may enter |
|---|---|---|
| Shop | `/login` | Customers |
| Commerce Ops | `/admin/commerce/login` | Commerce Admin, Support, Finance, Super Admin |
| CMS | `/admin/cms/login` | Content Admin, Commerce Admin, Super Admin |
| Editorial | `/admin/editorial/login` | Writer / SEO / Medical / Content / Finance / Super |
| Creator | `/creator/login` | Creator, Brand, Super Admin |
| Platform | `/admin/platform/login` | Super Admin |

Login screens do **not** show demo emails. Test users are only in `prisma/seed.ts`.

---

## 13. Quality

CI must stay green. Do not skip lint, typecheck, or tests to “make it pass”.

If you change money, stock, or access rules, add one small test.

---

## 14. Old prototype

If you find `Inabiya-emergent-ai` (old CRA / FastAPI / Mongo), use it only to remember behaviour. Do not copy that stack here.

---

## 15. Not finished in this handbook

Payments, real email, public https, real S3, outside security test, CDN — all listed in [What is left](05-RESIDUAL_AND_NEXT.md).

---

## 16. More detail (engineering docs)

| Need | File |
|---|---|
| Full product text | `docs/PRD.md` |
| Architecture | `docs/Architecture.md` |
| Coding rules | `docs/Rules.md` |
| Looks / colours | `docs/Design.md` |
| Current work | `docs/Memory.md` |
| Ops screens | `docs/COMMERCE_OPS_PANEL.md` |
| CMS blocks | `docs/CMS_PAGE_BUILDER.md` |
