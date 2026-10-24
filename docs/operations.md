# Operate and recover the database

Use one business per database and a trusted operator. PGlite uses DATA_DIR or .data/db. DATABASE_URL selects PostgreSQL with TLS certificate verification for remote hosts. Public database roles have no table grants and row security has no public policies. The owner can access every record. This is not a staff authentication or multi-tenant service.

Keep production personal information out of git. Imports, exports, drafts and generated reports are ignored. Generated files use restrictive filesystem permissions where supported. Agree retention for the audit history, which includes old values and identity evidence. The tool never silently purges a record.

Before a migration, close PGlite and copy its entire data directory to protected backup storage. Restore that copy into a separate directory, set DATA_DIR to the restored location and reconcile source and profile counts. Never copy a running PGlite directory. For PostgreSQL, use your managed backup or pg_dump/pg_restore process and test recovery in a separate database. Do not run demo seed on production.

`npm run profiles -- export --file=exports/archive.json` writes all domain records under one consistent read transaction. It refuses to overwrite an existing file. The JSON archive is portable evidence, not a database backup or a one-command restore format. Keep the original source exports separately under the same access controls.

`npm test` uses temporary PGlite storage. TEST_DATABASE_URL instead requires a disposable empty PostgreSQL database and refuses a populated one. The PostgreSQL CI service is thrown away after the job. Do not point it at business data.

For production-scale imports, measure file size, memory, runtime and backup recovery before committing to a migration window. This version reads the complete import into memory and runs one transaction. It has no load-tested volume promise, background importer or live connector.
