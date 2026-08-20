# {{PROJECT}} — Handover certificate

Version: {{VERSION}}  
Date: {{DATE}}

This paper records **what was handed over** for the agreed scope.  
It is a sign-off sheet. It is not a full contract.

Related: Developer Handbook · Client Operations Manual · What is left  
(and UAT pack if used)

---

## 1. Parties

| | Name | Company | Date |
|---|---|---|---|
| Delivered by (build team) | | | |
| Received by (client) | | | |

Project: **{{PROJECT}}**  
Code: {{REPO_URL}}  
Server folder: {{SERVER_PATH}}

---

## 2. What this handover covers

This pack covers **only**:

1. {{SURFACE_1}}
2. {{SURFACE_2}}
3. {{SURFACE_3}}

Not claimed as finished public launch (edit to match doc 5):

- {{NOT_1}}
- {{NOT_2}}
- {{NOT_3}}

---

## 3. Scope vs delivered

| Item | Status | Notes |
|---|---|---|
| {{ITEM_1}} | **Delivered** | |
| {{ITEM_2}} | **Delivered** | |
| {{ITEM_3}} | **Not delivered** | |
| {{ITEM_4}} | **Out of scope** | |

Statuses allowed: **Delivered** · **Not delivered** · **Out of scope** · **Not in this pack**

This table must match [What is left](05-RESIDUAL_AND_NEXT.md).

---

## 4. Environments (fill on sign day)

| Env | Website | API | Notes |
|---|---|---|---|
| Staging / this server | {{WEB_URL}} | {{API_URL}} | |
| Public production | | | Empty until DNS / https |

Tick when checked:

- [ ] Health URL returns OK
- [ ] Main user site loads
- [ ] Staff login opens the right home
- [ ] One happy path can be opened (no need to publish live if that is risky)

---

## 5. Access and passwords

**Do not put production passwords in git.**

### Staging / test

See {{SEED_FILE}}. Label them **staging**. Change them before a public launch.

| Email or username | Role | Login page |
|---|---|---|
| {{EMAIL_1}} | {{ROLE_1}} | {{LOGIN_1}} |

### Production (fill by hand — keep this copy offline)

| Person | Email | Role | Portal | Password given? | Must rotate on day 1 |
|---|---|---|---|---|---|
| | | | | Yes / No | Yes |

Repo access:

| Person | Access (read / write / admin) | Date |
|---|---|---|
| | | |

---

## 6. Training attendance

**Session A — {{TRAINING_A}}**

| Name | Role | Date | Attended (Y/N) | Signature |
|---|---|---|---|---|
| | | | | |

**Session B — {{TRAINING_B}}**

| Name | Role | Date | Attended (Y/N) | Signature |
|---|---|---|---|---|
| | | | |

Trainer: ______________________  
Duration: ______________________

---

## 7. Documents given

| Document | Given (Y/N) |
|---|---|
| Developer Handbook | |
| Client Operations Manual | |
| UAT pack | |
| This certificate | |
| What is left | |
| Repo access confirmed | |

---

## 8. Known limits (client has read these)

Copy the leftover themes from doc 5. Example:

1. {{LIMIT_1}}
2. {{LIMIT_2}}
3. Test passwords must be **changed** before going public.

Client initials: __________  
Date: __________

---

## 9. Sign-off

| | Name | Signature | Date |
|---|---|---|---|
| Build team | | | |
| Client product owner | | | |
| Client tech owner (if any) | | | |

By signing, the client accepts the **delivered** column in §3 and the open items in [What is left](05-RESIDUAL_AND_NEXT.md).
