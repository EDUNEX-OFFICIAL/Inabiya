# Procurement OPS — Suppliers & Purchase Orders

Version: 1.0.0  
Status: **Active** — OPS-10 S0→S3 first slice  
Last Updated: 2026-08-11  
Authority (override): [`docs/Memory.md`](Memory.md) — Phase 13 P0/P1 closed; human override to start procurement

**Not** multi-vendor marketplace. Single merchant buys from Delhi-area (and India) suppliers, receives stock into existing inventory ledger.

Related: `COMMERCE_OPS_PANEL.md` OPS-3 inventory · PRD §77 / §170 future vendor-managed inventory language · Architecture §24 multi-vendor still non-goal.

---

## 1. Goal

Ops can: maintain suppliers → raise a PO → mark ordered → **full receive** into `InventoryItem` via `RECEIVE` movements (integer `unitCostPaise` on lines only; stock qty still on inventory).

### Non-goals (this slice)

- Multi-warehouse / bins  
- Partial receive / PARTIAL status  
- Supplier portal login  
- Dropshipping / marketplace sellers  
- Accounts payable / invoice matching  

---

## 2. Roles

| Role | Access |
|---|---|
| `COMMERCE_ADMIN` / `SUPER_ADMIN` | Full CRUD suppliers + PO lifecycle |
| `FINANCE` | Read POs (cost visibility) — optional later; **this slice: same as no write** |
| `SUPPORT` | No procurement nav |

---

## 3. Domain

| Entity | Notes |
|---|---|
| `Supplier` | name, code, contact, Delhi/city, GSTIN optional, `isActive` |
| `PurchaseOrder` | `poNumber`, status `DRAFT\|ORDERED\|RECEIVED\|CANCELLED` |
| `PurchaseOrderLine` | variantId, sku snapshot, qty, `unitCostPaise` |
| `ProductVariant.preferredSupplierId` | optional soft link |

### Transitions

```text
DRAFT → ORDERED → RECEIVED
DRAFT → CANCELLED
ORDERED → CANCELLED
```

Receive = all lines in one shot; each line `quantityReceived = quantityOrdered`; `InventoryService.adjustAdmin(+qty, RECEIVE, note=PO…)`.

---

## 4. Routes (web)

| Route | Purpose |
|---|---|
| `/admin/commerce/suppliers` | List + create/edit |
| `/admin/commerce/purchase-orders` | Queue by status |
| `/admin/commerce/purchase-orders/new` | Builder |
| `/admin/commerce/purchase-orders/[id]` | Detail + Order / Receive / Cancel |

Theme: Soft Gift + `compact` shell only.

---

## 5. API (`/api/v1`)

| Method | Path | AuthZ |
|---|---|---|
| GET/POST | `/admin/commerce/suppliers` | COMMERCE_ADMIN |
| PATCH | `/admin/commerce/suppliers/:id` | COMMERCE_ADMIN |
| GET/POST | `/admin/commerce/purchase-orders` | COMMERCE_ADMIN |
| GET | `/admin/commerce/purchase-orders/:id` | COMMERCE_ADMIN |
| POST | `/admin/commerce/purchase-orders/:id/order` | COMMERCE_ADMIN |
| POST | `/admin/commerce/purchase-orders/:id/receive` | COMMERCE_ADMIN |
| POST | `/admin/commerce/purchase-orders/:id/cancel` | COMMERCE_ADMIN |

Zod on every body. Audit: `supplier.*`, `purchase_order.ordered|received|cancelled`.

---

## 6. Exit criteria (S0–S3)

- [x] Migrations applied  
- [x] Create Delhi suppliers + PO with variant lines  
- [x] Receive → inventory onHand up; movement reason RECEIVE  
- [x] Cancel blocks receive  
- [x] Nav gated; Soft Gift theme intact  
- [x] One runnable check (status transitions)  
- [x] Memory session log  

---

## 7. Document history

| Date | Change |
|---|---|
| 2026-08-11 | v1.0.0 — first slice contract under human override |
