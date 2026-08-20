# Project deliverables framework

Version: 1.0.0  
Use this on **every** software handover, not only one product.

Copy the files in `templates/` into the project as `docs/handover/`.  
Replace `{{…}}` with real facts. Delete sections that do not apply.

If you use Cursor, also load the skill `project-deliverables`.

---

## 1. Why this exists

Clients get confused when each project ships a different pile of files.  
This is one **standard pack**. Same numbers. Same jobs. Same honesty.

You are handing over **what was built for this scope**. You are not claiming the whole company vision is live.

---

## 2. The five documents

| # | Name | Job | Skip? |
|---|---|---|---|
| 1 | Developer Handbook | How to run, change, and repair the system | No |
| 2 | Client Operations Manual | How staff use it every day | No |
| 3 | UAT pack | How to test before sign-off | Only if the client says skip |
| 4 | Handover certificate | Scope vs delivered + signatures | No |
| 5 | Residual and next | What is not done, in what order | No |

Always add a short `README.md` that lists the files and the scope in five lines.

### What is *not* a default document

Put these **inside** 1, 2, or 4 unless the client asks for a separate file:

- API list
- Runbooks (backup, rollback, secrets)
- Roles
- Training attendance
- Test logins (staging only)
- Design notes

Do **not** give the client your internal progress log, full requirements dump, or chat history.

---

## 3. Folder and names

```text
docs/handover/
  README.md
  01-DEVELOPER_HANDBOOK.md
  02-CLIENT_OPERATIONS_MANUAL.md
  03-UAT_PACK.md                 # omit only if skipped
  04-HANDOVER_CERTIFICATE.md
  05-RESIDUAL_AND_NEXT.md
```

Keep the numbers. People learn “4 is the sign sheet”.

---

## 4. How to write (all files)

1. **Simple English.** Short sentences. Common words. No slang mix.
2. **Lead with the answer.** First screen: what this file is for.
3. **Tables over essays.** Delivered / not delivered must be a table.
4. **Facts only.** URLs, roles, and commands must match the repo today.
5. **Blanks for humans.** Names, signatures, production passwords stay empty in git.
6. **No secrets.** No live keys. No `.env` paste. Seed passwords: say where they live, do not put them on a public website.
7. **One scope.** If the client should not run a half-built module, **leave it out** of docs 2 and 4. A one-line note in doc 5 is enough only if they might see the screen anyway.
8. **Simple client flows.** Prefer “this item, this quantity, this amount” over long status machines (ordered / received / paid to vendor) unless the client asked for that machine.
9. **Launch is a claim.** Do not say “production live” if public https, real email, or live payments are still test/stub.

---

## 5. What each file must contain

### README

- Project name and date
- Three to six bullets: what this handover **covers**
- Table of the five docs
- One honest warning if launch extras are still open (payments, email, public domain, …)

### 1 — Developer Handbook

Fill only what exists:

1. What they are taking over (surfaces + URLs)
2. How the system is built (picture in text is enough)
3. Locked tech (language, web, API, database, …)
4. Environments and ports (do not mix prod and local)
5. How to run and deploy
6. Env **names** (not secret values)
7. API map (short)
8. Data / money rules if any
9. Who may do what (roles)
10. If something breaks (backup, rollback, queues)
11. Security notes (what is done vs not)
12. Login portals
13. Pointer to doc 5 for leftovers

### 2 — Client Operations Manual

No code. Staff language.

1. Where to log in (right page for each role)
2. Who can do what
3. Menu of screens they will use
4. Daily playbooks (start of day, main jobs, publish vs save)
5. Short do / don’t
6. What to do when stuck

Delete any menu row the client should not use.

### 3 — UAT pack

1. Base URL
2. Test accounts (or “see seed file”)
3. Sample data
4. Cases with id, steps, expected result, Pass / Fail / Blocked
5. How to report a bug (one short template)

Cover the **scope in the README**, not the whole future product.

### 4 — Handover certificate

1. Parties (blank names)
2. Scope of **this** pack
3. Scope vs delivered table (must match docs 1–2 and 5)
4. Environments checklist
5. Access: staging pointer + blank production table
6. Training attendance tables
7. Documents given
8. Known limits (client initials)
9. Signatures

### 5 — Residual and next

One section per open item. Typical launch leftovers:

- Live payments
- Real email
- Public DNS / https
- Real file storage
- Outside security test

Each section: **today**, **what that means**, **next steps**, **owner**, **depends on**.

End with a numbered order of work. Payments on the public internet come **after** https.

If a leftover is “we might build a simple stock buy later”, write one line: product + quantity + amount. Do not invent a vendor portal.

---

## 6. How to produce a pack (people or agent)

```text
1. Freeze scope in one sentence.
2. Walk the real screens and APIs. Do not trust old docs alone.
3. Write residual (5) first — this keeps the certificate honest.
4. Write 1 and 2.
5. Write 3 unless skipped.
6. Write 4 last, copying the delivered / not-delivered rows from 5.
7. Read README + 4 + 5 together. They must agree.
8. Human fills names, training, production logins offline.
```

Time box: a normal web app pack is these five files, not a 200-page book.

---

## 7. Send-day checklist

- [ ] Scope in README matches the certificate
- [ ] Every “delivered” row is true in the running app
- [ ] Every stub (pay, mail, https) is in residual **and** known limits
- [ ] No production passwords in the repo
- [ ] Test users are labelled staging
- [ ] Client manual has no engineer-only pages
- [ ] Training tables are blank and ready to sign
- [ ] Repo / server path is written once and correct

---

## 8. Copy this into a new project

```bash
mkdir -p docs/handover
cp /path/to/project-deliverables/templates/*.md docs/handover/
# then fill {{placeholders}}
```

On this VPS:

- Skill + templates (this repo): `/srv/Inabiya/.cursor/skills/project-deliverables/`
- Same copy for any project: `/srv/templates/project-deliverables/`
- Cursor personal skill: `~/.cursor/skills/project-deliverables/`

---

## 9. Worked example (pattern only)

Inabiya shop handover used this pack: docs 1, 2, 4, 5. Doc 3 skipped by request.  
Supplier purchase orders were **removed** from the client pack because the client only needed “product, quantity, amount” in stock. That is the right use of rule 4.8: keep client flows small.
