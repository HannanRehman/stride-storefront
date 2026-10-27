# Improvements implementation — October 27, 2026

Active scope: implement the saved audit recommendations in order, then verify the changed site. Keep the white storefront/black utility bar/footer, existing provisional brand and products, PKR 250 shipping and signed-in test checkout. Real merchandise sales and email sending remain closed. No commit/push/deployment is authorized by this implementation session. Stop project servers after verification.

Baseline: 32 unit tests, 48 browser scenarios, 63 public production pages; slow-mobile home/product LCP 5.65/6.10 seconds, `/new` layout shift 0.52 and clothing listing 0.85 in a single local sample. Historical audit: [full report](FULL_SITE_TEST_REPORT.md).

## Work sequence

1. Profile font/image transfer and first-view loading; implement measured performance improvements.
2. Render useful initial catalog HTML and remove loading-layout jumps. Compare production measurements under the same conditions.
3. Compact mobile footer/admin navigation with active-section indication and keyboard access.
4. Divide CMS editing into understandable sections while retaining the same draft, preview, publish/version and unsaved-change safeguards.
5. Make preview/test/available shopping states consistent and show sign-in requirements before checkout.
6. Add owner MFA setup/verification, shared database abuse limits, private security history/alert visibility and a safe, reproducible restore drill. Preserve ordinary customer test checkout. Avoid locking owners out of the currently deployed version before the new auth UI is deployed. Owner enrollment and inaccessible hosted Auth settings require explicit operator actions.
7. Test the revised flows in available browser engines and emulated phones, keyboard/accessibility, production rendering and disposable/hosted SQL boundaries. Real phones, email delivery, courier handling and business content cannot be fabricated by local tests.

## Design constraints

Keep existing DM Sans body and Barlow Condensed display typography. White `#FFFFFF`, near-black `#111111`, off-white `#F5F5F5`, secondary `#707072`, dividers `#E5E5E5`. Changes should reduce waiting, scrolling and uncertainty; no new visual theme, fake merchant facts, reviews, discounts or product stock. Preserve native touch scrolling and reduced motion.

## Implemented

| Area | Result |
| --- | --- |
| Loading performance | Existing Latin fonts use local font loading with adjusted fallbacks. Hero/product candidates have intentional eager loading, quality and sizes. Public anonymous catalog/content/checkout reads cache for 60 seconds in production; owner writes invalidate the layout. Private customer data is never put in this shared cache. |
| Layout stability | `/new` and other catalog routes render useful initial headings/results. The store loading surface reserves viewport space and no longer collapses a margin through the body. |
| Mobile footer/navigation | Desktop columns remain; mobile footer groups start closed except Help. Owner navigation has a compact menu and identifies the active section. Native touch scrolling and reduced motion remain. |
| CMS editing | Campaign, Contact, Policies and Launch sections have keyboard-accessible tabs, preserved unsaved edits and a sticky save/publish bar. Draft, preview, publication, revision and conflict safeguards remain. |
| Shopping clarity | Cards, product and bag share Preview/Test order/Out of stock/Available to order vocabulary. Closed real checkout is respected. Guest bag explains sign-in before checkout; test notices and order progress are explicit. |
| Clothing direction | Default hero copy and primary link point toward clothing. Existing concepts/categories were preserved until the client supplies the real scope; no product facts or inventory were invented. Account headings retain the intended display font. |
| Owner protection | `/admin/security` supports authenticator enrollment and verification, staged per-owner enforcement, private event history and blocked-burst visibility. Database RLS and privileged RPCs require the verified session once enabled. |
| Shared abuse limits | Auth, MFA and launch routes use database counters behind a server-only gateway; unavailable configuration fails closed. Request bodies are bounded while streaming. Hosted migration and matching local/Vercel Production configuration are prepared. |
| Recovery | A snapshot was restored into a separate disposable database; order/stock/timeline/membership/security-history comparisons and all six SQL suites passed afterward. Hosted backup/Auth/Storage recovery remains separate. |
| Browser compatibility | Full Chrome journeys plus production checks in Chrome, Firefox and WebKit. WebKit caught a zoom-dialog focus-return bug; it was fixed using the registered trigger and all 12 production browser checks then passed. |

## Functional verification

- **Google Chrome:** 20 commerce/account/security scenarios, 6 owner-product scenarios and 26 public scenarios passed. One optional genuine hosted-account journey was skipped because isolated credentials were not provided; disposable authenticated journeys passed. Earlier Edge runs also passed these areas.
- **Production browser matrix:** 12/12 checks passed, four each in Chrome, Firefox and WebKit. Covered initial catalog HTML, search/filter persistence, guest bag/favorites, product gallery/dialog focus, mobile navigation/footer/reduced motion, private routes/APIs and test-product noindex. WebKit is engine coverage, not a claim of testing physical Safari/iPhones.
- **Database:** all six SQL assertion files passed on disposable PGlite and hosted Supabase with fixture rollback. New checks include staged MFA, direct RPC/Storage/RLS denial, gateway authentication, shared rate counters and private audit history. No exposed public `SECURITY DEFINER` functions remain.
- The final-unit browser fixture sent two parallel checkout requests for one remaining unit: one succeeded, the other was rejected, stock became zero and only one order existed. This disposable engine test does not prove hosted PostgreSQL lock behavior across independent connections.
- The mobile audit covers 16 owner/account screens; the public suite checks widths from 320 to 1920px and keyboard/dialog behavior. Axe serious/critical scans passed on the tested surfaces. This is not a full human screen-reader audit or independent penetration test.

- **Final checks:** 33 unit tests across nine suites, lint, TypeScript production compilation and optimized build passed. Chrome production smoke passed with zero page errors. All 63 sitemap pages returned HTTP 200, with useful initial catalog headings and no client-only catalog fallbacks in the crawl.
- **404 and sitemap follow-up:** confirmed both existing custom not-found components and automatic `/sitemap.xml`. Added repeatable Chrome production assertions for unknown pages/products showing the recovery link and `noindex`, sitemap XML/unique canonical URLs, private/test-product exclusions and `robots.txt` discovery. The expanded smoke passed with zero browser errors. No duplicate static sitemap or new 404 design was needed.
- **Email drafts:** all 11 passed offline Chrome rendering at four widths, safe preview links and serious/critical accessibility checks. Zero network requests and no emails sent; genuine inbox delivery/rendering remains unverified.
- The server security key was absent from all 58 generated public/client artifacts inspected. `.env.local` remains ignored. `git diff --check` passed. No application dependency was changed.

## Production loading samples

Local production server; fresh browser context and disabled browser cache for each route, 390px viewport, 4x CPU slowdown, 100ms latency and approximately 3.2Mbps download. The server's optimized-image/cache files were retained between runs. These are single diagnostic samples, with warm server caches in the final runs, not controlled cold-server comparisons, field Core Web Vitals, a Lighthouse score or a promised speed improvement for every visitor.

| Route | Baseline mobile LCP / CLS | First improved sample LCP / CLS | Final Edge LCP / CLS | Final Chrome LCP / CLS |
| --- | --- | --- | --- | --- |
| `/` | 5.65s / 0.0556 | 3.72s / 0 | 1.20s / 0 | 1.14s / 0 |
| `/new` | 2.05s / 0.5211 | 1.22s / 0 | 0.74s / 0 | 0.70s / 0 |
| `/shop/clothing` | 5.06s / 0.8522 | 3.40s / 0.0032 | 0.98s / 0 | 0.77s / 0 |
| `/product/navy-hoodie-trouser-set` | 6.10s / 0.0558 | 4.06s / 0 | 1.14s / 0 | 0.84s / 0 |

Final unthrottled desktop LCP samples ranged from 0.14–1.07 seconds in Edge and 0.18–0.44 seconds in Chrome; all eight desktop/mobile samples in each final run recorded zero layout shift and zero browser page errors. The stronger conclusion is that traced body/loading/font movement was removed and useful catalog content renders before hydration. Recheck final merchandise photos and actual Vercel/network conditions before launch.

Desktop/mobile screenshots were inspected for the hero, compact footer, CMS/navigation and security/account screens. Offscreen lazy images in a full-page capture are not evidence of an image-load failure; gallery loading and missing-image fallback have separate functional assertions. Rail previews continue to expose the next card on narrow screens.

Ignored evidence files: `.tools/improvements-chrome-{commerce,admin,public}.log`, `.tools/improvements-performance-first.json`, `.tools/improvements-performance-final-{edge,chrome}.json`, `.tools/full-audit/`, `.tools/audit-*-mobile.png` and `.tools/email-previews/`. Generated tracked product screenshots were restored after inspection. All project Next/test servers are stopped; VS Code's port-3000 service remains untouched.

## Reproduce

Run server-based suites sequentially because they share `.next`. Disposable SQL tooling is under ignored `.tools/db-test`, as documented in the checkout guide. The public suite uses isolated port 3004 by default (`PLAYWRIGHT_PORT` can override it), so it cannot mistake an editor service on port 3000 for the app.

```powershell
npm.cmd run test
npm.cmd run lint
npm.cmd run typecheck
node scripts/verify-owner-db.mjs
node scripts/verify-restore.mjs
$env:PLAYWRIGHT_CHANNEL='chrome'
npx.cmd playwright test --config playwright.checkout.config.ts --timeout 120000
npx.cmd playwright test --config playwright.admin.config.ts --timeout 120000
npx.cmd playwright test --timeout 120000
node scripts/verify-email-drafts.mjs
npm.cmd run build
npx.cmd playwright test --config playwright.cross-browser.config.ts
node scripts/verify-production.mjs
node scripts/audit-production.mjs
```

The cross-browser suite requires Playwright's Firefox/WebKit binaries and installed Google Chrome. Fixture Auth/MFA transport is simulated; do not insert genuine credentials or enroll a real owner to reproduce those tests.

## Hosted state and remaining activation

Migration `20261027140044_security_hardening` is applied. Final read-only checks found 36 original catalog records, one separate test product, zero real orderable products, public checkout closed, PKR 250 delivery, two owner memberships, no owner MFA enrollment, zero orders/email jobs and the private gateway digest present. The matching `SECURITY_RPC_SECRET` is configured locally and encrypted in Vercel Production; no secret was printed or placed in tracked files. No application commit, push or deployment was performed.

1. Deploy the new UI in a separately authorized release before real owner MFA enrollment. Enrollment performed locally also changes the shared hosted membership; the currently deployed UI has no MFA verification screen. Each owner must verify their own authenticator afterward. See [security setup](SECURITY_SETUP.md).
2. Enable Supabase leaked-password protection where the project's plan supports it. The connected tools do not expose this Auth setting; its existing security-advisor warning remains. Do not substitute edits to private Auth tables.
3. Choose an approved external alert destination/sender if wanted. Current alerts are private dashboard history; no external security message was sent.
4. Validate a hosted backup in an isolated recovery target, including genuine Auth identities and Storage files. See [recovery acceptance](BACKUP_RECOVERY.md). No live database was restored or paid backup service purchased.
5. Supply final brand/domain, real merchandise/prices/stock/measurements, actual support channels and merchant policies. Only then align/remove provisional collections and open real sales intentionally.
6. Complete genuine email/inbox, owner/Storage, physical-device, hosted multi-connection stock contention and courier/COD acceptance. These cannot be replaced by simulated transport or local engine tests.

The 11 email templates remain drafts, with no sender activation. Registration/recovery email flags and real sales were not opened by this work. Local test servers must be stopped after verification; the VS Code process using port 3000 is an editor service and is left intact.
