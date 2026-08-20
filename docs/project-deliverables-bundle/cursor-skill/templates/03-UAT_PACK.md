# {{PROJECT}} — UAT pack

Version: {{VERSION}}  
Date: {{DATE}}  
Who this is for: people who test before sign-off

**How to mark:** Pass / Fail / Blocked + a short note.

Base website: {{WEB_URL}}  
API (if needed): {{API_URL}}

Skip this whole file only if the client said they do not want a UAT booklet.

---

## 1. Test accounts

Do not put production passwords here. Staging / seed only.

| Who | Login page | Email or username | Notes |
|---|---|---|---|
| {{WHO_1}} | {{LOGIN_1}} | {{EMAIL_1}} | Password: see {{SEED_FILE}} |

---

## 2. Sample data

| What | Example |
|---|---|
| {{DATA_1}} | {{DATA_1_VALUE}} |
| {{DATA_2}} | {{DATA_2_VALUE}} |

---

## 3. Cases

Copy the row style. Add more cases for **this handover’s scope only**.

| ID | Area | Steps | Expected | Result | Note |
|---|---|---|---|---|---|
| UAT-01 | Login | Open {{LOGIN_1}}. Sign in as {{WHO_1}}. | Lands on {{HOME_1}} | | |
| UAT-02 | Happy path | {{HAPPY_STEPS}} | {{HAPPY_EXPECTED}} | | |
| UAT-03 | Save vs live | {{DRAFT_STEPS}} | Draft is not public. Publish is. | | |
| UAT-04 | Wrong role | Sign in as {{RESTRICTED_ROLE}}. Open {{ADMIN_PATH}}. | Access denied or hidden | | |
| UAT-05 | Fail path | {{FAIL_STEPS}} | {{FAIL_EXPECTED}} | | |

---

## 4. Bug report (one per issue)

```text
ID:
Case ID:
What you did:
What you expected:
What happened:
Screenshot / URL:
Blocker? Yes / No
```
