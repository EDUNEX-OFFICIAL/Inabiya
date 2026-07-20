# Inabiya
# Memory — Living Engineering Context

Version: 2.0.0

Status: Active (living document — update every session)

Document Owner: Active implementer (human or AI must keep this current)

Audience:
Engineers
AI Coding Assistants
Tech Leads
QA

Last Updated: July 20, 2026 (VPS session — docs path + Phase 0 scaffold sync)

---

## 1. Why this file exists

`Memory.md` is the **working brain** for implementation continuity.

It prevents:

- Rework across chats/tools
- Re-reading 9k+ line PRD every session just to know “where we are”
- Silent phase skipping
- Lost decisions and blockers

It is **not** a second PRD. Keep entries concise, dated, and true.

### Session protocol (mandatory)

**Start**

1. Read this file
2. Confirm Active Phase
3. Open only relevant PRD/Architecture/Rules/Design/Phases slices for the task

**End**

1. Update checkboxes
2. Append session log
3. Update decisions / blockers / next actions
4. Bump Last Updated

If chat and Memory disagree → ask human → sync Memory.

---

## 2. Canonical document map

| File | Role | Open when |
|---|---|---|
| `PRD.md` | Product truth (~full behavior) | Feature behavior ambiguity |
| `Architecture.md` | System structure | Boundaries, storage, events *(see caveat)* |
| `Rules.md` v2 | Stack + engineering law | Before coding |
| `Phases.md` v2 | Delivery sequence | Before choosing scope |
| `Design.md` v2 | Dual visual systems | Before UI |
| `Memory.md` v2 | Current progress | Every session |

Path: `/srv/Inabiya/Docs/` (symlink `docs` → `Docs` for Cursor rules)

---

## 3. Current snapshot (single source of “now”)

### 3.1 Active phase

| Field | Value |
|---|---|
| Phase | **0 — Platform Foundation** |
| Status | `IN PROGRESS` |
| Milestone | M0 — Foundation Ready |
| Owner | Eng |
| Target window | TBD |
| Monorepo | `/srv/Inabiya` (GitHub: `EDUNEX-OFFICIAL/Inabiya`) |

### 3.2 Locked production stack

| Layer | Choice |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| Backend | NestJS + TypeScript |
| DB | PostgreSQL + Prisma |
| Cache/Jobs | Redis + BullMQ |
| UI | Tailwind + shadcn/ui + Radix |
| Validation | Zod |
| Package mgr | pnpm workspaces |

### 3.3 Dual design reminder

- **System A Soft Gift:** `#FF6B9D` pastels, Fraunces + Plus Jakarta
- **System B Creator:** forest/cream/terracotta HSL, Playfair + Manrope
- Never mix casually

### 3.4 Docs completion status

| Doc | Status | Version |
|---|---|---|
| PRD.md | Complete (product) | 1.0.0 |
| Architecture.md | **Rewritten canonical — LMS removed** | **2.0.0** |
| Rules.md | Expanded production authority | **2.0.0** |
| Phases.md | Expanded delivery authority | **2.0.0** |
| Design.md | Expanded dual-system authority | **2.0.0** |
| Memory.md | Expanded living memory | **2.0.0** |

### 3.5 Product implementation status

| Product | Status | Notes |
|---|---|---|
| A Gift Commerce | Not started (prod stack) | Empty module folders only |
| B Commerce Admin | Not started | Empty admin shells |
| C Editorial | Not started | Empty module folders only |
| D Creator Collective | Not started | System B theme not applied in prod yet |
| Shared Platform | In progress (Phase 0) | Health, Prisma, Redis, worker sample, CI/CD |

### 3.6 Prototype caveat

An older CRA/FastAPI/Mongo prototype may exist under `Inabiya-emergent-ai`.  
**Reference only.** Production follows Rules v2 stack.

### 3.7 Architecture status

`Architecture.md` **v2.0.0 full rewrite completed (2026-07-20)**.

- LMS/education contamination removed
- Domains aligned to PRD (Commerce, Editorial, Creator, Platform)
- Stack aligned to Rules (Next.js, NestJS, Postgres/Prisma, Redis/BullMQ)
- v1 draft superseded — do not follow old Admissions/Hostel diagrams

Q4 (Architecture rewrite) → **Resolved**

---

## 4. Next actions (max 5 — keep fresh)

1. Verify VPS deploy once (migrate + seed + health + sample job logs)
2. Confirm GitHub repo secrets (`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY_B64`)
3. Close remaining Phase 0 exit criteria on clean boot
4. Decide public domain + Caddy site when ready for HTTP edge
5. Close Phase 0 only on exit criteria — then Phase 1

---

## 5. Open questions

| ID | Question | Status | Owner | Blocking? |
|---|---|---|---|---|
| Q1 | Exact monorepo path for production code? | **Resolved — `/srv/Inabiya`** | Eng | Done 2026-07-20 |
| Q2 | Payment provider (Razorpay / other)? | Open | Product/Eng | Blocks Phase 3 provider choice |
| Q3 | Hosting (AWS/GCP/other)? | Open | DevOps | Soft for Phase 0; hard by Phase 9 — VPS deploy in use |
| Q4 | Rewrite Architecture.md to remove LMS contamination? | **Resolved — v2.0.0** | Architecture | Done 2026-07-20 |
| Q5 | Single deployable vs separate web/api deploys day one? | **Resolved — compose: web+api+worker** | Eng Lead | Done 2026-07-20 |
| Q6 | Commerce admin visual = Soft Gift dense confirmed? | Open | Design | Soft |
| Q7 | Launch package = Commerce only, or Commerce+Editorial? | Open | Product | Affects Phase 9 entry |

Resolve → move to Decisions Log → remove from this table.

---

## 6. Decisions log (append-only, newest first)

### 2026-07-20 — Docs path + VPS CI/CD

- Canonical docs: `/srv/Inabiya/Docs/`; `docs` symlink → `Docs` (removed broken `/srv/docs`)
- Q1 resolved: production monorepo `/srv/Inabiya` (`EDUNEX-OFFICIAL/Inabiya`)
- Q5 resolved: Phase 0 deployables = `web` + `api` + `worker` via compose (BuildKit on VPS)
- CI/CD: GitHub verify → SSH → `scripts/deploy-vps.sh` (images build on VPS, not GHCR)

### 2026-07-20 — Extra Cursor rules (GSAP, Ponytail, ecommerce)

- Added `03-ponytail.mdc` (lazy senior / YAGNI)
- Added `15-gsap-motion.mdc` (GSAP primary for Soft Gift ecommerce motion)
- Added performance, a11y, SEO, images, checkout UX rules
- GSAP primary; Framer only tiny UI

### 2026-07-20 — Cursor rules installed

- Added full `.cursor/rules/*.mdc` set (core, phase, stack, Nest, Next, design, Prisma, security, commerce/editorial/creator, jobs, testing, docs, git)
- Path: `f:\PHANTOM\Professional\Projects\Inabiya\.cursor\rules\`

### 2026-07-20 — Architecture.md v2 full rewrite

- Deleted LMS/education contaminated architecture draft
- Rewrote canonical Architecture for Inabiya four products + shared platform
- Added deep sections: commerce/editorial/creator flows, API catalog, state machines, data model direction, threat model, CI/CD, extraction criteria
- Stack locked to Next.js + NestJS + PostgreSQL/Prisma + Redis/BullMQ
- Old “students/admissions/hostel” concepts explicitly mapped to delete/replace table

### 2026-07-20 — Docs suite upgraded to v2

- Expanded `Rules.md`, `Phases.md`, `Design.md`, `Memory.md` to deeper production authority
- Confirmed dual design systems remain separated
- Confirmed delivery phases 0–9 for first production path
- Confirmed Active Phase remains Phase 0

### 2026-07 — Initial documentation suite created

- Created Rules/Phases/Design/Memory after PRD + Architecture
- Locked stack: Next.js App Router, NestJS, PostgreSQL/Prisma, Redis/BullMQ, Tailwind/shadcn
- Chose dual visual systems over unified single palette

---

## 7. Blockers & risks

| Type | Item | Impact | Mitigation | Status |
|---|---|---|---|---|
| Risk | Boiling entire PRD at once | No ship | Phase P0/P1/P2 tiers | Active watch |
| Risk | Architecture LMS contamination | Wrong domains | PRD+Rules language | Active watch |
| Risk | Theme bleed A↔B | Brand damage | Design.md QA | Active watch |
| Risk | Non-idempotent payments | Money defects | Phase 3 hard stops | Future |
| Risk | Medical gate bypass | Trust failure | Phase 6–7 tests | Future |
| Blocker | None yet | — | — | — |

---

## 8. Module ownership map (target)

| Module | Owner team (TBD names) | Status |
|---|---|---|
| identity | Platform | Not started |
| media | Platform | Not started |
| notifications | Platform | Not started |
| audit | Platform | Not started |
| commerce/* | Commerce | Not started |
| editorial/* | Content | Not started |
| creator/* | Creator Collective | Not started |

Update owners when assigned.

---

## 9. PRD quick index for agents

Use this to open the right PRD slice instead of whole file:

| Need | PRD region |
|---|---|
| Personas/roles | PART 2 §11–15 |
| Shared platform services | PART 3 §16–27 |
| Gift commerce UX | PART 4 §28–43 |
| Cart/checkout/orders | PART 4B §44–65 |
| Catalog/inventory | PART 4C §66–91 |
| Engagement/growth | PART 4D §92–114 |
| Commerce rules/stories | PART 4E §115–123 |
| Admin foundation | PART 5A §124+ |
| Product admin | PART 5B |
| Inventory admin | PART 5C |
| Order admin | PART 5D |
| Customer CRM | PART 5E |
| Promotions | PART 5F+ |
| Editorial | PART 6* |
| Creator Collective | Product D sections |

\* Exact PART numbers for editorial/creator are large; search PRD headings when entering Phases 6–8.

---

## 10. Active phase checklist — Phase 0

### Must-have (P0)

- [x] Monorepo layout created
- [x] `apps/web` Next.js App Router boots
- [x] `apps/api` NestJS boots
- [x] Prisma + PostgreSQL migrate works
- [x] Redis connected
- [x] BullMQ worker + sample job works
- [x] Env strategy + `.env.example`
- [x] Lint + format + typecheck + CI
- [x] Health + readiness endpoints
- [x] Structured logging + correlation IDs
- [x] API error envelope implemented
- [x] S3 adapter stub
- [x] Role seed script
- [x] Empty domain module folders per Rules

### Should (P1)

- [x] Dev compose (db/redis; api/web/worker via `docker-compose.prod.yml`)
- [x] Workspace scripts documented
- [ ] OpenAPI stub generation path

### Exit criteria

- [ ] Clean machine boot docs verified
- [ ] CI green
- [ ] Migrate+seed works
- [ ] Sample job visible in logs
- [x] No fake complete product features

### Demo notes

_Scaffold present; full VPS smoke pending after first deploy-vps run._

---

## 11. Phase checklists (templates — activate when phase starts)

> When entering a new phase: copy that phase’s checklist into §10, archive old phase closeout into §12.

### Phase 1 — Identity & shared platform

- [ ] Register/login/logout/refresh
- [ ] RBAC roles seeded + enforced
- [ ] Admin shell
- [ ] Media upload/signed read
- [ ] Audit privileged actions
- [ ] Email adapter + test send
- [ ] Feature flags primitive
- [ ] Password reset MVP

### Phase 2 — Catalog & gift foundations

- [ ] Categories/collections browse
- [ ] PLP/PDP
- [ ] Personalization MVP
- [ ] Gift box builder MVP
- [ ] Wishlist MVP
- [ ] Admin product CRUD + publish
- [ ] Basic inventory qty

### Phase 3 — Cart/checkout/payments/orders

- [ ] Cart guest+auth merge
- [ ] Checkout MVP
- [ ] Payment adapter
- [ ] Webhook idempotency tests
- [ ] Inventory reserve/release
- [ ] Order history/tracking basics
- [ ] Confirmation notification

### Phase 4 — Commerce ops console

- [ ] Dashboard KPIs subset
- [ ] Order fulfillment transitions
- [ ] Customer admin profile
- [ ] Coupons MVP
- [ ] Homepage CMS MVP
- [ ] Basic reports
- [ ] Low stock / failed payment alerts MVP

### Phase 5 — Commerce GA hardening

- [ ] Reviews moderation MVP
- [ ] Returns request MVP
- [ ] Abandonment email job
- [ ] Funnel analytics events
- [ ] Perf/security/a11y passes
- [ ] Support lookup enough for launch

### Phase 6 — Editorial core

- [ ] Assignments
- [ ] Writer dashboard + editor
- [ ] SEO + medical gates
- [ ] Status machine + audit
- [ ] Unauthorized publish blocked

### Phase 7 — Publishing & writer payments

- [ ] Public articles
- [ ] Schedule/publish jobs
- [ ] SEO metadata
- [ ] Specialist profiles
- [ ] Writer payment release MVP
- [ ] Newsletter signup MVP

### Phase 8 — Creator Collective

- [ ] Brand + creator onboarding
- [ ] Campaigns + marketplace
- [ ] Reverse proposals/bids
- [ ] Award + messaging
- [ ] Deliverable approvals
- [ ] Payment release gates
- [ ] System B theme verified isolated

### Phase 9 — Hardening

- [ ] Load tests
- [ ] Alerts/dashboards
- [ ] Backup/restore drill
- [ ] Pentest P0/P1 fixed
- [ ] Runbooks
- [ ] Launch checklist signed

---

## 12. Closed phases archive

_None yet. When Phase 0 closes, summarize here:_

```md
### Phase 0 closed — YYYY-MM-DD
- Commit/PR refs:
- Demo:
- Deferred leftovers:
- Carry-over risks:
```

---

## 13. Session log (newest first)

### Session — 2026-07-20 (Docs align + VPS CI/CD)

- Phase: 0 (IN PROGRESS)
- Done:
  - Fixed docs path: `docs` → `Docs` (removed broken `/srv/docs` symlink)
  - Synced Memory with real Phase 0 scaffold; Q1/Q5 resolved
  - Added Dockerfiles + `docker-compose.prod.yml` + `scripts/deploy-vps.sh`
  - Hardened CI; added `deploy-vps.yml` (verify → SSH → VPS BuildKit)
- Changed files:
  - `Docs/Memory.md`, Dockerfiles, compose prod, GHA workflows, README
- Decisions:
  - Images build on VPS; loopback smoke `3001`/`4001`; Caddy later
- Blockers:
  - GitHub secrets must be set for first auto-deploy
- Next:
  1. First successful `deploy-vps` smoke on VPS
  2. Tick remaining Phase 0 exit criteria

### Session — 2026-07-20 (Architecture rewrite)

- Phase: 0 (not started)
- Done:
  - Full rewrite `Architecture.md` → v2.0.0 (LMS removed)
  - Updated Memory decisions/Q4 resolved
- Changed files:
  - `docs/Architecture.md`
  - `docs/Memory.md`
- Decisions:
  - Architecture v2 is canonical; ignore v1 LMS draft
- Blockers:
  - None
- Next:
  1. Resolve Q1 repo path
  2. Start Phase 0 scaffold when instructed

### Session — 2026-07-20 (docs v2)

- Phase: 0 (not started)
- Done:
  - Expanded Rules/Phases/Design/Memory to v2.0.0
- Changed files:
  - `docs/Rules.md`, `Phases.md`, `Design.md`, `Memory.md`
- Decisions:
  - Dual design systems; Phase 0 active
- Next:
  1. Architecture cleanup (completed same day)

---

## 14. Environment & credentials notes

| Env | Status | Notes |
|---|---|---|
| Local | Provisioned on VPS path | Compose postgres `5433` / redis `6381`; `.env` present (gitignored) |
| Staging | Not provisioned | |
| Production | Partial | Same VPS deploy path; no public domain/Caddy yet |

Do not store secret values in this file — only status and key names.

Required key names (from Rules): `DATABASE_URL`, `REDIS_URL`, JWT secrets, object storage, payment, email, `APP_URL`, `API_URL`.

---

## 15. Useful commands (fill during Phase 0)

```bash
pnpm install
pnpm dev
docker compose up -d postgres redis
pnpm db:migrate
pnpm db:seed
pnpm lint && pnpm typecheck
# Prod-like on VPS:
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
bash scripts/deploy-vps.sh
```

---

## 16. AI guardrails (restate)

1. Do not invent progress checkboxes
2. Do not skip phases without explicit override logged here
3. Do not implement LMS domains from contaminated Architecture text
4. Do not blend Design systems A/B
5. Prefer updating Memory over long chat-only status
6. If Memory grows too large, archive old session logs to `Memory-archive.md`

---

## 17. Definition of a good Memory update

A good update is:

- Dated
- Phase-tagged
- Checkbox-accurate
- Decision-complete
- Next-actions limited to ≤5
- Free of secrets
- Free of PRD duplication

---

## 18. Ready-to-start gate for Phase 0

Phase 0 coding should start when:

- [x] Rules v2 locked
- [x] Phases v2 locked
- [x] Design v2 locked
- [x] Memory initialized
- [x] Q1 repo/monorepo path answered (`/srv/Inabiya`)
- [x] Human explicitly says start Phase 0

Scaffold is underway; exit criteria still open until VPS smoke verified.

---

**End of current Memory snapshot v2.0.0**
