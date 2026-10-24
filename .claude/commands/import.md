---
description: salesforce-data-cloud --source --file --actor [--dry-run] [--update]
---

Read CLAUDE.md. Read docs/replace-salesforce-data-cloud.md. Use import salesforce-data-cloud --source=<code> --file=<saved-export> --actor=<operator> --dry-run first. Reconcile exported counts. Apply only the same reviewed file. Changed existing records require explicit --update, which removes their profile link if identity values changed.

Run `npm run profiles -- import salesforce-data-cloud` with the options shown by `npm run profiles -- help`. Use `--json` for analysis. Supply the operator as `--actor` for writes. Never guess missing dates, identity evidence or preference records.

Present the result from the database. An ambiguous name lists candidates and stops; ask for the exact code before writing. No emails or external actions are part of this command.
