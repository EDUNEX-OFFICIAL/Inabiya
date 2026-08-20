# Project deliverables bundle

**Version:** 1.0.0  
**What this is:** a standard set of files you give a client when a project is ready to hand over.  
**How to export:** zip this whole folder. That zip is the kit. Take it to any other project.

Open **this file first**. Then copy `templates/` into the new project and fill the blanks.

---

## 1. What is inside

```text
project-deliverables-bundle/
  README.md                 ← you are here (how to use)
  FRAMEWORK.md              ← full rules (read once)
  templates/                ← blank files for a NEW project
  examples/inabiya-shop/    ← one filled example
  cursor-skill/SKILL.md     ← optional, for Cursor
```

You always ship **the same five documents** (plus a short index):

| # | File | Who reads it | Skip? |
|---|---|---|---|
| — | `README.md` | Everyone | No |
| 1 | `01-DEVELOPER_HANDBOOK.md` | Engineers, hosting | No |
| 2 | `02-CLIENT_OPERATIONS_MANUAL.md` | Staff who use the product | No |
| 3 | `03-UAT_PACK.md` | Testers | Only if the client says skip |
| 4 | `04-HANDOVER_CERTIFICATE.md` | People who sign | No |
| 5 | `05-RESIDUAL_AND_NEXT.md` | What is not done yet | No |

---

## 2. Export this kit

### From the folder

On Linux / macOS:

```bash
cd /path/to/project-deliverables-bundle
cd ..
zip -r project-deliverables-bundle.zip project-deliverables-bundle
```

On Windows: right-click the folder → **Compress to ZIP**.

Send or copy `project-deliverables-bundle.zip`. Unzip on the next machine. You do not need Inabiya, Git, or Cursor for the templates to work.

A zip may already sit next to this folder: `docs/project-deliverables-bundle.zip`.

---

## 3. Use it on a new project

### Step 1 — Copy blanks

```bash
mkdir -p docs/handover
cp /path/to/project-deliverables-bundle/templates/*.md docs/handover/
```

Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force docs/handover
Copy-Item \path\to\project-deliverables-bundle\templates\*.md docs\handover\
```

### Step 2 — Freeze scope

In `docs/handover/README.md` write 3–6 bullets: **what this handover covers**.  
Do not include a half-built module the client should not run.

### Step 3 — Fill in this order

1. `05-RESIDUAL_AND_NEXT.md` first (keeps you honest)
2. `01-DEVELOPER_HANDBOOK.md`
3. `02-CLIENT_OPERATIONS_MANUAL.md`
4. `03-UAT_PACK.md` (or delete it and the README row if skipped)
5. `04-HANDOVER_CERTIFICATE.md` last — copy delivered / not-delivered from file 5
6. Pack `README.md` — must match files 4 and 5

### Step 4 — Replace placeholders

Templates use `{{LIKE_THIS}}`. Search for `{{` and replace every one.

| If you do not know a fact | Do this |
|---|---|
| A URL, role, or command | Look in the repo. Do not guess “done” |
| A person’s name or signature | Leave blank for a human |
| A production password | Never put it in git. Leave the table empty |

### Step 5 — Send-day check

- [ ] README scope = certificate scope
- [ ] Every **Delivered** row is true in the running app
- [ ] Every stub (pay, mail, public https, …) is in file 5 **and** in certificate known limits
- [ ] No live secrets in the files
- [ ] Test users are labelled staging
- [ ] Client manual has no engineer-only screens
- [ ] Training tables are blank and ready to sign

Then humans fill names, training, and production logins **offline**.

---

## 4. Writing rules (short)

1. Simple English. Short sentences. Common words.
2. Two audiences: builders = file 1. Operators = file 2. Do not mix.
3. Use tables for delivered / not delivered.
4. Facts only. URLs and commands must match the project today.
5. Client flows stay small. Example: “this item, this quantity, this amount” — not a long ordered / received / paid-to-vendor chain unless the client asked for that.
6. Do not paste internal progress logs or a full requirements dump.
7. Do not say “public launch is complete” if https, live payments, or real email are still test/stub.

Full rules: `FRAMEWORK.md`.

---

## 5. What each file is for

**README** — one screen. What is in. What is out.

**1 Developer Handbook** — how to run, ports, env *names* (not secret values), short API map, backup, rollback, who may do what.

**2 Client Operations Manual** — login pages, roles, daily steps. No code. Delete menu rows the client should not use.

**3 UAT pack** — test accounts, sample data, pass/fail cases for **this scope only**.

**4 Handover certificate** — sign-off. Same truth as files 1, 2, and 5.

**5 Residual and next** — what is left, who owns it, in what order. Live payments on the public internet come **after** https.

---

## 6. Optional: Cursor

If the next project uses Cursor:

```bash
mkdir -p ~/.cursor/skills/project-deliverables
cp FRAMEWORK.md ~/.cursor/skills/project-deliverables/
cp cursor-skill/SKILL.md ~/.cursor/skills/project-deliverables/SKILL.md
cp -R templates ~/.cursor/skills/project-deliverables/
```

Then ask: “write the project deliverables pack”. The skill tells the agent to use this same kit.

You can skip this and fill the templates by hand.

---

## 7. Filled example

`examples/inabiya-shop/` is one real pack (shop + commerce ops + CMS).  
UAT (file 3) was skipped on request. Use it to see tone and honesty, not to copy Inabiya URLs into another product.

---

## 8. Do not put in the pack

- `.env` files or live API keys
- Production passwords
- Database dumps
- Internal engineering memory / chat logs
- Unfinished admin screens the client should not operate
