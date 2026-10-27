# Backup and recovery acceptance

## Completed local drill

`node scripts/verify-restore.mjs` creates a disposable database with the actual migrations, a test product, a fixture owner and a simulated order. It snapshots the database, restores into a separate disposable instance, and compares the immutable order/items/address/total/test marker, stock, timeline, owner membership and security history. All six SQL security/integrity suites run again on the restored instance. This drill passed on October 27, 2026. Fixture data never reaches hosted Supabase, and no real user/password/Storage objects are exported.

This verifies the application's snapshot/schema/permission behavior in PGlite. It is not evidence that a hosted PostgreSQL backup, Supabase Auth service or Storage bucket can be recovered successfully.

## Hosted recovery procedure to validate before sales

1. Confirm which backups, retention and point-in-time recovery are actually enabled for the project's current plan. The connected tools do not expose a hosted backup/restore operation; do not assume a paid backup feature is configured.
2. Record who can request recovery, where exports are held outside the repository, and who has access. Never commit database dumps, Auth exports, private files or secrets.
3. Keep a separate inventory of catalog media/Storage files, migrations, application revision and encrypted configuration. Restoring database rows does not prove the corresponding media files or sender credentials are available.
4. Restore an approved backup into a separate isolated recovery target. Do not overwrite the live project for a drill, open ordering or enable email workers on that target.
5. Re-run the SQL assertions and account/owner acceptance, confirm two owners, inventory per size, immutable order totals, event history, private customer boundaries, MFA requirements and unpublished CMS drafts. Validate media availability independently.
6. Compare record counts and selected checksums with the backup manifest. Verify retry/idempotency keys survive restoration before allowing delayed requests to resume. Consider provider deduplication windows before re-enabling an email worker.
7. Document the measured recovery time and data-loss window. Authorize any production cutover separately; rotate compromised credentials when the incident requires it.

The actual hosted restore, restoration of real Auth identities and files, and incident cutover require the project operator and an approved recovery target. No live restore or new paid backup subscription was performed in this session.
