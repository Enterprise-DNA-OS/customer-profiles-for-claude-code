# Move customer profile history from Salesforce Data 360

Salesforce renamed Data Cloud to Data 360. The import identifier remains `salesforce-data-cloud` so existing search and export terminology stays clear.

## Export the records you actually need

Use an authorised Data 360 operator and an approved collection purpose. Salesforce's [Query API V2](https://developer.salesforce.com/docs/data/data-cloud-query-guide/references/data-cloud-query-api-reference/c360a-api-query-v2.html) returns JSON objects in `data`, with `rowCount`, `queryId`, `done` and `nextBatchId`. Salesforce recommends its newer Query API for new integrations; this importer deliberately supports the documented V2 response envelope. It makes no network calls.

The operator selects the source object and projects these six text columns. These are our import aliases, not claims that every Salesforce object has these names:

| Alias | Map from |
|---|---|
| record_id | Stable source record identifier, unique within the registered source |
| full_name | The source's recorded full name, empty if absent |
| email | Source email, empty if absent |
| country | Two-letter country code, empty if absent |
| collected_on | Actual collection date as YYYY-MM-DD |
| retention_until | Review date under your approved policy as YYYY-MM-DD |

Use explicit column aliases in the query, or map the saved file to these headers. Do not invent a collection date or retention period to make a file pass. If the original system does not hold them, establish the missing evidence with the data owner first. Choose one authoritative email per source row or split different contact-point records using stable distinct identifiers; joins must not multiply record_id values.

Save the initial response, then retrieve each remaining batch using its nextBatchId until done is true. The vendor requires retrieving the complete result within one hour and no more than three minutes between batch calls. Store multiple response objects as a JSON array in request order. All query IDs must match. A single complete response can be stored directly. Preserve the original export securely for reconciliation.

[Data Explorer](https://help.salesforce.com/s/articleView?id=data.c360_a_view_your_data.htm&language=en_US&type=5) displays at most 100 rows. Copying its preview does not establish a complete export. Check query filters, data space, selected sources and date range with the operator. The importer validates supplied batch flags and row counts; it cannot independently prove no source rows were excluded by the query.

A mapped CSV with these headers is also supported. It has no vendor pagination metadata, so the operator must confirm completeness. BOM, CRLF, embedded newlines and quoted commas work. Duplicate headers, unequal row widths, duplicate record IDs and malformed quotes fail.

## Import in one command

Register each source once with add-source. After reconciling the dry run:

```bash
npm run profiles -- import salesforce-data-cloud --source=LIVE --file=imports/query.json --actor="Operator"
```

First add --dry-run to test without saving. Imports are transactional. Repeating a file skips identical rows. Changed existing rows reject the entire file. After reviewing the change, --update replaces source values and preserves audit evidence. Changed identity fields remove the old profile link. Records absent from a later file remain stored; there is no delete-by-omission behaviour.

## What moves and what needs mapping

The six projected fields and additional source properties move. Reviewed profile memberships, matching rules, segments, calculated insights, identity graphs, preference history, connectors and activation destinations do not move automatically. Our profile codes are local references, not the vendor's unified identifiers. Bring preference evidence through record-consent with its actual purpose, channel and observation date. For large preference history, scope a separate tested mapping before adopting the system.

Reconcile records per source, null names and email counts, review dates, sample identities and source properties. Try a shared mailbox, a changed address and a withdrawal. Keep the existing process working until the agreed replacement has passed those checks. The source is retained; this tool does not contact or change Salesforce.

Sources checked 24 October 2026. The fixture in test/fixtures/data-cloud-query.json is synthetic, not a claimed customer export.
