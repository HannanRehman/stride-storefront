# Public storefront validation

## Recommendations implementation — October 27, 2026

Current local results: **33 unit tests**, **52 full Google Chrome scenarios** (20 commerce/security, 6 owner products, 26 public) and **12 production checks across Chrome, Firefox and WebKit** passed. One optional genuine hosted-account browser journey remains skipped. Lint, TypeScript production compilation, optimized build, Chrome production smoke and the 63-page public crawl passed. Eleven offline email drafts passed at four widths; no email was sent.

All six SQL assertion suites passed locally and on hosted Supabase with rollback, including MFA/direct-RPC/RLS/shared-limit checks. The separate disposable restore drill passed order, stock, history and membership comparisons plus all six assertions after restoration. WebKit exposed a dialog-focus issue; the fix passed the complete production browser matrix. The latest mobile samples recorded zero layout shift on all four profiled routes. Exact measurements, cache conditions and limitations are in the [implementation report](IMPROVEMENTS_IMPLEMENTATION.md).

Security migration `20261027140044_security_hardening` is applied, with matching private gateway configuration locally and encrypted in Vercel Production. Both owner memberships remain intact and unenrolled; genuine owners must enroll only after the new security UI is deployed. Real sales remain closed, delivery PKR 250, and hosted orders/email jobs remain zero. Supabase's leaked-password protection warning remains an operator Auth-setting step. No application commit, push or deployment was performed. Project servers were stopped and generated tracked test screenshots restored.

See [security setup](SECURITY_SETUP.md) and [hosted recovery acceptance](BACKUP_RECOVERY.md). The sections below preserve earlier results and superseded limitations; they are historical records.

## Full audit and email drafts — October 27, 2026

Latest results: **32 unit tests and 48 browser scenarios passed**, with one optional hosted-account browser scenario skipped. All five SQL suites passed locally and on Supabase with fixture rollback. Lint, type checking, production build, production smoke and the 63-page production crawl passed. Dependency audit reported zero vulnerabilities. Eleven HTML email drafts passed offline checks at four widths; no messages were sent.

Migration `20261027124731_signed_in_test_orders` now lets any signed-in account order the separate test set. Real-product ordering stays closed; admin and other customers' data stay protected. The original preview links directly to test checkout. Local application changes are not committed, pushed or deployed.

The production sample found slow mobile image loading and catalog layout shifts that still need attention. Read the [complete component/test report](FULL_SITE_TEST_REPORT.md), [prioritized look-and-feel review](WEBSITE_DESIGN_REVIEW.md), [test checkout instructions](OWNER_TEST_ORDERS.md) and [email drafts](email-templates/README.md). Background project servers were stopped after the checks.

The sections below record earlier milestones, including the superseded owner-only test restriction.

## Owner checkout rehearsal — October 27, 2026

- Added an owner-only test product and authoritative test-order marker. Normal shopping/search results, product recommendations and sitemap exclude the test item; its product page is noindex.
- Disposable SQL regression checks passed for all migrations and the owner/customer/checkout/operations assertions, including new owner test assertions. Hosted test assertions passed and rolled back; migration `20261027122354_owner_test_orders` is applied.
- Commerce browser coverage now has 14 scenarios. Twelve passed in the first run. A new test's ambiguous text selector was narrowed; a cold-development account journey exceeded its total 60-second budget. Both failed scenarios passed on targeted rerun (the unchanged account journey completed in 25 seconds). The new owner journey checks product → bag → test checkout → receipt → admin confirmation/cancellation → private history while public ordering stays closed.
- 32 unit tests, TypeScript, lint and production build passed. Local production smoke passed public pages, gallery, SEO/social image, mobile fit, security headers and private endpoints with zero browser errors.
- Hosted final state: 36 original products preserved, one separate test product (PKR 7,000; S/M/L/XL with 50 simulated units each), public ordering closed, PKR 250 delivery, two owners, zero orders/email jobs and no leftover fixture users. No privileged functions were exposed in the public schema. The existing leaked-password-protection advisor warning remains.
- No actual owner order was placed, no email sent, and no Git commit/push/deployment performed for this change. See [test instructions](OWNER_TEST_ORDERS.md).

## Store completion — October 27, 2026

- Lint, TypeScript, **31 unit tests** and the Next.js **16.4.3 production build** passed.
- The final local browser passes cover **40 scenarios**: 12 account/checkout/CMS/support/audience scenarios, 6 owner product scenarios and 22 public storefront scenarios. One separate real hosted-account credential fixture was deliberately skipped; the complete account journey passed against isolated Auth/SQL transport, including guest merge, two-device persistence, profile/address CRUD, saved-address checkout selection, recovery callback/password replacement and rejection of the old password.
- New commerce/operations coverage includes immutable receipts, stock, COD fulfillment/tracking/cash collection, cancellation restocking, stale writes, guarded launch settings, lost-response retries for orders and support requests, private conversations, CMS draft/preview/publication/revisions, and launch permission/confirmation/unsubscribe. Axe scans found no serious/critical issues in the scanned checkout, CMS and account surfaces. Desktop/mobile screenshots were inspected and remain ignored local artifacts.
- `scripts/verify-production.mjs` passed against a local production server: homepage/product gallery/PKR price, contact/launch/policy pages, canonical, actual 1200×630 social PNG, 375px layout, response headers, protected pages/APIs and unauthorized email-worker rejection. It reported zero browser page errors. Development runs can log image-loading recommendations and aborted-navigation stream messages; production smoke did not reproduce browser errors.
- All migrations and owner/customer/checkout/operations SQL assertions passed in disposable PGlite. The commerce browser suite passed **12/12 again** after moving privileged implementations to `store_internal`. Local Auth/SMTP transport is simulated; no real emails were sent.
- Supabase authorization was restored. Migrations `20261026225242_checkout_orders`, `20261026225251_store_operations` and `20261026225739_private_rpc_implementations` are applied. Hosted checkout/operations assertions passed again after the private-schema change; owner/customer assertions passed too. Every assertion fixture rolls back.
- Hosted verification found 36 original published products, 2 owners, **0 orderable products**, **ordering closed**, PKR 250 delivery, empty public content overrides and **0 orders/requests/signups/email jobs/test users**. No genuine stock, price, product name or brand content was changed.
- The security advisor now reports no exposed privileged functions or RLS problems. Its one remaining warning is existing disabled Supabase leaked-password protection; available tools do not change Auth configuration. Performance findings are unused-index INFO notices retained for future queries/FKs.
- The owner authorized push and deployment after local verification. Deployment completion and the exact Git commit are confirmed in the session's final report. Before public sales, supply actual merchant content, sender/SMTP, real products/stock and perform coordinated production owner/customer acceptance. Actual hosted multi-connection final-unit contention and real email/courier/payment-provider acceptance are not claimed proven by the local fixtures.

The remaining sections record previous validation milestones.

Validated during the October 14, 2026 implementation session in `E:\Nikereplica`.

## Final check results

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed, no errors or warnings |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run test` | Passed: 10 catalog/account-input tests |
| `npm.cmd run build` | Passed: Next.js 16.4.0 production build |
| `npm.cmd run test:e2e` with `PLAYWRIGHT_CHANNEL=msedge` | Passed: all 9 browser tests in the final full-suite run |
| `npm.cmd audit --omit=dev` | Passed: zero production dependency vulnerabilities at the check |
| Visual review | Generated assets and desktop/mobile home, catalog and desktop PDP screenshots inspected |

## Browser coverage

1. Mouse-wheel smoothing, dialog scroll lock, Escape close and keyboard focus restoration.
2. Home → audience → shoes → product → size validation → bag → favorites; bag refresh, quantities, totals and removal.
3. Combined sale/color/size filters, URL sorting, reload persistence and back navigation.
4. Search suggestions and arrow-key/Enter navigation.
5. Mobile navigation and Filter & Sort application; reduced-motion preference disables smoothing.
6. Axe checks on homepage, catalog, PDP and bag: no serious or critical findings in those scans.
7. Homepage/catalog overflow checks at 320, 375, 390, 768, 1024, 1280, 1440 and 1920px.
8. Atomic bag-to-favorites movement and persistence after refresh.
9. Missing-media fallback and unknown-product not-found/noindex behavior.

Initial checks identified low-contrast secondary text and missing focus restoration on controlled dialogs. Both were fixed and verified. Bag-to-favorites was implemented as a single storage update to preserve the saved favorite while removing the bag item.

## Screenshot artifacts

- `artifacts/asset-review.png`
- `artifacts/home-desktop.png`
- `artifacts/home-mobile.png`
- `artifacts/catalog-desktop.png`
- `artifacts/catalog-mobile.png`
- `artifacts/product-desktop.png`

## Limits

- Tests ran against the local public demo and Microsoft Edge's Chromium engine. Safari/Firefox, real-device testing and comprehensive screen-reader auditing were not performed.
- Axe smoke results do not constitute a full accessibility audit.
- The original public storefront checks used fallback data. Hosted Supabase checks and their results are recorded below.
- Checkout, real stock transactions, orders and live payments remain outside this iteration. Account verification is recorded below; signup/recovery email delivery remains unverified.
- Product family/audience/SE entries share concept imagery. Every PDP currently has one illustrated colorway/image; full variants and multi-view assets remain future work.
- Next.js streamed not-found responses can return HTTP 200, with branded fallback content and `noindex`; non-streamed responses return 404. The test handles the documented framework behavior.
- The full dependency audit includes five related development-only entries in the Next.js lint dependency chain. Details are recorded in the README; the production dependency audit passed.

## Hosted Supabase catalog verification

Project: `simfvguqxbqevvrgkkdp`. Applied migration: `20261013213040_public_catalog.sql`.

- Imported 36 published products: 18 shoes, 12 clothing and 6 accessories, distributed across men, women and kids.
- Corrected an original demo pricing bug that produced a negative kids' sale price. The local catalog and generated seed now agree; the minimum price is 1100 minor units ($11), and all sale comparisons are valid.
- Extended the catalog test to enforce nonnegative prices and made the seed generator reject invalid prices before writing SQL. All 7 business-rule tests pass.
- Verified RLS is enabled with the published-only SELECT policy. `anon` and `authenticated` have read permission and no insert/update/delete privileges.
- A temporary unpublished probe was inserted inside a transaction; an assertion executed as `anon` confirmed the probe was hidden and all 36 published products were readable. The transaction was rolled back; no probe remains.
- `scripts/verify-supabase.ts` successfully queried the actual public Data API using only the enabled publishable key, checking IDs, prices and sizes against the local catalog.
- The production build passed with `.env.local` pointing at the hosted Supabase project.
- All 9 browser tests passed with the hosted catalog configured, covering shopping flows, accessibility smoke checks and responsive layouts. Lint and TypeScript checks also passed.
- Supabase's security advisor returned zero findings. Its performance advisor reported two newly created indexes as unused; retained them for the intended catalog queries. See [unused-index advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index).

Vercel environment-variable activation is a separate deployment step; these checks do not claim that the live deployment has received the Supabase settings.

## Customer accounts verification

Applied hosted migration: `20261014095017_customer_accounts.sql`. Real product data and checkout remain deferred.

- Lint, typecheck, all 10 unit tests and the production build passed after account implementation.
- All 9 original storefront browser tests passed with the hosted catalog configured.
- All 3 account browser tests passed: protected-route redirects and expired callback handling, rejected foreign-origin writes and anonymous shopping access, and a hosted account journey. The journey covered real Supabase password sign-in, one-time guest merge, bag persistence after refresh, profile save/reload, address create/edit/delete, bag/favorites on a second browser, and logout without carrying account selections into guest storage.
- The hosted journey used a designated temporary `.invalid` test account with no outgoing email. Its auth and customer records were removed afterward. Routine runs skip this one journey unless isolated `ACCOUNT_TEST_EMAIL` and `ACCOUNT_TEST_PASSWORD` fixtures are supplied.
- `supabase/tests/customer_accounts.sql` passed against the hosted database, with its complete fixture rolled back. Assertions covered owner-only reads, denied cross-user updates/inserts, denied anonymous reads/RPC, repeatable merge receipts, quantity caps and atomic bag-to-favorites movement.
- All five customer tables have RLS enabled; the shopping function uses invoker permissions. Supabase's security advisor returned no findings.
- Axe scans of the recovery/account address pages found no serious or critical violations. Desktop and mobile login screenshots were visually inspected; production captures are `artifacts/login-desktop.png` and `artifacts/login-mobile.png`.
- No new packages were required. Private account/API responses are uncached, while the public storefront retains its existing catalog behavior.

Signup and recovery code is present, but `AUTH_EMAIL_ENABLED` defaults to false. Real confirmation/recovery email delivery, valid email callback acceptance and recovery password update have not been exercised; those require sender and redirect setup and acceptance checks in `docs/AUTH_SETUP.md`. Vercel deployment activation is not claimed by these local checks.

## Shopping feedback verification — October 15, 2026

- Bag and favorite controls wait for shopping state to load and prevent overlapping saves. Account changes and success messages appear after the server confirms the save.
- Loading, unavailable stock, expired sessions, browser storage failures and unconfirmed account saves have distinct feedback. Failed saves retain the last confirmed selections; Retry syncing reloads account selections before another attempt.
- All 17 browser tests passed in Microsoft Edge: the 9 existing storefront checks and 8 new shopping-feedback checks covering delayed loading, delayed saves, failed saves and retry, expired sessions, server stock rejection, blocked browser storage, genuine guest stock limits, and failed account quantity changes.
- Lint, TypeScript, all 10 unit tests and the production build passed.
- Account feedback tests mock session and shopping responses. They do not claim fresh hosted authentication or database verification. No test emails were sent, and these local changes have not been deployed.

## Navy merchandise preview — October 15, 2026

- Added one navy hoodie-and-trouser set at the owner's temporary PKR 7,000 price, with S, M, L and XL planned sizes. Stock quantities are unconfirmed; preview controls do not perform bag/favorites writes.
- All 19 storefront, shopping-feedback and merchandise-preview browser checks passed before the additional gallery views. The two merchandise checks passed again after adding full-set, hoodie and trouser thumbnails, including successful image loads, selected-image zoom, discovery and mobile overflow verification.
- All 13 unit tests, lint and TypeScript checks passed. The production build passed with the hosted catalog configured; no database writes, emails or deployment were performed.
- Inspected the retouched images and mobile product-page screenshot. Edited PNG masters and untouched user originals remain in `products/`; optimized WebP assets live in `public/images/products/`.

The subsequent full pre-push audit passed 22 browser checks (one isolated-account journey skipped), all 13 unit tests, lint, TypeScript and production build. All 61 sitemap pages and their additional internal page links resolved. Production dependencies reported zero vulnerabilities; five known development-only lint dependency entries remain. See the [pre-push audit](./PRE_PUSH_AUDIT_2026-10-15.md) for corrections, screenshots and limits.

## Owner product management — October 26, 2026

- Implemented the separate owner dashboard, product list/editor, draft preview, uploads, explicit publication/unpublication and optimistic version checks. Public URLs are preserved inside the `(store)` group; admin pages exclude the storefront shopping wrapper and smooth scrolling.
- All six isolated owner browser scenarios passed: anonymous/customer denial; draft/upload/reload/publish/stock/unpublish; stale-save handling; foreign-origin and invalid-image rejection; unconfirmed saves; and unsaved navigation/search/status filters. The editor's accessibility smoke scan found no serious/critical violations and its desktop/mobile captures were inspected. These tests use local fake Auth/REST/Storage services, not live owner credentials.
- The 22 existing storefront/account-feedback scenarios passed across the full run and the targeted account-error test rerun after scoping its alert selector away from Next.js's route announcer. One hosted account journey remains skipped without isolated credentials. The route audit covered all 61 sitemap entries and additional internal page links. An anonymous `/admin/products/new` request preserved the intended destination through login.
- All 18 unit tests, lint, TypeScript and the Next.js 16.4.3 production build passed. Production-mode browser smoke checks covered homepage, PKR product/gallery, mobile layout and admin redirect with no browser page errors.
- Updated Next.js and its matching lint configuration from 16.4.0 to 16.4.3 after a fresh audit reported new security advisories. Production dependencies reported zero vulnerabilities after the update; the dependency installation's full audit also reported zero. See the [maintainer advisory](https://github.com/advisories/GHSA-2464-fhr4-w9xw) for one patched issue. This local dependency update has not been pushed or deployed.
- With explicit owner approval, applied hosted migrations `20261025211834_owner_products` and `20261025211936_owner_catalog_read_policy`, created the public-read/owner-upload media bucket and granted membership to the first verified account. The second requested account has since registered, confirmed its email and received verified owner membership; no email addresses or actual user UUIDs are committed in source.
- Both `supabase/tests/owner_products.sql` and `supabase/tests/customer_accounts.sql` passed against hosted Supabase with fixtures rolled back. Follow-up checks found no fixture accounts/products remaining, one actual owner membership, all 36 published demos intact, and the expected 4 MB/WebP bucket configuration. The same migration/assertion sequence passed locally in a disposable PGlite engine.
- The introduced duplicate SELECT policy warning was resolved with the follow-up migration. Remaining advisor findings are leaked-password protection disabled (a project Auth setting, Pro plans and above) and three existing unused-index information notices. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security). No emails, real orders or checkout writes were performed.
- Real owner browser sign-in, real Supabase Storage service uploads through that session, email delivery and the dashboard's deployed behavior still need acceptance checks. See [owner setup](./OWNER_DASHBOARD_SETUP.md).
