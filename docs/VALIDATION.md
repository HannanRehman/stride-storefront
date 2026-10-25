# Public storefront validation

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
