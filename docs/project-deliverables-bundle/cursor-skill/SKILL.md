---
name: project-deliverables
description: >-
  Builds a standard client handover pack for any software project: developer
  handbook, client operations manual, optional UAT pack, handover certificate,
  and residual/next list. Use when the user asks for project deliverables,
  handover documents, client pack, go-live docs, sign-off papers, or a reusable
  delivery framework for another project.
---

# Project deliverables

Reusable pack. Not Inabiya-only. Copy templates, then fill with **facts from this repo**.

Full standard: [FRAMEWORK.md](FRAMEWORK.md)  
Blank files: [templates/](templates/)

## When you start

1. Read [FRAMEWORK.md](FRAMEWORK.md).
2. Ask (or infer) **scope**: which products/modules are in *this* handover. Do not include unfinished work the client should not run.
3. Target folder in the current project: `docs/handover/` (create if missing).
4. Copy templates. Rename with the project name only in the title, not the file numbers.
5. Fill from the repo. If a fact is unknown, leave a blank for a human. Never invent “done”.

## Default pack

| # | File | Who |
|---|---|---|
| 0 | `README.md` | Everyone — index |
| 1 | `01-DEVELOPER_HANDBOOK.md` | Engineers, hosting |
| 2 | `02-CLIENT_OPERATIONS_MANUAL.md` | Staff who use the product |
| 3 | `03-UAT_PACK.md` | Testers — **include unless the user skips it** |
| 4 | `04-HANDOVER_CERTIFICATE.md` | Leads who sign |
| 5 | `05-RESIDUAL_AND_NEXT.md` | What is not delivered |

Do not add extra PDFs unless the user asks (SLA, architecture dump, API spec). Prefer those as short sections inside 1 or 5.

## Writing rules

- Simple English. Short sentences. Common words. No Hinglish in the files.
- Two audiences: **builders** (doc 1) and **operators** (doc 2). Do not mix.
- Honest table: Delivered / Not delivered / Out of scope.
- No secrets, no production passwords in git. Test logins: point to seed files, do not print them on a public page.
- No internal engineering memory dumps, no full PRD paste.
- Client workflows stay small. If a module is a long “ordered / received / paid” chain and the client only needs “this item, this qty, this amount”, document the simple version or omit the module.
- Do not claim public launch if https, live payments, or real email are still stubs.

## Fill order

1. README — scope in one screen.
2. Residual — write this **before** the certificate so “not delivered” is true.
3. Developer handbook — how to run, ports, env names (not values), API map, backup, who may do what.
4. Client operations manual — login pages, roles, daily steps. No code.
5. UAT pack — if included: accounts, happy paths, how to mark pass/fail.
6. Certificate — same scope as README; blanks for names, training, prod logins.

## Done

- Pack is internally consistent (same URLs, same “not delivered” list).
- Certificate § known limits matches residual.
- Point the user to `docs/handover/README.md`.
- If this repo has a living memory/progress file, log that handover docs were written. Do not mark a coding phase complete just because docs exist.
