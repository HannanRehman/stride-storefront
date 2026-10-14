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
