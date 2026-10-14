# Stride public storefront

A responsive original sportswear storefront built with Next.js App Router, TypeScript, Tailwind CSS, Lucide, and shadcn-style Button/Dialog primitives backed by Radix. The theme uses clean black/white surfaces, strong type, editorial photography, and borderless product cards. [Lenis](https://github.com/darkroomengineering/lenis) smooths mouse-wheel and anchor scrolling. Touch remains native; reduced-motion preferences disable smoothing, and dialogs pause background scrolling.

## Run locally

Node 24 and npm 11 were used during development. Install dependencies once, then start the app:

```powershell
cd E:\Nikereplica
npm.cmd install
npm.cmd run dev
```

Open [localhost:3000](http://localhost:3000). On Windows, `npm.cmd` avoids PowerShell's disabled `npm.ps1` shim. On other platforms use `npm`.

No environment variables or backend account are required for the bundled public demo.

## Implemented in this step

- Original Stride identity, copy, and seven generated campaign/product assets, hosted locally.
- Homepage: campaign, editorial panels, featured product rail, categories, classic collections, sports, story, category matrix and footer.
- Men/women/kids landings and category pages; collection and new-arrival pages.
- 36 original demo catalog entries, shared across listing, detail, search, favorites and bag. Illustration is shared within product families and their audience/SE editions; it does not imply unique photographed stock.
- Filters for sport, color, price, available size and sale; sort, numbered pagination, active filters and shareable URL state.
- Accessible mobile navigation, search dialog/typeahead, mobile filter sheet, keyboard controls and focus management.
- Product image zoom, one illustrated colorway per product, size selection, sold-out size handling, sizing/care information and related products.
- Favorites and editable bag persisted on the current device. Quantity limits use demo data. Bag-to-favorites movement is one atomic local update.
- Help, size guide, shipping/returns, privacy and terms; branded 404, loading, error and image fallback states.
- Metadata, canonical routes, sitemap, robots, locally hosted licensed fonts.
- Supabase public-catalog migration, repeatable SQL seed and optional server-side read adapter with public-read RLS.
- Account sign-in/out, private profile/addresses, server bag/favorites, repeatable guest merge and conditional signup/recovery forms.

## Scope and remaining work

The public storefront and account milestone are implemented. Accounts include email/password sign-in, conditional signup/recovery, protected profile and saved addresses, account bag/favorites and repeatable guest merging. Purchasing, payment, checkout, order history, real inventory reservation and shipping are not enabled. The UI does not claim to accept orders. No card data is collected. Real products, photography, variants and inventory are deferred until the assortment is supplied.

Product pages currently have one original concept image and one colorway each, rather than full multi-view/variant galleries. Category-specific technical facets, ratings/review submission, real member benefits, and final product fit charts belong to later milestones. No fictional customer reviews are displayed. The catalog is bounded to 200 published entries in the current Supabase read adapter; larger/live catalogs need database-side query pagination.

The supplied master specification remains unchanged. [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) is the broader roadmap, and [docs/PUBLIC_STOREFRONT_DESIGN.md](./docs/PUBLIC_STOREFRONT_DESIGN.md) records the initial storefront design. Supabase PostgreSQL and Supabase Auth replace the provisional Prisma/Better Auth choice. See [docs/ACCOUNT_IMPLEMENTATION.md](./docs/ACCOUNT_IMPLEMENTATION.md) for account architecture and [docs/AUTH_SETUP.md](./docs/AUTH_SETUP.md) for deployment activation.

## Accounts

`supabase/migrations/20261014095017_customer_accounts.sql` is applied to the connected project. It adds customer profiles, addresses, bag items, favorites and guest-merge receipts. Every table has owner-only RLS; anonymous users have no privileges. The shopping RPC runs with caller permissions and serializes each user's mutations. No service-role key is used by the application.

Sign-in, sign-out, profile/addresses and account shopping are enabled when the two Supabase variables are set. Signup and recovery additionally require `AUTH_EMAIL_ENABLED=true` after email delivery and redirect configuration are verified. The default is disabled, with a clear message in the forms. Configuring this flag alone does not configure email delivery.

Sessions use HTTP-only, SameSite=Lax cookies and Secure cookies in production. Proxy refreshes sessions on account/auth routes, while each protected page and write verifies the user again. Private responses use `private, no-store`. JSON mutations reject foreign origins. Auth endpoints add an eight-attempt/ten-minute throttle per IP/action/email within each server instance, alongside Supabase Auth's provider-side rate limits; it is not a shared distributed application limiter. Tune provider limits and configure production bot protection before broader launch.

Signed-in shopping is stored on the server. Guest bag quantities merge into existing account quantities with demo stock caps; favorites are unioned. A merge receipt prevents retries from adding items twice. Guest selections clear only after success. Failed saves show an explicit retry message, and no account selections are copied into guest storage on logout. Focus and same-browser tab notifications refresh account data; this is not a live subscription across devices.

The SQL assertions in `supabase/tests/customer_accounts.sql` use temporary fixtures inside a rolled-back transaction. They check ownership isolation, denied anonymous access, quantity caps, repeated merges and atomic bag-to-favorites movement. The optional hosted browser journey accepts `ACCOUNT_TEST_EMAIL` and `ACCOUNT_TEST_PASSWORD` for an isolated temporary account; use no real customer account. Without these variables that one journey is skipped. Email delivery is a separate manual acceptance check.

## Optional Supabase catalog

The official Supabase Postgres best-practices skill is installed at `.agents/skills/supabase-postgres-best-practices/`. Its RLS, types, constraints and indexing guidance is applied to the read-only public presentation catalog. The hosted catalog is now provisioned in project `simfvguqxbqevvrgkkdp`, with 36 published products and verified public read access.

1. For a new database, apply `supabase/migrations/20261013213040_public_catalog.sql` using the SQL editor or your normal migration workflow. This migration has already been applied to the connected project; do not apply it there again.
2. Apply `supabase/seed.sql`. The seed upserts the original demo records without deleting existing rows.
3. Copy `.env.example` to `.env.local` and set your project URL and **publishable** key:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. Restart the dev server. Confirm the 36 published entries appear.

Only published rows are readable by `anon`/`authenticated`. Those roles have no catalog write privileges. Never place a service-role key in a public variable. When configuration is absent the app uses its local catalog; when configuration is present but broken it reports a load error instead of silently substituting local data. The catalog's JSON sizing/quantity data is presentation data, not a transaction-safe stock ledger. A later commerce migration must normalize variant inventory, authorize private records and implement checkout transactions separately.

Catalog reads are deduplicated within a render, with a 60-second page revalidation interval. Set `NEXT_PUBLIC_SITE_URL` to the actual hostname when deploying so canonical URLs and the sitemap are accurate. Database availability is needed during a build when the Supabase adapter is configured.

To regenerate the seed after changing `src/lib/catalog.ts`:

```powershell
npx.cmd tsx scripts/generate-supabase-seed.ts
```

Hosted migration, seed import and public Data API access have been verified. A transaction that temporarily inserted an unpublished probe confirmed that anonymous users cannot read unpublished products, then rolled back the probe. Both `anon` and `authenticated` have SELECT privileges only. Supabase's security advisor returned no findings.

The local `.env.local` is configured for the connected project and is excluded from Git. To connect the Vercel deployment, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` using the corresponding local values, select Production, and redeploy. Keep `NEXT_PUBLIC_SITE_URL=https://stride-storefront-peach.vercel.app` for the deployed site. Only a publishable key is required.

To recheck the public connection without an account or privileged key:

```powershell
npx.cmd tsx scripts/verify-supabase.ts
```

The verifier checks all 36 IDs, prices, sale prices and size availability against the original catalog. Seed generation also rejects negative/noninteger prices and invalid compare-at prices.

## Validation

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

If Microsoft Edge is already installed, the browser tests can use it without downloading Chromium:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e
```

Playwright starts the local dev server if needed. Tests use a fresh browser context, not your normal browser's stored bag. See [docs/VALIDATION.md](./docs/VALIDATION.md) for the completed checks and limitations.

Production dependencies passed `npm audit --omit=dev` at implementation time. The full audit reported five linked high-severity entries in the lint-only `eslint-config-next → fast-glob → micromatch → braces` chain. The latest published braces version had no patched release at that check; do not force an unrelated Next.js downgrade to silence the report. Recheck development dependency updates before using lint tooling on untrusted patterns.

## Images and fonts

Images were generated through the built-in imagegen tool without reference images. Their saved paths and exact prompts are documented in [docs/ASSET_CREDITS.md](./docs/ASSET_CREDITS.md); machine-readable dimensions/provenance are in [docs/assets.json](./docs/assets.json). No Nike photos, logos, slogans, font files or source code are included.

DM Sans and Barlow Condensed are locally served through Fontsource under the SIL Open Font License. Their licenses are included in the installed packages. The standalone lettermark and missing-image illustration are original SVG code.

Screenshot evidence is saved under `artifacts/`. To refresh it while the app runs:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
node scripts/preview-review.mjs
```

Unknown products render the branded not-found page with `noindex` metadata. Next.js may return HTTP 200 if streaming has already begun, or 404 before streaming starts; the browser test verifies the fallback and indexing behavior.
