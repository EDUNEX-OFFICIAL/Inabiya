# Deliverables framework (reuse on any project)

This is the **standard client pack** for project handover.

| What | Where |
|---|---|
| How to use it (read this) | [`.cursor/skills/project-deliverables/FRAMEWORK.md`](../.cursor/skills/project-deliverables/FRAMEWORK.md) |
| Blank files to copy | [`.cursor/skills/project-deliverables/templates/`](../.cursor/skills/project-deliverables/templates/) |
| Inabiya’s filled pack (example) | [`handover/`](handover/) |

**On a new project:**

```bash
mkdir -p docs/handover
cp /srv/Inabiya/.cursor/skills/project-deliverables/templates/*.md docs/handover/
# Fill every {{PLACEHOLDER}}. Delete sections that do not apply.
```

Same kit is also at:

- `/root/.cursor/skills/project-deliverables/` — Cursor, all projects on this machine
- `/srv/templates/project-deliverables/` — copy from here if you are not in this repo
- **Export zip:** `docs/project-deliverables-bundle.zip` (folder: `docs/project-deliverables-bundle/`)

Default files: README, Developer Handbook, Client Operations Manual, UAT pack, Handover certificate, Residual and next.
