# Full website audit

**Follow-up:** the recommendations below have since been implemented and re-tested. See [the improvements implementation report](IMPROVEMENTS_IMPLEMENTATION.md) for current Chrome/Firefox/WebKit coverage, performance measurements, MFA/shared limits and recovery evidence. The counts, findings and performance table in this document record the earlier baseline, rather than the final implementation.

October 27, 2026. Local working-tree audit, including the approved black footer/utility bar and signed-in test checkout. No Git commit, push, Vercel deployment, real order, email or courier booking is part of this audit.

## Scope and results

- 32 unit tests passed across 8 suites.
- 48 browser scenarios passed across the public, customer/commerce and owner-product suites, including the additional pagination boundary check. One optional real-hosted-account scenario was skipped because isolated acceptance credentials were not supplied; the disposable account journey passed instead.
- 31 component files were reviewed and exercised through the interactions listed below. This covers implemented pages and key success/failure states; it is not a proof of every possible input, device, race or attack.
- Lint, TypeScript production compilation and optimized build passed. The production smoke reported zero browser page errors.
- All 63 public sitemap pages returned HTTP 200 in the local production crawl. The full development crawl also checked internal linked routes. The test product is excluded from the sitemap.
- All 5 SQL assertion files passed both in disposable PGlite and on hosted Supabase, using rolled-back fixture users/orders. Assertions cover account/product RLS, checkout integrity, test-only orders, content/consent/support operations and private email queue access.
- `npm audit` reported **0 vulnerabilities** across the dependency tree at audit time. No packages were changed.
- 11 draft HTML emails passed offline checks at 320, 375, 600 and 900px, HTTPS preview links and serious/critical accessibility checks, with zero network requests. These are browser previews, not real inbox acceptance.

### Test-run details

The commerce run passed 14 of 15 scenarios initially. The new ordinary-customer journey reached its order page but its five-second visual assertion ran before the cold route's data request completed. The check was changed to wait for that actual order-read response; the targeted rerun passed. Other commerce tests, including the owner rehearsal and the 15-screen mobile audit, passed. Owner products passed 6/6; public tests passed 26 with one optional hosted-account skip. No failing functional assertion is being hidden by an automatic retry.

The first raw-HTML production audit expected every page to have its heading before hydration. `/new` intentionally prerenders its catalog Suspense fallback because `CatalogView` uses `useSearchParams`. The audit was corrected to recognize that fallback and separately verify the hydrated browser heading. This behavior is documented in the installed Next.js guide, and its visible layout jump is retained as an improvement finding below.

The extra boundary scenario passed with 21 historical orders, 21 support requests, a 51-message conversation and 21 audience records in the disposable fixture. It verifies next/previous pages, filter changes resetting the page, and older/newer conversation messages. These records never reached hosted Supabase.

## Component coverage

| Component | Checks exercised |
| --- | --- |
| `header.tsx` | Desktop mega navigation, keyboard open/escape, mobile navigation, search suggestions/keyboard selection, bag/favorite indicators and route destinations. |
| `footer.tsx` | Black surface, link resolution, keyboard toggle of mobile groups, back-to-top, footer contrast/focus checks. |
| `campaign-hero.tsx` | Public campaign rendering, private saved-draft preview, publication changes, hero image and CTA route. |
| `rail.tsx` | Previous/next movement and reduced-motion behavior. Native touch scrolling retained. |
| `catalog-page.tsx` | Category/audience/collection/new/search pages and production fallback/hydration. |
| `catalog-view.tsx` | Filters, sort, URL persistence/back navigation, pagination, no-result state, mobile filter sheet, result layout. |
| `product-card.tsx` | Images, price/currency, favorite state, product links and preview-state restrictions. |
| `product-detail.tsx` | Size-required feedback, unavailable sizes, gallery selection/zoom/keyboard escape, bag acknowledgement, test CTA, test stock and preview states. |
| `store-image.tsx` | Loaded photographs, gallery decode, failed-image fallback and useful alternative text. |
| `store-provider.tsx` | Guest persistence/merge once, signed-in cross-device reads, acknowledged writes, failed/expired-session writes, storage errors, stock limits and retries. |
| `favorites-view.tsx` | Favorites survive reload; moving bag items to favorites updates both together. |
| `bag-view.tsx` | Quantity updates/removal, saved state, empty bag, currency totals, failure feedback and checkout link. |
| `checkout.tsx` | Saved-address choice, address validation, authoritative price/stock quote, COD total, customer test order, receipt and uncertain-response replay. |
| `order-list.tsx` | Private customer history, owner list/status controls, test labels, empty/read states and page-boundary checks. |
| `order-detail.tsx` | Customer privacy, timeline, courier/tracking requirement, allowed transitions, delivery/payment record, stale edits, cancellation/restock once and test labels. |
| `support-requests.tsx` | Creation/retry recovery, private conversation, customer/owner replies, resolve behavior, forbidden foreign access, message/list page boundaries. |
| `launch-form.tsx` | Closed/open signup state, consent, deduplication, explicit confirmation, unsubscribe and no resubscription through an old confirmation link. |
| `share-link.tsx` | Clean URL copying without tracking/query/hash and clipboard-denied feedback. Browser native share-sheet UI itself is outside the headless test. |
| `size-guide.tsx` | Product dialog rendering/close/focus and standalone information page; actual garment measurements still await client data. |
| `smooth-scroll.tsx` | Wheel movement, dialog scroll lock/unlock, returned focus and reduced-motion preference. |
| `auth-page.tsx` | Sign-in/register/recovery/password-page rendering and private route redirects. |
| `auth-form.tsx` | Isolated login/registration/recovery/password change, password reveal, safe callbacks and success/error feedback. No real email delivery claimed. |
| `account-forms.tsx` | Profile save/reload, address create/edit/delete, sign out and cross-device account state. |
| `ui/button.tsx` | Form submissions, disabled/busy states, keyboard activation and link composition across journeys. |
| `ui/dialog.tsx` | Search, size/gallery, launch, order and product confirmations; keyboard escape, focus and scroll lock. |
| `admin/product-manager.tsx` | Search/status filtering, empty state, product links and access denial. |
| `admin/product-editor.tsx` | Draft/create, valid photo upload, invalid-file rejection, publish/unpublish, stock edits, locked public slug, stale/unknown saves and unsaved-navigation guard. |
| `admin/content-editor.tsx` | Draft edit/save, owner preview, publish confirmation, stale-version rejection, narrow layout/accessibility. SQL also verifies restoring a publication into draft. |
| `admin/checkout-settings.tsx` | Explicit public-opening confirmation, keeping closed, fee settings, stale updates and customer denial. |
| `admin/audience-manager.tsx` | Consent/status visibility, private fields, status filtering and page boundaries. |
| `admin/readiness.tsx` | Authenticated availability/status rendering, disabled-email state and narrow-layout accessibility. |

## Responsive, accessibility and security evidence

- Public layout checks cover 320, 375, 390, 768, 1024, 1280, 1440 and 1920px widths. Product preview checks include phone/tablet sizes. A 375px scan exercised 15 owner/account screens.
- Axe found no serious/critical issues in the scanned home/catalog/product/bag/auth/information surfaces, footer and those 15 private screens. Keyboard interactions were exercised for navigation, search, dialogs, gallery and footer controls. This does not replace a human screen-reader audit.
- Protected pages redirect anonymous visitors to sign-in while preserving the destination. Private APIs reject unauthenticated requests and return private/no-store responses. Ordinary customers still cannot access admin or another customer's orders/requests.
- Same-origin write checks, invalid upload rejection, validation, RLS and privileged-RPC grants were checked. No exposed public SECURITY DEFINER functions remain. No attempt was made to disable admin authorization.
- Supabase's existing [leaked-password protection warning](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) remains; enabling that Auth setting requires separate configuration. Owner 2FA, stronger distributed abuse controls, alerting and an independent penetration test remain recommended before public sales.

## Production performance sample

One cold-browser sample per route/profile on the local production server. Desktop used 1440px with no throttling. Mobile used 390px, 4× CPU slowdown, 100ms latency and approximately 3.2Mbps download. These are diagnostic samples, not field Core Web Vitals, load testing or a Lighthouse score.

| Route | Desktop LCP / layout shift | Slower mobile LCP / layout shift |
| --- | --- | --- |
| `/` | 0.93s / 0.0351 | 5.65s / 0.0556 |
| `/new` | 0.28s / 0.4349 | 2.05s / 0.5211 |
| `/shop/clothing` | 0.56s / 0.0351 | 5.06s / 0.8522 |
| `/product/navy-hoodie-trouser-set` | 0.56s / 0.0352 | 6.10s / 0.0558 |

The mobile load times and catalog movement need attention before launch. Start with the real above-the-fold image/font transfers, loading placeholders and layout-shift source tracing. `/new`'s fallback-to-results transition is confirmed; the exact sources of the other observed movement need profiling. Development image-LCP warnings were also recorded. Functional test success does not make these performance findings disappear.

See [the prioritized design review](WEBSITE_DESIGN_REVIEW.md) for visual and usability proposals.

## What changed in this audit

- Any signed-in account may rehearse checkout with the test set; real-product checkout stays closed. Migration `20261027124731_signed_in_test_orders` is applied. Admin membership and private customer boundaries remain required.
- The original hoodie preview now links to **Try test checkout**, and the account overview has the same entry point. Test receipts no longer direct ordinary customers into admin.
- Created [11 email drafts and full plain-text copy](email-templates/README.md). Existing delivery configuration and runtime email rendering were not activated or replaced.
- Added repeatable browser component/pagination checks and offline email/production audit scripts. Existing tracked screenshots generated by tests are restored after inspection rather than bundled as unrelated changes.

## Reproduce

Run server-based suites sequentially; they share `.next`. Disposable database fixtures never use hosted credentials. PGlite's local tool dependency is under ignored `.tools/db-test` as documented in the checkout guide.

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
node scripts/verify-owner-db.mjs
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd playwright test --config playwright.checkout.config.ts --timeout 120000
npx.cmd playwright test --config playwright.admin.config.ts --timeout 120000
npx.cmd playwright test --timeout 120000
node scripts/verify-email-drafts.mjs
npm.cmd run build
node scripts/verify-production.mjs
node scripts/audit-production.mjs
```

Local logs and screenshots are under ignored `.tools/audit-*`, `.tools/full-audit/`, `.tools/email-previews/` and `.tools/audit-*-mobile.png`. Browser traces are under ignored `test-results/` for a failing run. Draft source files live under `docs/email-templates/`.

## Limits and remaining acceptance

Real email delivery/link behavior across Gmail/Outlook/mobile clients, Supabase's genuine hosted account email transport, production sender authentication, real courier handoff, COD collection, online payments and hosted final-unit stock contention across concurrent connections are not proven by simulated transport/local browser tests. Neither Safari/Firefox/physical-device coverage nor a security penetration/load/backup-restore audit was performed. Final merchant policies, brand/domain, actual inventory/measurements and those external acceptance steps remain launch work.

The project servers are stopped after the audit. Start `npm.cmd run dev` manually when you want another local preview. This audit does not publish the local UI changes.
