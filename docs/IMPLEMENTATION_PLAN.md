# Nike-Inspired Storefront Implementation Plan

**Prepared:** October 14, 2026  
**Source of requirements:** [NIKE_INSPIRED_CODEX_MASTER_SPEC.md](./NIKE_INSPIRED_CODEX_MASTER_SPEC.md)  
**Current status:** Public storefront and account implementation built with Supabase. Customer signup/recovery activation requires configured email delivery. Real products, variants, inventory and checkout are deferred. See `README.md` and `docs/ACCOUNT_IMPLEMENTATION.md`.  
**Purpose:** Build a complete sportswear storefront with a layout closely inspired by the Nike reference, following the supplied specification.

## 1. Scope and working decisions

At initial planning the repository contained only the master specification. The application, original assets and hosted Supabase catalog are now implemented. The user has requested accounts next and deferred real product setup until products are available.

The finished website will support browsing, combined filters and sorting, search, product colors and sizes, favorites, a persistent shopping bag, registration and sign-in, checkout, order confirmation, and account order history. The highest design priority is the product listing page, followed by the homepage and product detail page.

| Decision | Planned approach |
| --- | --- |
| Visual direction | Closely follow the reference's editorial layout, large photography, white space, navigation structure, product grid, and shopping interactions. |
| Brand | Use **Stride** as a provisional original sportswear brand, with a simple wordmark and original product families. Keep brand content in configuration so it can be replaced later. |
| Identity and content | Follow the specification's boundary: original logo, product names, campaign copy, and original or licensed imagery. |
| Currency | USD for the initial demo, formatted centrally. Do not present a working multi-currency selector until conversion and pricing are implemented. |
| Database | Hosted Supabase PostgreSQL with versioned SQL migrations and database-enforced row ownership. |
| Authentication | Supabase Auth email/password authentication, server-verified users and HTTP-only session cookies. Signup/recovery need configured email. |
| Checkout | Explicit demo checkout by default: record an order with `paid=false`, collect no card details, and show a real order confirmation. Hosted Stripe is conditional on working credentials and completed provider validation. |
| Shipping and tax | Central, clearly labeled demo rules. No real delivery promises or claim of production tax compliance. |
| Reviews | Clearly marked sample reviews; no fictional verified-customer claims. |
| Delivery target | A working local application with documentation and validation evidence. Hosting and public launch are separate subsequent work. |

These defaults let implementation proceed without requiring branding, payment, or email services up front. Changes to the final brand, market, imagery, and hosting can be incorporated without changing the core page structure.

## 2. Reference evidence and design fidelity

The supplied document is the implementation contract. Reference pages guide composition and interaction patterns, rather than exact CSS or current campaign content.

During planning, readable content from the [Nike homepage](https://www.nike.com/) showed large campaign sections, shopping links, trending collections, and category navigation. The [men's shoes catalog](https://www.nike.com/w/mens-shoes-5pxh3znik1zy7ok) exposed filter controls, topical categories, size/color/price groups, and product status and pricing hierarchy. These support the general layout described in the specification.

The referenced [product detail page](https://www.nike.com/t/air-max-dn-shoes-zPC01x) did not provide reliable full interaction content in this browsing session. Its gallery and purchase-panel requirements will therefore follow the supplied specification, with visual review during implementation when browser access permits. No exact pixel measurements, hover states, or breakpoint behavior have been independently verified. Regional and campaign differences are expected.

**Design review criteria:** compare the hierarchy, image proportions, header density, gutters, grid spacing, typography, and mobile stacking against the brief. Similarity should come from those deliberate choices throughout the website.

## 3. Visual system

### Palette, typography, and spacing

| Token | Value / role |
| --- | --- |
| Page | `#FFFFFF` — primary background |
| Ink | `#111111` — headings, body text, primary buttons |
| Secondary | `#707072` — supporting product metadata |
| Subtle | `#F5F5F5` — utility strip and product image backgrounds |
| Line | `#E5E5E5` — separators and control outlines |
| Sale | `#B23A20` — sale/status accents, subject to contrast review |
| Body and controls | Arial/Helvetica system sans stack, generally 15–16px |
| Editorial display | Licensed condensed face such as locally hosted Archivo Black; confirm license and visual fit before adoption |
| Type scale | Metadata 12–14px; product names 16–18px; sections 24–32px; campaign headings 48–84px desktop and 36–48px mobile using `clamp()` |
| Content width | Approximately 1440px for contained sections; hero and selected campaign panels may extend edge to edge |
| Page gutters | 48px desktop, 24px tablet, 16px mobile |
| Section spacing | Usually 64–96px; shopping controls use tighter 16–32px spacing |
| Controls | Black/white pill CTAs; minimum 44px touch targets; visible keyboard focus |
| Product images | Nearly square, neutral studio background, complete shoe visible; no heavy card frame |
| Motion | Short 150–250ms responses to interaction; respect reduced motion |

Use photography as the main visual statement. Keep product information left aligned. Campaign copy may be centered below its image or positioned in a readable image zone, with mobile treatment chosen separately. Reserve rounded pills for buttons and controls; do not turn every section into a rounded container.

### Desktop wireframes

```text
GLOBAL SHELL
Utility strip: brand detail                         Help / Join / Sign in
Wordmark           New & Featured / Men / Women / Kids / Sale   Search / Heart / Bag
Announcement band with a working details or shop link

HOMEPAGE
Full-width campaign image with desktop/mobile art direction
Campaign headline + short copy + primary shopping CTAs
Editorial tile        Editorial tile        Editorial tile
Trending / Featured product rail
Shop by category tiles
Original classic collection rail
Shop by sport photography
Membership / brand story
Category link matrix
Footer columns + legal row

PRODUCT LISTING
Breadcrumb
Men's Shoes (matching count)                     Hide Filters / Sort By
Lifestyle / Running / Basketball / Training / Walking chips
Filter sidebar       Product image       Product image       Product image
~240px wide          Status/name/type    Status/name/type    Status/name/type
Accordion groups     Colors/price        Colors/price        Colors/price
                     Further rows + pagination

PRODUCT DETAIL
Breadcrumb
Gallery: ~60–65%                           Purchase panel: ~35–40%
Large image tiles / thumbnails             Name / type / price
Lightbox on image activation               Color thumbnails / size guide / sizes
                                          Add to Bag / Favorite
                                          Fulfillment / details / reviews
Related products / complete-the-look rail
```

### Responsive rules

| Area | Desktop ≥1024px | Tablet 640–1023px | Mobile <640px |
| --- | --- | --- | --- |
| Header | Utility strip, centered navigation, mega-menus | Compact controls; drawer when space demands it | Wordmark, compact icons, hamburger; omit utility strip |
| Hero | Wide campaign image | Responsive crop | Dedicated portrait crop and readable copy |
| Catalog | Sidebar plus 3-column grid; optionally 4 without filters | 2–3 columns with sheet filters | 2 columns; 1 only where needed at very narrow widths |
| Filters | Collapsible sidebar groups | Sheet | Full-height Filter & Sort sheet with sticky apply action |
| PDP | Gallery beside purchase panel | Stack or 55/45 split if usable | Swipe gallery, summary, options, details |
| Rails | Horizontal cards with arrow controls | Touch/scroll | Touch scroll with snapping |
| Footer | At least 4 columns | 2 columns | Accordion groups |

Validate at 320, 375, 390, 768, 1024, 1280, 1440, and 1920px. Preserve readability at 200% zoom and prevent document-level horizontal scrolling.

## 4. Application architecture

| Layer | Technology and responsibility |
| --- | --- |
| Application | Next.js App Router + TypeScript; server components for initial pages and catalog data |
| Styling | Tailwind CSS with shared design tokens and a small set of reusable layout classes |
| UI primitives | shadcn/ui or accessible underlying primitives where useful for dialogs, sheets, menus, and accordions |
| Icons | Lucide, consistently sized and accompanied by accessible names |
| Persistence | Supabase PostgreSQL, versioned SQL migrations, repeatable seeds and owner-only RLS |
| Auth | Supabase Auth, HTTP-only session cookies, server-side identity checks and managed password hashing |
| Validation | Zod schemas reused across forms and server operations |
| Interactive state | Small client components and a cart/favorites provider; URL state for catalog filters |
| Images | `next/image`, local assets, responsive sizing, explicit dimensions and fallbacks |
| Tests | Vitest for business rules, Playwright for journeys, axe for accessibility smoke checks |

Keep mutually compatible dependency versions and the committed lockfile. Read the installed Next.js guides before code changes, and use Supabase SSR/PostgreSQL conventions for the implemented backend.

Supabase Auth now supersedes the initial Better Auth proposal. Use `@supabase/ssr` server clients, Next.js Proxy session refresh and verified identity in each protected handler. Supabase manages the auth schema; customer migrations reference `auth.users` without changing its structure.

The deployment uses durable hosted Supabase storage. Local catalog fallback is a presentation demo, not a replacement for customer account persistence.

### Proposed project structure

```text
src/
  app/
    layout.tsx
    (store)/                  # Homepage, landings, catalog, PDP, bag, favorites
    (checkout)/               # Checkout and order confirmation
    (auth)/                   # Login, registration, password recovery
    (account)/                # Profile, addresses, orders
    (info)/                   # Help, policies, size guide
    api/auth/[action]/         # Supabase authentication handlers
    api/account/              # Profile, addresses and account shopping
    auth/callback/            # PKCE confirmation/recovery callback
    api/search/               # Bounded typeahead endpoint
    not-found.tsx
    sitemap.ts
    robots.ts
  components/
    layout/                   # Header, mega-menu, drawer, search, footer
    home/                     # Campaigns, editorial tiles, category and sport rails
    catalog/                  # Listing, facets, sort, cards, active filters
    product/                  # Gallery, swatches, sizes, lightbox, detail accordions
    commerce/                 # Bag rows/drawer, checkout form, order summary
    account/                  # Auth/profile/address/order UI
    ui/                       # Shared accessible primitives
  lib/
    server/                   # DB, auth, catalog queries, cart and order services
    filters.ts                # Query parsing and filter rules
    pricing.ts                # Minor-unit math and formatting
    validation.ts             # Input contracts
    config.ts                 # Brand, navigation, shipping/demo mode settings
  data/                       # Central original seed content and asset manifest
supabase/
  migrations/
  seed.sql
  tests/                      # Rolled-back database assertions
public/images/                # Campaigns, products, collections and fallback media
tests/
  unit/
  integration/
  e2e/
docs/                         # All project documentation, specifications and plans
  README.md
  IMPLEMENTATION_PLAN.md
  NIKE_INSPIRED_CODEX_MASTER_SPEC.md
  ADMIN_CMS_PLAN.md
.env.example
```

Keep client components focused on interaction. Database access, authorization, inventory checks, and final monetary calculations remain server-side. Avoid separate hardcoded product arrays for the homepage, listing, search, and PDP.

## 5. Routes and page responsibilities

| Routes | Implementation |
| --- | --- |
| `/` | All nine homepage sections, in the exact specification order |
| `/new` | New-arrivals spotlight and reusable catalog with new-product constraint |
| `/men`, `/women`, `/kids` | Audience campaigns, categories, and collection links |
| `/men/shoes`, `/women/shoes`, `/kids/shoes` | Shared shoe listing with route audience/category constraints |
| `/men/clothing`, `/women/clothing`, `/kids/clothing` | Shared clothing listing with appropriate sizes and attributes |
| `/shop/[category]` | Generic catalog, including `/shop/all`; validate category slugs |
| `/collections/[slug]` | Original collection hero and its real assortment |
| `/product/[slug]` | Gallery, variant/size purchase panel, details, sample reviews, related items |
| `/search?q=...` | Relevance results using the same cards, facets, and pagination |
| `/favorites` | Guest or account saved products; move to bag requires a valid size |
| `/cart` | Editable bag, inventory messages, totals, favorites action |
| `/checkout`, `/checkout/success` | Validated checkout and authorized persisted order confirmation |
| `/login`, `/register`, `/forgot-password` | Real account flows, safe errors, email capability handling |
| `/reset-password` | Supporting token-based recovery route when reset delivery is configured |
| `/account`, `/account/orders`, `/account/profile` | Protected overview, order history, editable profile and addresses |
| `/help`, `/shipping-returns`, `/size-guide`, `/privacy`, `/terms` | Useful original information and accurate demo limitations |
| `/404` and unmatched paths | Branded fallback using Next.js `not-found.tsx`; explicit `/404` can render the same fallback |

The Sale navigation item links to `/shop/all?sale=true`; a separate Sale template is unnecessary. Footer links must resolve to real pages or meaningful sections on these pages. Do not create fake store locations, pickup availability, support contacts, or corporate pages merely to fill navigation.

## 6. Catalog, assets, and data model

### Initial assortment

Create at least **36 distinct original products**: 18 footwear, 12 clothing, and 6 accessories. Distribute footwear and clothing across men, women, and kids, with unisex products explicitly mapped to compatible audiences. Cover running, lifestyle, basketball, and training; category and campaign links must point to populated assortments.

- At least 12 footwear products have 2–4 colors each.
- Footwear has 8–12 appropriate size options per product, with explicit size systems and mixed available/sold-out inventory.
- Include at least six sale products, six new products, six best sellers, and regular items. Include coming-soon and sold-out cases for state validation.
- Representative PDPs have 5–8 distinct gallery views where real assets exist. Other products show only the available media; never repeat one image to imply multiple views.
- Define original collection families, for example Stride Pace, Court, Everyday, and Motion, with truthful membership in the dataset.
- Give every product useful descriptions, category/type metadata, SKU, material/care content, and meaningful image alt text.
- Store prices in integer minor units, derive discount percentages, and prohibit contradictory sale data.

For each relevant filter, seed the supporting attributes: shoe height, closure, width, clothing fit, sleeve length, material, collection, sport, audience, and colors. Brand filtering should reflect the original dataset; do not invent extra brands to imitate Nike's categories.

### Asset preparation

Inventory imagery before page construction. Use original or permitted assets with an asset manifest recording source, license/permission, attribution where needed, product mapping, and available views. Use coherent campaign photography and accurate product-specific studio images. Prepare separate mobile hero crops.

When good assets are unavailable, use obvious local demo placeholders and record the replacement work. Do not hotlink Nike media or use unrelated photos as a shoe gallery. Missing imagery is a material visual limitation and remains visible in the completion report. Fonts also need their license recorded.

### Database responsibilities

| Models | Purpose and integrity rules |
| --- | --- |
| Auth User, Session, Account, Verification | Use the auth library's schema; unique email and secure credential/session handling |
| Address | User-owned shipping addresses; authorize every read/write |
| Category, Collection, ProductCollection | Hierarchy, audience, editorial assortment, many-to-many collection membership |
| Product | Unique slug; merchandising status, sport, attributes, timestamps, feature rank |
| ProductVariant, ProductImage | Unique SKU; color, price, currency, media order and alt text |
| Inventory | Unique `(variantId, sizeCode)` record with nonnegative available/reserved quantities |
| Favorite | Unique saved product per user; optional preferred variant |
| Cart, CartItem | Authenticated persistence; item identity includes variant and size |
| Order, OrderItem | Immutable product/price/address snapshots, server totals, payment state, unique idempotency key |
| Review | Sample-data marker, published state, rating/body; no unsubstantiated verification |
| Promotion | Optional only if a genuine validated promo service is added |

Seeds are repeatable by stable IDs/slugs. Seed commands must not silently erase user accounts or orders; provide a separate explicit reset command for the isolated demo/test database.

## 7. Interaction and server behavior

### Navigation and homepage

Build a shared utility strip, main header, announcement band, and footer. Desktop mega-menus open on pointer and keyboard focus, stay stable while moving into the menu, and close on Escape or outside activation. Mobile uses a focus-trapped drawer with expandable categories and scroll locking. Search receives focus when opened. Every CTA maps through shared route configuration.

Implement the homepage in this order: announcement, hero, secondary campaign rail, trending/featured, shop by category, original classic collections, shop by sport, membership/story, category link matrix and footer. Use real catalog data for rails; membership CTA opens registration. Start with a still-image hero; video is optional and must be muted, pausable, and reduced-motion aware.

### Listing, filters, sorting, and pagination

- Use one URL parser and shared query contract across category, audience, collection, new, sale, and search pages.
- AND across groups, OR within a multiselect group. Route constraints remain in effect and cannot be accidentally cleared by query parameters.
- Match color, size, stock, and price against a compatible variant; do not show a product as available in black size 10 when only its white variant has that size.
- Choose a matching preview variant for the card so the image and displayed price agree with the current filters. Unfiltered cards use an explicit primary variant.
- Keep query parameters canonical and validated. Ignore or safely reject invalid values; changing a filter, query, or sort resets the page to 1.
- Support Featured, Newest, price ascending/descending, Best Sellers, and relevance on search. Define deterministic tie-breaking by stable ID or slug. Best-seller order uses documented demo merchandising data.
- Use numbered URL pagination initially, for example 12 products per page. The heading reports all matching products; the page also identifies which slice is shown.
- Browser refresh and back/forward restore applied state. Product counts, cards, active chips, and empty states must agree.
- Desktop filters apply immediately. Mobile edits use temporary sheet state and preview count; `Show N Results` commits state, while cancel/close restores applied selections.
- Show only relevant facets. Pickup is absent until there is a real fulfillment model. Handle zero results, invalid pages, loading, and query errors visibly.

### Product detail

Color changes update gallery, price, SKU, and availability together, with a variant query parameter. Keep a selected size only if available on the next variant; otherwise clear it and explain why. No implicit default size. Coming-soon products and unavailable sizes cannot be purchased.

Provide a keyboard-operable image lightbox, mobile gallery navigation, descriptive variant labels, a type-specific size guide with unit switch, details/care/shipping accordions, clearly labeled sample review summaries, and data-backed related products. Add-to-bag validates variant, size, and quantity on the server before reporting success.

### Search

Use a bounded, debounced server endpoint for product and category suggestions. Normalize case/accents, cap query length and results, cancel or ignore stale requests, and safely highlight text. Arrow keys navigate suggestions, Enter opens results, Escape closes. Persist a small recent-query history locally. Results use the shared catalog with deterministic relevance, sort, facets, and useful empty suggestions.

### Bag, favorites, and sign-in

Persist the guest bag and favorites in versioned local storage; validate their contents against the catalog when restored. Signed-in state is server-backed. Merge guest state once after successful sign-in: deduplicate by variant/size, cap quantities against inventory, union favorites, and report adjustments. Clear guest data only after a successful merge, and clear account-specific cached data on logout.

Changing quantities, removing items, or moving to favorites updates the bag badge and totals immediately, with pending/error handling and rollback if a server mutation fails. Moving a favorite to the bag invokes size selection instead of adding an arbitrary variant. Recheck inventory after restoration and before checkout. Promotions remain a clearly explained demo limitation unless validated promotion logic exists.

### Checkout and confirmation

1. Validate contact, shipping address, and shipping method on the client and server.
2. Re-read products, prices, availability, and currency server-side. Recalculate shipping, explicitly simulated taxes, and final totals in minor units; never trust submitted totals.
3. Issue an idempotency key scoped to the cart/customer, persist it with a uniqueness constraint, and reuse the existing result on retries.
4. In demo mode, transactionally check/decrement inventory and insert order snapshots. Use conditional stock updates so concurrent requests cannot reduce inventory below zero; rollback all changes on failure.
5. Keep `paid=false` and a clearly separate demo order status. Disable duplicate submits in the UI in addition to server idempotency.
6. Clear the purchased bag only after success. Render the confirmation from the stored order rather than client-supplied totals.
7. Restrict account order access by user. Guest confirmation requires an unguessable access token or session authorization; an order ID alone never grants access.
8. Send receipts only with a configured email provider. Otherwise show the on-screen receipt and accurately state that no email was sent.

If Stripe credentials exist, use hosted Checkout with server-created prices and signed, idempotent webhooks. Reserve inventory before redirect, release expired reservations, and finalize only after verified payment events; a success URL is not evidence of payment. Validate the test-mode path before calling it complete. Without configuration, the complete demo flow remains the delivery target.

### Accounts and informational pages

Implement registration, login/logout, protected profile/address editing, and isolated order history using the auth library. Validate all writes, use safe generic credential/recovery errors, rate-limit sensitive endpoints, and enforce authorization in server handlers rather than only route navigation.

Password recovery uses expiring single-use tokens when email delivery is configured. Without email, `/forgot-password` clearly explains the unavailable delivery capability and offers useful login/help navigation; it must not claim a reset email was sent. Record this conditional feature in the README and completion checklist. Any local development email-preview mechanism must stay local and disabled in deployed environments.

Write coherent help, sizing, demo shipping/returns, privacy, and terms content that describes actual behavior. Do not fabricate live customer service, legal compliance, or refunds. Cookie Settings must open a working preference control when optional cookies exist; otherwise explain the essential-cookie behavior honestly.

## 8. Implementation milestones

Execute sequentially so later screens depend on working data and services. At each milestone, update progress, record material limitations, and run checks appropriate to the changes.

| Phase | Deliverables | Exit check |
| --- | --- | --- |
| 1. Foundation and design baseline | Verify local instructions/toolchain; initialize Next.js/TS/Tailwind; pin dependencies; add tokens, typography, route skeletons, header/footer primitives, env template and scripts | App starts; shared shell is responsive; baseline lint/typecheck/build succeed |
| 2. Data and imagery | Select database provider; integrate auth schema; migrations; 36+ products; asset manifest; catalog queries, price utilities, facet parser and stable sort | Fresh DB can migrate/seed; seed constraints, filtering and price rules have meaningful passing tests |
| 3. Shared catalog and navigation | Product cards, desktop facets, mobile sheet, sort, active chips, pagination; audience/category/new/sale/collection routes; mega-menu and search overlay shell | Men → Shoes journey works; URL restore/back/forward and count consistency pass; PLP visually reviewed on desktop/mobile |
| 4. Editorial storefront and search | Exact homepage section sequence, audience/collection heroes, populated rails, category/sport CTAs; working typeahead and search results | Every visible marketing/navigation CTA reaches valid content; search keyboard and empty states work |
| 5. Product detail and guest shopping | Galleries/lightbox, variants, sizes/guide, stock validation, details/reviews/related items; persistent guest bag and favorites | Size/color changes are consistent; no-size/zero-stock errors work; add-to-bag and refresh persistence pass |
| 6. Accounts and account commerce | Register/login/logout, recovery capability handling, profile/addresses, server bag/favorites, merge and order authorization groundwork | Invalid credentials handled safely; guest merge is repeatable; users cannot access each other's state |
| 7. Checkout and orders | Shipping/contact validation, server totals, transactional stock, idempotent demo orders, protected confirmation and order history; conditional payment/email integration | End-to-end demo order persists; retries/concurrent stock checks pass; confirmation and history show the same snapshots |
| 8. Final review and handoff | Info pages, metadata/JSON-LD/sitemap/robots, loading/errors/fallbacks, accessibility and responsive fixes, full verification, README/screenshots/status checklist | Required commands and journeys pass; remaining conditional integrations and image limitations are explicitly documented |

Accessibility, responsive behavior, loading/error states, and service validation are built into each phase. Phase 8 reviews them across the assembled application.

The first implementation milestone should produce a running branded shell and establish the database/asset approach. The first substantial visual review should use a populated product listing page, because it is the highest-fidelity requirement in the specification.

## 9. Verification plan

### Business rules and integration

Test combinations that could produce incorrect shopping behavior: AND/OR facets, same-variant color/size availability, route constraints, sort tie-breaking, count/pagination consistency, minor-unit totals, discount math, stock caps, repeatable cart merging, checkout idempotency, transaction rollback, and account/guest order isolation. Use isolated test data and databases; never reset the user's working database as part of a test run.

### Browser journeys

1. Home → Men → Shoes → Black + Size 10 → low-to-high sort → PDP → choose size → bag → demo checkout → confirmation → persisted order history.
2. Multiple colors + sale filter; refresh and back/forward preserve state, and counts match the query.
3. Mobile Filter & Sort opens, previews changes, applies results, restores focus, and preserves page position; cancel discards draft selections.
4. PDP variant switch updates stock/price/gallery, unavailable sizes stay disabled, and missing-size add shows a usable error.
5. Guest favorites persist; sign-in merges them with existing account favorites.
6. Bag quantity/remove/favorite actions update totals and badge, and stock limits are enforced.
7. Partial-name search works with keyboard suggestions and leads to a matching PDP.
8. Invalid login errors are safe; profile, cart, favorites, and order reads remain isolated between users.
9. Double submission/retry creates one order; competing purchases cannot oversell.
10. Empty results, invalid slug/category, missing media, sold-out product, network failure, loading, and narrow layouts remain usable.

### Accessibility, performance, and SEO

Check landmarks, one H1 per page, heading order, labels/errors, accessible names, selected state beyond color, dialog focus trap/restore, Escape, body scroll lock, keyboard menus, live count/cart announcements, contrast, zoom, and reduced motion. Run axe smoke checks on homepage, PLP, PDP, bag, and checkout, with manual keyboard checks for overlays.

Review screenshots at the specified widths for photo crop, full shoe visibility, type hierarchy, gutters, header fit, filter behavior, and overflow. Optimize image formats/sizes; prioritize only appropriate above-the-fold media and lazy-load remaining images. Avoid layout shifts and unnecessary client JavaScript.

Add accurate page metadata, canonical URLs, product structured data using actual price/availability, sitemap, and robots. Avoid indexing account, checkout, or private order pages; define canonical/noindex behavior for facet combinations to avoid unlimited duplicate catalog URLs. Build/runtime database access must be documented and tested from a clean setup.

### Required project commands

Expose these scripts in `package.json`; on this Windows workspace run npm through `npm.cmd`:

```text
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run test:e2e
npm.cmd run build
```

Provide `dev`, database migration, database seed, and explicit test/demo reset scripts as well. Current tool inspection found Node `v24.14.1` and npm `11.11.0`; PowerShell blocks the `npm.ps1` shim, while `npm.cmd` works. Verify compatibility when selecting dependencies rather than changing the machine's execution policy.

## 10. Deliverables and completion tracking

- [x] Inspect the supplied specification and current repository.
- [x] Save this implementation plan before building.
- [x] Working Next.js application and responsive shared shell.
- [x] Original identity and concept assets with a source/license manifest; actual product imagery deferred.
- [x] Migrations and repeatable seed with 36 demo products; real assortment deferred.
- [x] Homepage, audience/collection pages, reusable catalog, and working search.
- [x] Facets, sorting, pagination, query-state restoration, and truthful product counts for current demo data.
- [x] Demo PDP image zoom, sizes, size guide, details and related products.
- [ ] Real product media, color variants and inventory (deferred until supplied).
- [x] Persistent guest/account bag and favorites with repeatable merging.
- [x] Account pages, login/logout, profile/addresses and private data isolation.
- [ ] Customer signup and password recovery email activation and delivery acceptance checks.
- [ ] Isolated order history (deferred with checkout).
- [ ] Transactional, idempotent demo checkout and protected receipts.
- [ ] Useful info pages, empty/loading/error states, accessibility, and SEO.
- [ ] Passing lint, typecheck, business-rule tests, browser journeys, and production build.
- [ ] README, `.env.example`, setup/migration/seed instructions, screenshots, and completed/pending report.

The README will identify the chosen database, tested dependency versions, required environment variables, exact setup commands, demo shipping/tax behavior, payment and email configuration, asset limitations, and any conditional capabilities. Real payments, email delivery, live fulfillment, final merchant policies, and public hosting must be listed according to what is actually configured and verified.

**Current implementation note:** The public storefront, 36-product demo catalog and customer account code are implemented. Hosted catalog RLS and customer ownership rules have been verified. Accounts include protected profile/addresses, sign-in/out, account shopping and repeatable guest merges. Registration and recovery are implemented but deliberately disabled until email delivery is configured and verified. Vercel must have both Supabase variables to enable backend access. The user has deferred real products, variants/galleries, inventory and checkout until products are available. This does not mark the full commerce roadmap complete.

**Next action:** Activate and verify customer confirmation/recovery email using `docs/AUTH_SETUP.md`, choose the final brand name, and supply real product data when ready. Product variants, stock and checkout remain deferred; account implementation does not mark those commerce milestones complete.
