# Customer Profiles for Claude Code

Read this file in Claude Code, Codex, OpenCode or Cursor. This is a trusted operator's customer data review workspace. One business per database. Fill in your business, accountable data owner, approved purposes and retention policy before importing personal information.

## Work from evidence

Run the CLI before answering a question. Keep source records distinct until a person has reviewed identity evidence. An email address shared by a household or business is not proof of identity. Never infer a grant of permission from an imported profile. No command sends messages or deletes customer records. Drafts stay local.

## Routes

| Job | Recipe |
|---|---|
| List commands and options | /help |
| Source ownership and purpose | /sources |
| Source records and profile links | /records |
| Reviewed profiles and conflicting values | /profiles |
| One profile with source lineage (--ref) | /profile |
| Same-email candidates requiring human review | /duplicates |
| Profiles with conflicting identity values | /conflicts |
| Latest recorded preferences; not permission to send | /consent-review |
| Records past their operator-set review date | /retention-review |
| Import freshness and unlinked counts | /source-health |
| Overdue review actions | /attention |
| All review actions | /actions |
| Privacy and accuracy review findings | /compliance |
| Operator change history | /audit |
| Source health, conflicts and attention | /weekly-review |
| --code --name --owner --purpose --jurisdiction --notice --actor [--freshness-days] | /add-source |
| --source --external-id --name --email --country --collected-on --retention-until --actor | /add-record |
| --code --name --actor | /create-profile |
| --record --profile --reason --actor | /link |
| --record --reason --actor | /unlink |
| --profile --channel --purpose --decision --observed-on --evidence --actor | /record-consent |
| --code --name --owner --due-on --actor | /add-action |
| --ref --evidence --actor | /close-action |
| --note --actor | /log |
| salesforce-data-cloud --source --file --actor [--dry-run] [--update] | /import |
| --file (full JSON archive, no overwrite) | /export |
| --file (under drafts/, no send or overwrite) | /draft-review |
| Add a field or rule | /customise |
| Add a read-only report | /new-view |

## Operating rules

- Use exact codes, partial UUIDs or case-insensitive names. Ambiguity lists candidates and exits 1. Never choose a person by guesswork.
- Every write requires --actor. Read the complete profile and source history before linking or changing records. Changes to name, email or country during import remove the prior link for review.
- Import a reviewed export after a dry run. The database transaction either commits the entire file or none of it. --update is an explicit replacement of changed source values with an audit history.
- Preferences are evidence by channel and purpose. Denied beats unknown and granted on the same date. They do not implement all marketing, disclosure or consent laws.
- Compliance findings support the data owner. Never claim certification. Retention dates and freshness limits are business settings, not statutory periods.
- No automatic purge. Deletion, external disclosure and sending require the business's own authorised process. Audit history also contains personal information and belongs in the retention policy.
- Do not put private imports, exports, credentials or generated reports in git.

## Files and verification

One CLI: scripts/profiles.mjs. Database adapter: scripts/lib/db.mjs. PostgreSQL via DATABASE_URL, otherwise local PGlite. Migrations: supabase/migrations. Demo: supabase/seed.sql. Templates: views.json, documents.json, brand.json. Do not seed a working business database.

Run npm test before changing working data. Tests use a temporary database, or a deliberately empty TEST_DATABASE_URL. Back up before forward migrations. Read docs/operations.md for access, backups and recovery.

Built and run through Omni by Enterprise DNA: https://enterprisedna.co/omni/book/?offer=replace-software&utm_campaign=salesforce-data-cloud
