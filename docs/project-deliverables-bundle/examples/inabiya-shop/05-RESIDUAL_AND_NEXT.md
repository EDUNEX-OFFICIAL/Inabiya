# Inabiya — What is left (residual and next)

Version: 1.0.0  
Date: 18 August 2026  
Who this is for: product owners and engineers

This list is honest. The shop, Commerce Ops, and CMS **work on the current server**.  
These items are **not** done, or only partly done. They must not be treated as delivered in the [Handover certificate](04-HANDOVER_CERTIFICATE.md).

---

## How to read this

| Word | Meaning |
|---|---|
| **Open** | Not delivered. Needs a future piece of work |
| **Partial** | Some code exists, but it is not live / not complete |
| **Out of this pack** | Built or planned, but not part of shop + ops + CMS sign-off |

---

## 1. Payments (open)

**Today:** checkout uses **mock / test pay**. Env: `PAYMENT_PROVIDER=mock`.

What that means for the business:

- You can walk through cart → place order → “pay” in a test way
- No real money moves
- No live Razorpay dashboard for real charges

What already exists in code (not live):

- Razorpay env names (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`)
- Verify and webhook routes
- Rule: never mark an order paid unless the provider event is clear and unique

**Next (when you go live):**

1. Razorpay account (test, then live)
2. Put keys only on the **API** server. Never in the public website
3. Set `PAYMENT_PROVIDER=razorpay` and matching public label
4. Webhook URL on https (needs public DNS first)
5. Repeat a full paid-order test: stock reserve → capture → fail path
6. Keep mock off in production

Owner: Product + Eng  
Depends on: public https (section 3)

---

## 2. Email (open)

**Today:** mail is a **stub**. Jobs write to **logs**. SMTP env exists (`SMTP_HOST`, `EMAIL_FROM`, …) but is not a real mail provider.

What does not work for real users yet:

- Forgot-password mail you can trust in an inbox
- Order confirmation mail
- Staff alerts by email

**Next:**

1. Choose a provider (example: SES, Resend, or SMTP from your host)
2. Wire it behind the existing mail adapter (do not scatter send-mail calls)
3. Test: reset password, order paid, and one admin alert
4. Do not log full mail bodies with tokens or personal data

Owner: Eng  
Blocked by: provider account + DNS records (SPF/DKIM) when public

---

## 3. Public website / DNS / https (open)

**Today:**

- Website: `127.0.0.1:3001`
- API: `127.0.0.1:4001`
- Bound to **this machine only**
- Cookie `Secure` flag is off because the site is http on localhost
- Caddy on the VPS is the **one** public proxy for the host. Inabiya’s web container can join that network, but the **public site file is not signed off as delivered**

**Next:**

1. Decide the public host (example already used in env comments: `inabiya.edunexservices.in`)
2. Add a Caddy site file that points to the Inabiya **web** container (not to `localhost` from another project)
3. HTTPS certificates
4. Set `APP_URL` / `API_URL` to https
5. Set `COOKIE_SECURE=true`
6. Do **not** publish 3001/4001 on `0.0.0.0`
7. Then connect Razorpay webhooks to that https API

Owner: Ops / Eng  
Do not: run a second public proxy on ports 80/443

---

## 4. Other leftovers (same honesty)

These are not the four titles you asked for, but they affect a real launch.

| Item | Status | Next |
|---|---|---|
| Real S3 / cloud files | Partial — files on local disk | Plug the storage adapter; signed URLs for private files |
| Outside security test | Not done | Book before public DNS |
| CDN | Not done | After public https, if traffic needs it |
| Who may edit tracking (not only Super Admin) | Deferred | Permission matrix — Super Admin grants later |
| On-call names and phones | Placeholder | Fill before public launch |
| JWT secrets still `change-me` | Risk if true in `.env` | Rotate (runbook in Developer Handbook) |

---

## 5. Suggested order of work

Do not do payments on the public internet before https.

```text
1. Public DNS + https + Secure cookies
2. Real email
3. Live Razorpay (test keys, then live)
4. Outside security test
5. Rotate all secrets + production staff logins
6. Then call it a public launch
```

---

## 6. What “done” would look like for each

| Area | Done when |
|---|---|
| Payments | A real small charge succeeds, webhook is unique, fail path releases stock, mock is off |
| Email | Reset-password and order mail arrive in a real inbox |
| DNS / https | Shop opens on https without port numbers; cookies are Secure |

Until those are true, keep this file attached to every client sign-off so nobody assumes they are included.
