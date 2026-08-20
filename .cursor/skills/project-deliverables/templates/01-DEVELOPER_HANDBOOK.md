# {{PROJECT}} — Developer Handbook

Version: {{VERSION}}  
Date: {{DATE}}  
Who this is for: engineers, hosting staff, future vendors

Also read: [What is left](05-RESIDUAL_AND_NEXT.md) and the [Handover certificate](04-HANDOVER_CERTIFICATE.md).

---

## 1. What you are taking over

| Part | What it does | URL |
|---|---|---|
| {{SURFACE_1}} | {{SURFACE_1_JOB}} | {{URL_1}} |
| {{SURFACE_2}} | {{SURFACE_2_JOB}} | {{URL_2}} |
| API | Backend that stores the real data | {{API_BASE}} |

Code: {{REPO_URL}}  
Server folder: {{SERVER_PATH}}

---

## 2. How the system is built

```text
{{BROWSER_OR_APP}}
   → {{WEB_APP}}
      → {{API}}
         → {{DATABASE}}
         → {{CACHE_OR_QUEUE}}
```

Rules that must not be broken:

- {{RULE_1}}
- {{RULE_2}}

---

## 3. Locked tech

| Layer | Use this |
|---|---|
| Language | {{LANG}} |
| Website | {{WEB_STACK}} |
| API | {{API_STACK}} |
| Database | {{DB}} |
| Cache / jobs | {{CACHE}} |
| Packages | {{PKG}} |

---

## 4. Environments and ports

| Address | What | When |
|---|---|---|
| {{PROD_WEB}} | Website | Production |
| {{PROD_API}} | API | Production |
| {{DEV_WEB}} | Website | Local |
| {{DEV_API}} | API | Local |

Health: `GET {{HEALTH_URL}}`

---

## 5. How to run it

Need: {{PREREQS}}

```bash
{{BOOT_COMMANDS}}
```

Deploy:

```bash
{{DEPLOY_COMMAND}}
```

### Env names (not the secret values)

| Name | Meaning |
|---|---|
| {{ENV_1}} | {{ENV_1_MEANING}} |
| {{ENV_2}} | {{ENV_2_MEANING}} |

Never commit `.env`.

---

## 6. API (short map)

Base path: {{API_PREFIX}}

Auth: {{AUTH_HOW}}

| Topic | Paths |
|---|---|
| Health | {{HEALTH_PATHS}} |
| Login | {{AUTH_PATHS}} |
| {{DOMAIN_1}} | {{DOMAIN_1_PATHS}} |

Error shape (if you have one):

```json
{{ERROR_JSON_EXAMPLE}}
```

---

## 7. Who is allowed to do what

| Action | Who |
|---|---|
| {{ACTION_1}} | {{ROLE_1}} |
| {{ACTION_2}} | {{ROLE_2}} |

Load a record by id **and** check owner/role. Do not trust an owner id from the client.

---

## 8. If something breaks

**Backup:** `{{BACKUP_CMD}}`  
**Rollback:** `{{ROLLBACK_CMD}}`  
**Who to call:** {{ONCALL}} (replace with real names before public launch)

---

## 9. Security (simple)

| Topic | Today |
|---|---|
| {{SEC_1}} | {{SEC_1_STATUS}} |
| {{SEC_2}} | {{SEC_2_STATUS}} |

---

## 10. Login pages

| Page | Path | Who may enter |
|---|---|---|
| {{PORTAL_1}} | {{PORTAL_1_PATH}} | {{PORTAL_1_ROLES}} |

---

## 11. Not finished in this handbook

See [What is left](05-RESIDUAL_AND_NEXT.md).
