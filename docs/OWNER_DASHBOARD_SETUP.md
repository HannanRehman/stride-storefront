# Owner dashboard setup

October 27 update: product management was deployed at `2a488ef`. The newer [checkout/order work](./CHECKOUT_ORDERS_SETUP.md) and [store operations](./STORE_OPERATIONS_SETUP.md) add order management, private requests, homepage CMS, launch interest and readiness; all three new migrations are applied and verified. The owner authorized this tested release's push/deployment. Earlier activation notes below describe the prior product milestone.

This milestone builds product management. Homepage CMS, checkout, payments, orders and public brand settings remain separate work. Nothing here requires a final brand name or real assortment.

## What is implemented

- `/admin`: owner-only overview and product counts.
- `/admin/products`: searchable, paginated draft/published product list.
- Product editor: create private drafts, edit prices/currency, photos, sizes, stock, copy and organization; preview saved drafts; explicitly publish, save live edits and unpublish.
- Up to six photos with descriptions, labels and primary-photo selection. Uploads validate actual JPEG/PNG/WebP content, reject animation, restrict input to 4 MB and 24 million pixels, strip metadata and optimize to WebP. The 4 MB limit fits within the deployment platform's request-body limit.
- Published URLs stay fixed; version checks prevent overwriting another session's edits. Unconfirmed saves preserve edits and require reloading authoritative data rather than blindly repeating writes.
- Existing customer access stays separate. Two designated accounts will receive full owner access; there is no public role assignment or staff-management UI.
- New products default to PKR; existing USD demo prices are preserved. Bag line prices and subtotals respect currency and never combine USD and PKR.
- Public routes retain their URLs inside the `(store)` route group. Admin pages have separate navigation, native scrolling, no shopping provider, private uncached responses and noindex metadata.

## Hosted activation status — October 26, 2026

The owner approved hosted setup. Migrations `20261025211834_owner_products` and `20261025211936_owner_catalog_read_policy` are applied to project `simfvguqxbqevvrgkkdp`, with their UTC versions mirrored in local filenames. Product-photo storage is configured. Both designated accounts are registered, email-confirmed and have verified owner membership. No user email addresses or real account UUIDs are committed in this guide.

Both hosted SQL assertion suites passed in rolled-back transactions, and follow-up checks found no test accounts or products left behind. All 36 published demo products remain. That dashboard application and security patch were subsequently pushed and deployed; the latest completion work is documented in the current guides above.

The security advisor reports leaked-password protection disabled; enable it in Supabase Auth's password security settings when available for this project. The connected MCP tools do not expose Auth configuration updates. The performance advisor now reports only three existing unused-index notices; retain those catalog/FK indexes for their intended queries. The duplicate read-policy warning introduced during setup was resolved by the follow-up migration.

## Setup and remaining acceptance checks

1. For a new project, apply both owner migrations after the catalog and account migrations. **Do not apply them again to the connected project.** They extend the existing catalog, add protected owner membership, preserve USD prices, allow PKR, enforce stock/URL invariants and provision `catalog-media` storage policies. They do not create orders or checkout inventory reservations.
2. Both designated owners are already registered, confirmed and granted membership in the connected project. For any future owner, confirm the account's UUID against the intended email before granting membership. Never use editable user metadata to decide who is an owner.
3. For a new project, bootstrap membership using trusted database access. Replace both placeholders with verified UUIDs. Both designated owners are already activated on the connected project:

   ```sql
   insert into public.store_owners (user_id)
   values ('<VERIFIED_OWNER_USER_ID_1>'::uuid),
          ('<VERIFIED_OWNER_USER_ID_2>'::uuid)
   on conflict (user_id) do nothing;
   ```

   Do not put email addresses, privileged keys or passwords in public code. Membership grants full product-management access. Revoke an owner's access by deleting their membership through trusted database access; each API call checks current membership again.
4. Sign in using each designated account and open `/admin`. Test a private draft, upload, reload, preview, publication, stock edit and unpublication. Confirm an ordinary customer and anonymous session cannot read drafts, write products, upload files or assign owner access directly through the database API.
5. Publish only approved products with confirmed prices and stock. The navy set still exists as a presentation overlay; a published database record with its ID or slug takes precedence. Unpublishing that database record can reveal the non-purchasable preview again, so remove the overlay separately when retiring the preview for launch.
6. Check storefront refresh, image optimization against real Supabase Storage, account bag/favorites in both currencies, and owner-session expiry after deployment. Commit, push and deploy only when explicitly requested.

## Permissions and operational limits

- `store_owners` allows authenticated users to read only their own membership and grants no app-client writes. Catalog insert/update policies require membership. There is no authenticated hard-delete privilege.
- Storage insert policies require membership and a path beginning with the caller's UUID. Public photo URLs are readable even for unpublished products; draft descriptions/prices are owner-only. Draft images are not confidential storage.
- Replacing/removing a photo in the editor does not delete uploaded objects. This avoids deleting images referenced by saved products or cached public pages. Periodic unused-asset cleanup is a later operational task.
- Per-size available stock is limited to 100. The applied checkout migration now reserves and restores it transactionally; see the cancellation/restock limits in the checkout guide.
- Collection choices use the existing `everyday`, `pace`, `court` and `motion` routes. Adding new collections needs a separate route/content change.
- The full public catalog is read in stable batches instead of silently dropping entries after 200. Admin product lists use 20-row pages. Overview's out-of-stock count explicitly labels its first-1,000-product limit if reached.

## Local verification

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd playwright test --config playwright.admin.config.ts
npm.cmd run test:e2e -- --config .tools/feedback-tests.config.ts
npm.cmd run build
```

Owner browser tests use a local HTTP fixture and fake sessions on port 3100 with a fixture Supabase endpoint on port 54329. They never connect to the hosted project. The fixture tests UI/API behavior; database authorization was verified separately against hosted Supabase with rolled-back SQL assertions and can be repeated in a disposable PGlite engine:

```powershell
npm.cmd install --prefix .tools/db-test --no-save --package-lock=false @electric-sql/pglite
node scripts/verify-owner-db.mjs
```

The runner applies the catalog, seed, new migration and rolled-back ownership assertions locally. Its Auth/Storage tables model the columns/policies needed by these tests; it does not replace acceptance checks against the actual Supabase services. Browser fixtures serve local test images directly to preserve Next.js's private-IP image-fetch protection.

Never run the two browser configurations concurrently: Next development servers share a build directory. The database assertions are also saved at `supabase/tests/owner_products.sql` for a reviewed rollback-only verification after hosted activation.

## Design choices

Retain white (#FFFFFF), ink (#111111), secondary text (#616165), borders (#E5E5E5) and status colors only. Use existing DM Sans typography, a quiet sidebar, real product rows and a photo-first editor. Avoid revenue charts and content-management screens until those capabilities exist.
