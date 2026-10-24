# Customer Profiles for Claude Code

Keep customer records from different systems in one database, with reviewed identity links, source evidence, preferences and a weekly data-quality review.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free, MIT. Install and run the demo. | Your source mappings, identity rules, review documents and access needs. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |

[Get your version built](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-data-cloud) · [Instead of Salesforce Data 360](https://enterprisedna.co/omni/instead-of/salesforce-data-cloud)

## Start with a working review

Node 20 or later. No cloud database or vendor credentials needed for the demo.

```bash
git clone https://github.com/Enterprise-DNA-OS/customer-profiles-for-claude-code.git
cd customer-profiles-for-claude-code
npm install
npm run demo
npm run profiles -- duplicates
npm run profiles -- profile --ref=MERE
npm run view
npm run docs
```

Open the folder in Claude Code, Codex, OpenCode or Cursor. AGENTS.md and CLAUDE.md point every runtime to the same recipes. PGlite persists locally under .data/db. DATABASE_URL selects PostgreSQL; DATA_DIR selects a different local directory. Never seed a working customer database.

The fictional Kauri data has three sources, six records, a shared household mailbox, an old address conflict, a withdrawal, overdue reviews and a stale import. Dates are relative to the first seed. Repeated seed runs preserve existing records.

## What the system does

The 27-command CLI supports --json everywhere. Run `npm run profiles -- help` for exact options. References accept exact codes, partial UUIDs and case-insensitive names; ambiguous matches list candidates and exit 1. Records use SOURCE:external-id codes. Every write names its actor.

Monday: /source-health checks imported coverage, /duplicates brings possible matches to review, /conflicts checks existing links, /consent-review reads preference evidence, and /retention-review checks the business's review dates. /weekly-review combines source health, identity conflicts, overdue actions and privacy findings. /add-action assigns the next job; /close-action requires evidence. /draft-review writes a local draft and never sends.

Source records remain separate. Same-email candidates are suggestions, never automatic merges. /create-profile and /link record the operator's evidence. /unlink reverses a mistaken link without deleting the source record. Conflicting emails and names remain visible; the base does not silently pick a winning value. An imported identity change removes the old link and records why in the audit history.

Preferences are scoped to profile, channel and purpose. Latest observed date wins. On the same date, denied wins over unknown, then granted, regardless of import order. Missing preferences mean no evidence, not permission. The CLI does not produce a send-authorised audience or contact a destination.

This is an offline customer-profile review system. It does not replace Data 360's entire platform, live ingestion, activation, streaming or infrastructure. Data 360 already supports identity resolution and analysis. The reason to use this build is ownership of a narrower workflow and rules you can change. No claim is made that the vendor cannot answer these questions.

## Ten questions this build answers

1. Which source has stopped arriving? `source-health`.
2. Which source has no accountable owner? `compliance`.
3. Which records share an email but have different names? `duplicates`.
4. Which reviewed profile has conflicting email addresses? `conflicts`.
5. Who linked this source record and on what evidence? `profile --ref=MERE`.
6. Which newsletter preference is the latest, including a withdrawal? `consent-review`.
7. Which source records have reached our retention review date? `retention-review`.
8. Which indirect-collection notices still need review? `compliance`.
9. Which review actions are overdue and who owns them? `attention`.
10. Which identity changes broke a previous profile link? `audit`.

## Bring your history

Have your authorised Data 360 operator export Query API V2 responses using the documented projection. Obtain every batch, preserving query IDs and completion flags. A mapped CSV with the same columns also works. The on-screen preview is not a complete export.

```bash
npm run profiles -- add-source --code=LIVE --name="Customer history" --owner="Data owner" --purpose="Customer service" --jurisdiction=NZ --notice="Approved collection notice reference" --actor="Operator"
npm run profiles -- import salesforce-data-cloud --source=LIVE --file=imports/query.json --actor="Operator" --dry-run
npm run profiles -- import salesforce-data-cloud --source=LIVE --file=imports/query.json --actor="Operator"
```

The import command handles the saved export, not vendor authentication. Read [the export and mapping guide](docs/replace-salesforce-data-cloud.md) before the first import. The sample fixture is synthetic and follows the documented response envelope. A real business export must be reconciled before adoption. Files load into memory; no enterprise-scale throughput claim is made.

Identical records are skipped. Changed rows reject the complete batch unless you explicitly add --update. Updates preserve before-and-after evidence. A changed name, email or country removes that record's existing profile link for review. Imports preserve source properties, but do not migrate vendor matching rules, unified IDs, consent records or segments automatically.

## Documents and views

Set business name, logo and colours in brand.json. `npm run docs` renders a source purpose and retention register plus one profile review record per profile. `npm run view` renders the weekly review and duplicate-review queue. They are branded, read-only HTML snapshots with escaped content and print styles. Review scope before sharing: these files contain the records available to the trusted database operator.

## Your first hour: ten things to ask for

1. Put our name and logo on the source register.
2. Import a sample export without saving it.
3. Reconcile its count with the original query.
4. Record the owner and purpose for every source.
5. Agree which evidence makes two records the same person.
6. Review shared-email candidates before linking them.
7. Record withdrawal evidence without creating a contact list.
8. Set retention review dates under our actual policy.
9. Assign the oldest unresolved identity review.
10. Add our internal customer reference to the profile record.

/customise tests a forward migration on temporary data before applying it. /new-view extends the existing renderer. [What a front end adds](docs/why-no-front-end.md).

## Tests and operation

`npm test` exercises every command on temporary data, including import rollback, incomplete batches, repeat imports, identity change unlinking, ambiguous references, preference conflicts, generated documents and escaped HTML. CI defines Linux and Windows Node 20/22 jobs plus PostgreSQL 17. Check actual CI results; a workflow file is not evidence those environments passed.

This is a single-business trusted-operator tool. Table access is closed to public database roles; there is no tenant isolation or staff login system. Use the database owner for local operation and scope production access explicitly. [Privacy checks and sources](docs/compliance.md) · [Operations and backup](docs/operations.md) · [Selection research](docs/research.md).

## Built and run for you

Enterprise DNA maps the agreed source history, adds your review rules, builds a web view or different stack when needed, and operates your version through Omni by Enterprise DNA. One setup fee, then a retainer. Hosting and agent usage have their own costs.

[Book 30 minutes with Sam](https://enterprisedna.co/omni/book/?offer=replace-software&utm_source=github&utm_medium=readme&utm_campaign=salesforce-data-cloud).

MIT. Not affiliated with Salesforce or Anthropic.
