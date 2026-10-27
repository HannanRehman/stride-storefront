# Backup and recovery acceptance

## Dashboard evidence — October 27, 2026, 23:15 Pakistan time

The operator supplied a screenshot of this project's **Database → Backups → Scheduled backups** page. It shows the organization on **Free** and explicitly states that the Free plan does not include project backups, with an offer to upgrade to Pro for up to seven days of scheduled backups. Therefore managed scheduled backups are not available on the current plan; this is no longer an unknown billing/availability question. No managed backup restore could be tested from that screen, and no upgrade was performed.

Available next paths are an operator-approved plan with managed backups, or a separately configured, securely stored off-site database export plus an isolated restore test. A GitHub source checkout and the passing disposable fixture restore do not back up the hosted Auth identities or current database rows. Storage files need their own backup. No manual export was performed because direct database/Management API credentials are not configured. Hosted recoverability remains unverified until a real backup is created/accessed and restored successfully into an isolated target.

## Hosted inspection — October 27, 2026

Requested after deployment of the dedicated owner MFA sign-in flow. Read-only inspection at 18:09 UTC found PostgreSQL 17.11, 37 catalog records, zero orders/order events/email jobs, two Auth users, two owner memberships (one enrolled in MFA), zero catalog-media Storage object records and RLS enabled on every public base table. These are baseline counts, not a backup or proof of recoverability. Uploaded-object metadata alone does not verify file contents.

The connected Supabase MCP exposes SQL, migrations and branches, but no backup inventory, project billing/retention or backup restore operation. Its branch listing returned none. No Management API access token, direct database URL/password, PostgreSQL dump/restore tools or Docker executable was configured in the checked local environment. No stored OAuth token was extracted as a substitute, no private records were exported and no paid recovery project was created.

**Result: hosted backup availability and recoverability remain unverified, rather than passed or known absent.** The operator was asked to inspect the project's [Database → Backups page](https://supabase.com/dashboard/project/simfvguqxbqevvrgkkdp/database/backups). Needed evidence: whether backups are offered, the latest successful backup time, accessible retention and whether an isolated restore target is available. A dated backup list would establish inventory only; an actual isolated restoration is still required to prove recovery.

Official documentation says managed daily backups are available for Pro/Team/Enterprise projects, while Free projects should keep their own off-site exports. No billing plan was inferred from the user's Vercel team account. Supabase's restore-to-new-project feature requires a supporting paid plan and can incur additional project costs. No upgrade or paid clone was authorized by this read-only check. [Backup documentation](https://supabase.com/docs/guides/platform/backups), [isolated project restore](https://supabase.com/docs/guides/platform/clone-project).

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
