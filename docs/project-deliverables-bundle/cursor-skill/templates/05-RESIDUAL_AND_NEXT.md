# {{PROJECT}} — What is left (residual and next)

Version: {{VERSION}}  
Date: {{DATE}}  
Who this is for: product owners and engineers

The agreed scope in the [Handover certificate](04-HANDOVER_CERTIFICATE.md) **works** as described there.  
These items are **not** delivered. Do not treat them as included.

Delete sections that do not apply. Add a section for any other open item.

---

## How to read this

| Word | Meaning |
|---|---|
| **Open** | Not delivered. Needs future work |
| **Partial** | Some code exists, but it is not live or not complete |
| **Out of this pack** | Built or planned, but not part of this sign-off |

---

## 1. {{LEFTOVER_1_TITLE}} (open)

**Today:** {{LEFTOVER_1_TODAY}}

What that means:

- {{LEFTOVER_1_MEANING}}

**Next:**

1. {{LEFTOVER_1_NEXT_1}}
2. {{LEFTOVER_1_NEXT_2}}

Owner: {{OWNER_1}}  
Depends on: {{DEPENDS_1}}

---

## 2. {{LEFTOVER_2_TITLE}} (open)

**Today:** {{LEFTOVER_2_TODAY}}

**Next:**

1. {{LEFTOVER_2_NEXT_1}}

Owner: {{OWNER_2}}

---

## 3. {{LEFTOVER_3_TITLE}} (open)

**Today:** {{LEFTOVER_3_TODAY}}

**Next:**

1. {{LEFTOVER_3_NEXT_1}}

Owner: {{OWNER_3}}

---

## 4. Other leftovers

| Item | Status | Next |
|---|---|---|
| {{OTHER_1}} | {{OTHER_1_STATUS}} | {{OTHER_1_NEXT}} |

Common launch leftovers (keep, change, or delete): live payments, real email, public https, real file storage, outside security test, on-call names.

If you later record “we bought goods”, keep it to **item + quantity + amount**. Do not add a vendor order / received / paid workflow unless the client asked.

---

## 5. Suggested order of work

Do risky public steps in a safe order. Example: https **before** live payments on the public internet.

```text
1. {{ORDER_1}}
2. {{ORDER_2}}
3. {{ORDER_3}}
4. Then call it a public launch
```

---

## 6. What “done” would look like

| Area | Done when |
|---|---|
| {{LEFTOVER_1_TITLE}} | {{DONE_1}} |
| {{LEFTOVER_2_TITLE}} | {{DONE_2}} |
| {{LEFTOVER_3_TITLE}} | {{DONE_3}} |

Keep this file attached to every sign-off so nobody assumes these are included.
