# Inabiya — Handover certificate

Version: 1.0.0  
Date: 18 August 2026

This paper records **what was handed over** for the shop, Commerce Ops, and CMS.  
It is a sign-off sheet. It is not a full product contract.

**Client testing:** as of **19 August 2026**, the client has started using these three on the current server. That does not change the open items in [What is left](05-RESIDUAL_AND_NEXT.md) (payments, email, public https).

Related:

- [Developer Handbook](01-DEVELOPER_HANDBOOK.md)
- [Client Operations Manual](02-CLIENT_OPERATIONS_MANUAL.md)
- [What is left](05-RESIDUAL_AND_NEXT.md)

---

## 1. Parties

| | Name | Company | Date |
|---|---|---|---|
| Delivered by (build team) | | | |
| Received by (client) | | | |

Project: **Inabiya — Soft Gift shop + Commerce Ops + CMS**  
Code: `https://github.com/EDUNEX-OFFICIAL/Inabiya`  
Server folder: `/srv/Inabiya`

---

## 2. What this handover covers

This pack covers **only** these three:

1. Soft Gift **storefront** (shop on `/`)
2. **Commerce Ops** desk (orders, catalog, stock, customers, promotions, reports, support)
3. **CMS** (marketing pages, homepage blocks, nav and footer)

Not claimed as “finished public launch”:

- Live card payments (Razorpay)
- Real email sending
- Public https / DNS in front of Caddy
- Formal outside security test

See [What is left](05-RESIDUAL_AND_NEXT.md).

---

## 3. Scope vs delivered

| Item | Status | Notes |
|---|---|---|
| Shop home, menus, PLP, PDP | **Delivered** | Home is `/` |
| Cart, checkout, order history, invoice | **Delivered** | Payment is **test/mock** |
| Build-your-box, hampers, collections | **Delivered** | |
| Customer login / register / account | **Delivered** | Email + password. No Google login |
| Commerce Ops shell and dashboard | **Delivered** | Phase 13 OPS-0…9 |
| Products, collections, publish | **Delivered** | |
| Inventory adjust + history | **Delivered** | No multi-warehouse |
| Order desk: pack / ship / notes | **Delivered** | |
| Customers, support lookup, suspend | **Delivered** | Support cannot suspend |
| Coupons / promotions | **Delivered** | Includes product/category rules as built |
| Returns + reviews queues | **Delivered** | |
| Reports | **Delivered** | |
| CMS page builder + publish | **Delivered** | Draft vs Publish |
| Homepage as CMS page `home` | **Delivered** | |
| Nav & footer CMS | **Delivered** | Footer developer credit is fixed in code |
| Cookie banner + tracking IDs | **Delivered** | Super Admin saves IDs; tags after Accept |
| Seeded test users | **Delivered** | Staging only — see §5 |
| Live Razorpay | **Not delivered** | Adapter exists; env still `mock` |
| Real SMTP email | **Not delivered** | Logs only |
| Public domain + https | **Not delivered** | Apps on localhost ports |
| Real S3 cloud storage | **Not delivered** | Files on disk |
| UAT booklet (item 3) | **Not in this pack** | Not requested |
| Editorial journal / Creator hub | **Built in repo** | Out of this certificate’s scope. Next client product: Journal first, then Creator (see residual §7) |

---

## 4. Environments (fill on sign day)

| Env | Website | API | Notes |
|---|---|---|---|
| This VPS (Docker) | `http://127.0.0.1:3001` | `http://127.0.0.1:4001/api/v1` | Default today |
| Local `pnpm` | `http://127.0.0.1:3101` | `http://127.0.0.1:4101/api/v1` | Do not mix with Docker ports |
| Public production | | | Empty until DNS / https |

Tick when checked on handover day:

- [ ] `GET /api/v1/health` returns OK
- [ ] Shop home loads
- [ ] Commerce login opens the dashboard
- [ ] CMS login opens Pages
- [ ] One test product can be opened
- [ ] One CMS page can be opened as draft (no need to publish live)

---

## 5. Access and passwords

**Do not put production passwords in git or in email without a secure channel.**

### 5.1 Staging / test users (from seed)

These exist after `pnpm db:seed`. Password for all of them: **see `prisma/seed.ts` (do not print it on a public website).**  
Default in that file is a shared test password. **Change it before any public launch.**

| Email | Role | Login page |
|---|---|---|
| `customer@test.inabiya` | Customer | `/login` |
| `commerce@test.inabiya` | Commerce Admin | `/admin/commerce/login` |
| `content@test.inabiya` | Content Admin | `/admin/cms/login` |
| `support@test.inabiya` | Support | `/admin/commerce/login` |
| `finance@test.inabiya` | Finance | `/admin/commerce/login` |
| `super@test.inabiya` | Super Admin | `/admin/platform/login` or commerce |

Login screens do not list these emails.

### 5.2 Production accounts (fill by hand — keep this copy offline)

| Person | Email | Role | Portal | Password given? | Must rotate on day 1 |
|---|---|---|---|---|---|
| | | | | Yes / No | Yes |
| | | | | Yes / No | Yes |
| | | | | Yes / No | Yes |

GitHub repo access:

| Person | Access (read / write / admin) | Date |
|---|---|---|
| | | |

---

## 6. Training attendance

Record who sat through the walkthrough. One row per person.

**Session A — Commerce Ops** (orders, stock, customers, coupons)

| Name | Role | Date | Attended (Y/N) | Signature |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

**Session B — CMS** (pages, publish, nav/footer)

| Name | Role | Date | Attended (Y/N) | Signature |
|---|---|---|---|---|
| | | | | |
| | | | | |

Trainer: ______________________  
Duration: ______________________

---

## 7. Documents given

| Document | Given (Y/N) |
|---|---|
| Developer Handbook | |
| Client Operations Manual | |
| This certificate | |
| What is left (residual) | |
| Repo access confirmed | |

---

## 8. Known limits (client has read these)

The client confirms they understand:

1. Checkout payment is **test/mock**, not live cards.
2. Email is **not** sent to real inboxes yet.
3. The site is **not** on a public https domain as a finished delivery.
4. Test passwords must be **changed** before going public.

Client initials: __________  
Date: __________

---

## 9. Sign-off

| | Name | Signature | Date |
|---|---|---|---|
| Build team | | | |
| Client product owner | | | |
| Client tech owner (if any) | | | |

By signing, the client accepts the **delivered** column in §3 for shop, Commerce Ops, and CMS, and accepts the open items in [What is left](05-RESIDUAL_AND_NEXT.md).
