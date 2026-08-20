# Inabiya — Client Operations Manual

Version: 1.0.0  
Date: 18 August 2026  
Who this is for: staff who run the shop, fill orders, and edit pages

This is a **how to use the product** guide. It is not a coding guide.  
Engineers: see the [Developer Handbook](01-DEVELOPER_HANDBOOK.md).

On this server the shop is at `http://127.0.0.1:3001`. When a public website is live, use that address instead.

---

## 1. Three places you will work

| Place | What you do there | Login page | After login you land on |
|---|---|---|---|
| Shop | Same as a customer | `/login` | Home `/` |
| Commerce Ops | Orders, products, stock, customers | `/admin/commerce/login` | `/admin/commerce` |
| CMS | Pages and header/footer | `/admin/cms/login` | `/admin/cms/pages` |

Use the **matching** login page. A shop login will not open the admin desk.

There are no “click to fill demo account” buttons on login screens.

---

## 2. Who can do what

| Role | Typical work |
|---|---|
| **Customer** | Shop, cart, checkout, own orders |
| **Commerce Admin** | Full shop desk: catalog, stock, orders, coupons, CMS |
| **Content Admin** | CMS pages (and editorial journal, not this guide) |
| **Support** | Find orders and customers, notes. Not products or coupons |
| **Finance** | Orders (read), reports, refunds as allowed, coupons list |
| **Super Admin** | Everything above, plus tracking tags in Settings |

Hiding a menu item is not the real lock. The server also checks the role.

**Tracking** (Google / Meta IDs): only Super Admin can save them for now.

---

## 3. Shop (for customers — staff should know this too)

Home is `/` (not `/gift`).

| Page | Path |
|---|---|
| Home | `/` |
| All products | `/products` |
| One product | `/products/{slug}` |
| Hampers | `/hampers` |
| Collection | `/collections/{slug}` |
| Build a box | `/build-your-box` |
| Cart | `/cart` |
| Checkout | `/checkout` |
| Account / orders | `/account`, `/orders` |
| Marketing page | `/pages/{slug}` |
| Corporate / contact | `/corporate`, `/contact` |

**Checkout today uses test payment.** A real card gateway is not live. See [What is left](05-RESIDUAL_AND_NEXT.md).

Free shipping uses the rule set in the shop (seeded example: ₹2,000). Totals on checkout come from the server, not from the browser.

If an account is **suspended**, that person cannot check out.

---

## 4. Commerce Ops — the menu

Login: `/admin/commerce/login`.

| Menu | Path | What it is for |
|---|---|---|
| Dashboard | `/admin/commerce` | Today’s numbers and alerts |
| Orders | `/admin/commerce/orders` | Pack, ship, notes |
| Products | `/admin/commerce/products` | Add / edit / publish products |
| Collections | `/admin/commerce/collections` | Group products |
| Inventory | `/admin/commerce/inventory` | Stock counts and history |
| Import | `/admin/commerce/import` | Bulk import |
| Customers | `/admin/commerce/customers` | Customer list and profile |
| Promotions | `/admin/commerce/coupons` | Coupon codes and rules |
| Reports | `/admin/commerce/reports` | Sales and related reports |
| Reviews | `/admin/commerce/reviews` | Moderate reviews |
| Returns | `/admin/commerce/returns` | Return queue |
| Support | `/admin/commerce/support` | Look up an order fast |
| Inquiries | `/admin/commerce/gifting-inquiries` | Corporate / gift questions |
| Settings | `/admin/commerce/settings` | Shop policy, tracking (Super Admin) |
| Pages | `/admin/cms/pages` | CMS list |
| Nav & footer | `/admin/cms/gift-chrome` | Header and footer of the shop |

Global search is in the top bar (`/admin/commerce/search`).

---

## 5. Daily playbooks (Commerce)

### 5.1 Start of day

1. Open **Dashboard**.
2. Check alerts: failed payments, low stock, waiting to ship, open returns.
3. Click an alert. It should open the right list, already filtered.

### 5.2 Fill an order

Happy path:

`PAID` → `PROCESSING` → `SHIPPED` → `DELIVERED`

1. Open **Orders**. Filter by `PAID` or “needs ship”.
2. Open the order. Read items, gift message, address, payment status.
3. Move status only **forward** on the allowed path. The system rejects illegal jumps.
4. Add an internal note if needed (customer does not see this as a public comment).
5. When you ship, add carrier / AWB if you have it.
6. Mark **Delivered** when it arrives.

Do **not** ship an order that is still `PENDING_PAYMENT` or `PAYMENT_FAILED`.

Cancel / refund: use the order actions. This is logged. Money is in paise on the server; you will see rupees on screen.

### 5.3 Add or change a product

1. **Products** → New, or open an existing product.
2. Fill basics, variants (SKU, price), photos, personalisation if any, SEO.
3. Save.
4. **Publish** when it should appear on the shop. **Unpublish** hides it.
5. Publish is logged.

Price is rupees on the form; the system stores paise.

Labels such as BESTSELLER or sale come from catalog fields. Home product rows also come from CMS **product grid** blocks.

### 5.4 Fix stock

1. Open **Inventory**.
2. Find the SKU.
3. Adjust with a **reason** (receive, damage, recount, correction).
4. You cannot push available stock below zero with an admin adjust.
5. Every change has a history line (who + why).

If you bought stock, keep it this simple: **this product, this many pieces, this amount**. Add the quantity in Inventory. Put the amount in the note if you want a record. There is no supplier list and no “ordered / received / paid to vendor” steps.

Reserved stock means a checkout is holding it until pay succeeds or fails.

### 5.5 Help a customer

1. **Support**: search by order id, email, or phone.
2. Or open **Customers** → the person → orders and notes.
3. Add a note so the next person sees it.
4. **Suspend** only if policy says so. Suspended accounts cannot log in to shop / check out. This is logged. Support cannot suspend.

### 5.6 Run a coupon

1. **Promotions** (`/admin/commerce/coupons`).
2. Set code, type (percent or fixed amount), minimum order, dates, product or category limits if needed.
3. Save. Test on checkout with a test customer.
4. Deactivate when the campaign ends. Do not leave old codes live by accident.

The shop can stack nested coupons as currently configured. Test before a big sale.

### 5.7 Returns and reviews

- **Returns:** work the queue. Status and refund follow the order desk rules.
- **Reviews:** approve or hide. Do not invent ratings.

### 5.8 Reports

**Reports** has daily sales, products, stock, returns, coupons, funnel. Export if the screen offers it. Treat money columns as the system of record.

---

## 6. CMS playbooks

CMS login: `/admin/cms/login`.  
Commerce Admin and Content Admin (and Super Admin) can edit pages.

### 6.1 Pages list

Path: `/admin/cms/pages`

- Search and filter by draft / published
- New page, duplicate, delete
- Open a page to edit

The **home** page of the shop is the CMS page with slug `home`. Edit that page to change the homepage sections. Do not look for an old “featured products” merchandising screen — it was removed.

### 6.2 Build or edit a page

Path: `/admin/cms/pages/{id}` (full screen editor)

| Area | What to do |
|---|---|
| Left | Add a block (hero, text, products, FAQ, and others) |
| Middle | Order of blocks + preview of the selected block |
| Right | Content of that block, or **Page SEO** |

Actions:

- **Save** (also Ctrl/Cmd + S) — keeps a **draft**. The live shop does not change yet
- **Preview** — `/pages/preview/{pageId}` (needs CMS login)
- **Publish** — live at `/pages/{slug}` (home is `/`)
- **Unpublish** — live page goes away (shoppers see not found)

Draft vs Publish matters. Saving is not the same as going live.

### 6.3 Useful blocks (plain language)

| Block | Use it for |
|---|---|
| Hero | Big opening section |
| Rich text | Written content |
| Image | One picture + alt text |
| Product grid | Live products (manual list, category, bestsellers, sale, new, …) |
| FAQ | Questions; also feeds FAQ search data |
| Sale / thin strip | Promo bar |
| Testimonials | Quotes |
| Countdown | Offer timer |
| Custom section | Blank layout (columns / split) |

Unknown block types are skipped on the public page so the shop does not crash.

### 6.4 SEO on a page

On the SEO tab:

- Title, description, canonical, social image, index on/off
- Schema: **Auto** (system builds WebPage + FAQ from blocks) or **Manual** (you paste JSON-LD and it **replaces** the auto one)

Same idea exists on product edit.

### 6.5 Header and footer

Path: `/admin/cms/gift-chrome`

This is the shop navigation and footer. Change links there.  
The line “Developed by EduNex Services” in the footer is **fixed in code**. It is not a CMS field.

### 6.6 Photos

Upload through the media library on the block or product. Prefer the library, not random huge files. Real cloud S3 is not the live storage yet; files sit on the server disk.

---

## 7. Short “do / don’t”

| Do | Don’t |
|---|---|
| Publish only when the page/product should be public | Assume Save = live |
| Ship only paid orders | Ship unpaid / failed pay |
| Adjust stock with a reason | Edit stock in the database by hand |
| Use the right login portal | Share one Super Admin login with everyone |
| Test a coupon on checkout | Launch a code you have not tried |
| Ask engineering before live payments / public domain | Expose the server ports to the whole internet |

---

## 8. If you are stuck

| Problem | Try |
|---|---|
| Cannot open admin | Wrong login page or wrong role |
| Product missing on shop | Still draft, or unpublished, or wrong filters on the product grid |
| Page 404 | Not published, or slug mismatch |
| Stock looks wrong | Check reserved (open checkouts) and the movement history |
| Pay did not complete | Test pay is on. Tell engineering. Do not click pay many times |

For server / deploy issues, give this manual to engineering and open the Developer Handbook.

---

## 9. Other teams (not this manual)

| Area | Login | Notes |
|---|---|---|
| Journal / articles | `/admin/editorial/login` | Separate product |
| Creators / brands | `/creator/login` | Separate product |
| Platform flags / media | `/admin/platform/login` | Super Admin |
