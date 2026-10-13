# Public storefront validation

Validated during the October 14, 2026 implementation session in `E:\Nikereplica`.

## Final check results

| Check | Result |
| --- | --- |
| `npm.cmd run lint` | Passed, no errors or warnings |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run test` | Passed: 7 business-rule tests |
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
- Accounts, checkout, real stock transactions, live payments and email are outside this iteration and were not tested or represented as complete.
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
