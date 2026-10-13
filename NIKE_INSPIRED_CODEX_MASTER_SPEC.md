# Nike-Inspired E-Commerce — Codex Master Build Specification

**Reference date:** October 14, 2026  
**Purpose:** A hand-off specification for Codex to build a complete, responsive fashion/sportswear storefront strongly inspired by Nike's information architecture, editorial minimalism, product discovery and shopping patterns.

> **Brand boundary:** Reproduce general UI patterns and functionality, **not** Nike's trademark, Swoosh, proprietary photos, advertising copy, or source code. Use an original brand identity, original/licensed imagery, original product content, and distinct marketing headings. This document is a detailed functional/design reference, not a pixel-perfect representation of every live Nike page. Nike changes pages by country, session and campaign.

## 0. Instructions to Codex (read first)

You are a senior full-stack engineer and product designer. Build a **production-quality, complete, functional** sportswear e-commerce website using this entire spec as the implementation contract. Do not stop at mockups. Build working pages, typed components, local seed data, responsive flows, persistent cart, product filtering, search, accounts and a demonstrable checkout. Work incrementally, run checks, test core user journeys, fix failing tests, and report precisely what is complete vs stubbed. Do not present fake checkout, server-side security, or payments as production-ready.

Before coding, inspect the repository and preserve existing stack, conventions, and data. If blank, use Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui primitives where helpful + Lucide icons + Prisma + PostgreSQL (SQLite for simple local demo if PostgreSQL is unavailable) + Auth.js or equivalent secure session auth + Zod validation. Use Stripe Checkout only when environment credentials exist; otherwise use an explicitly labeled **demo checkout** that records simulated orders and never requests real card numbers. Include `.env.example`, database migration/seed commands and README.

**Definition of finished:** Users can browse a real multi-page catalog, combine filters/sort, select sizes and color variants, add to cart, favorite products, use search, sign in, review their order, and complete a demo order. Links, empty states, mobile UI, loading indicators, and errors all work. No lorem ipsum, dead CTAs or silent no-ops.

## 1. Reference URLs and observations

- Homepage: https://www.nike.com/ — current regional page features editorial hero slides, campaign image panels, prominent call-to-action buttons, classic collection links, and multi-column category footer.
- Men's shoes PLP: https://www.nike.com/w/mens-shoes-5pxh3znik1zy7ok — page heading, show/hide filters, Sort By, pick-up filter, horizontal topical chips, filter sidebar, product grid and status labels.
- General new releases: https://www.nike.com/w/new-3n82y — additional catalog reference.
- Product detail: https://www.nike.com/t/air-max-dn-shoes-zPC01x — multi-image gallery, product name, category, sale/original price, color variants, size grid, size guide, add-to-bag, favorite, fulfillment information, detail accordion, reviews and complete-the-look recommendations.
- Additional PDP: https://www.nike.com/t/air-max-90-premium-mens-shoes-bAZ6AeHT/CN8490-002 — conventional single-price product detail.

These references establish *observable content and interaction patterns*. Precise CSS measurements, hover behavior, localization and layouts at every breakpoint are **design estimates**, not verified exact Nike specifications. Do not make claims of exact parity.

## 2. Product/design goal

A polished, editorial, high-conversion athletic apparel and footwear storefront. The visual hierarchy is photography first, simple black/white typography second, and merchandising third. Contrast heavily with white/near-white surfaces and dark text. Avoid dashboard styling, boxed cards, thick borders and loud gradients.

### Design tokens (recommended approximation, tune visually)

```css
:root {
  --page: #ffffff;
  --ink: #111111;
  --secondary: #707072;
  --subtle: #f5f5f5;
  --line: #e5e5e5;
  --sale: #b23a20;
  --radius-pill: 9999px;
  --radius-card: 2px;
  --content-max: 1440px;
  --page-gutter-desktop: 48px;
  --page-gutter-tablet: 24px;
  --page-gutter-mobile: 16px;
}
```

- Font: licensed sans, e.g. Arial/Helvetica/Inter; use a strong condensed **licensed** display font optionally for editorial headlines. Do not copy a proprietary Nike typeface.
- Typography: body 15–16px; labels 12–14px; listing names 16–18px medium; section headings 24–32px; campaign headings ~48–84px desktop, 36–48px mobile. Responsive clamp sizing; 1.1–1.5 line-height according to role.
- Primary buttons: solid black, white label, pill shape, 44–48px min height; inverse buttons on dark imagery; hover #333; accessible focus outline.
- Secondary controls: subtle border or unfilled text icons; minimum 44x44 interactive targets on mobile.
- Imagery: large product photography against soft neutral studio backgrounds; use `object-fit: cover` where appropriate; preserve full shoe visibility for product cards.
- White space: generous gutters and vertical spacing (e.g. 64–96px between homepage sections; 16–32px inside shopping UI).
- Animation: short opacity/transform transitions, 150–250ms; respect `prefers-reduced-motion`.
- Breakpoints (design suggestions): mobile < 640px; tablet 640–1023px; desktop ≥ 1024px; widescreen ≥ 1440px.

## 3. Information architecture and routes

| Route | Page | Requirements |
|---|---|---|
| `/` | Homepage | Promo ribbon, editorial hero, campaigns, collections, trending rails, shop by sport, footer |
| `/new` | New & Featured | Catalog with `new` filter, new arrivals spotlight |
| `/men` `/women` `/kids` | Audience landing | Audience hero, popular categories and shoppable collections |
| `/men/shoes` `/women/shoes` `/kids/shoes` | Category PLPs | Shared grid/filter/sort template |
| `/men/clothing` `/women/clothing` `/kids/clothing` | Clothing PLPs | Shared template with clothing sizes |
| `/shop/[category]` | Generic category PLP | Query-param driven faceted catalog |
| `/collections/[slug]` | Collection landing | Collection hero + filtered assortment |
| `/product/[slug]` | Product detail | Full variant and shopping flow |
| `/search?q=` | Search results | Typeahead, suggestions, sorting, faceting |
| `/favorites` | Wish list | Saved products, empty state, move to bag |
| `/cart` | Shopping bag | Editable cart, totals, discount code placeholder if no promo service |
| `/checkout` | Checkout | Contact, shipping, demo/real configured payment, review |
| `/checkout/success` | Order confirmation | Order ID, items, summary, email confirmation if configured |
| `/login` `/register` `/forgot-password` | Accounts | Secure validation, real auth or clear demo mode |
| `/account` `/account/orders` `/account/profile` | Account | Addresses, profile, order history |
| `/help` `/shipping-returns` `/size-guide` `/privacy` `/terms` | Informational | Real coherent copy, no fake policies |
| `/404` | Not found | Branded fallback with catalog links |

Header, campaign ribbons and footer must be shared layouts with mobile-specific behavior. Breadcrumbs on listing/detail pages recommended for usability.

## 4. Global page shell, top nav and footer

### Desktop header anatomy

1. Slim light-grey **utility strip**, approx. 30–38px high, with secondary logo/brand glyph optionally on left and `Find a Store | Help | Join Us | Sign In` on right.
2. Main white header approx. 64–80px high. Original brand mark left; center navigation `New & Featured`, `Men`, `Women`, `Kids`, `Sale`; search pill and heart/bag icons on right.
3. Header navigation mega-menu: hover/focus opens full-width white dropdown under nav, with 3–5 columns (`Featured`, `Shoes`, `Clothing`, `Shop by Sport`, `Collections`); keyboard accessible; close on Escape/outside click; no menu flicker.
4. Search action reveals focused search field and popular queries/typeahead, or navigates to results.
5. A small promotional announcement band under the nav rotates messages such as shipping thresholds or member promos with a `Shop`/`Details` link. Store messages in config; do not copy Nike campaigns verbatim.
6. Navigation may be sticky on upward scroll; avoid jumping layout when it changes.

### Mobile header

- Brand mark left; compact search, favorites, bag and hamburger controls right (prioritize fit).
- Slide-in drawer with expandable category sections, Account, Help, and currency selector.
- Full-screen or near-full-screen search overlay with recent searches and recommended terms.
- Close button, focus trap, body scroll lock and Escape behavior.

### Footer

- Dark text on white/light background, horizontal rules and ample vertical spacing.
- Four or more desktop columns: Resources, Help, Company, Shop / Featured; accordion groups on mobile.
- Bottom legal row: copyright, region/language, Terms, Privacy, Cookie Settings. Avoid pretending compliance exists until policy pages and cookie handling are implemented.

## 5. Homepage — exact section ordering to implement

1. **Announcement ribbon**: one-line promotional copy and text link; optional small previous/next controls.
2. **Hero campaign**: immersive full-bleed widescreen image/video (use local licensed placeholder images initially), headline and short strapline; CTA buttons. On mobile use separate crops/art direction via `<picture>`; never rely on illegible text over imagery.
3. **Secondary campaign rail**: 2–4 tall editorial cards on desktop, swipeable on mobile, each with image, kicker, headline, shop CTA.
4. **Trending / Featured**: title, horizontal scroll with cards highlighting collection launches. Left/right arrows desktop, touch scroll mobile.
5. **Shop by category**: large tiles for Running, Basketball, Training, Lifestyle, Clothing and Accessories.
6. **Classic silhouettes / iconic collections**: horizontal image/card rail linking to named product groups.
7. **Shop by sport**: large photographic cards with button CTAs.
8. **Membership/brand story**: distinct original marketing block, optional join prompt.
9. **SEO-friendly category link matrix** and main footer.

Avoid autoplay sound; pause videos offscreen and honor reduced motion. Every CTA links to a valid category/collection.

## 6. Product listing page (PLP) — priority: highest fidelity

### Desktop composition

```
┌──────────────────── optional promo + primary navigation ────────────────────┐
│ Men's Shoes (N)                  [Hide Filters]   [Sort By  ▾]              │
│ [Lifestyle] [Running] [Basketball] [Training] [Walking] [All...]  →        │
├──────────────────┬─────────────────────────────────────────────────────────┤
│ FILTERS          │ PRODUCT GRID                                            │
│ Pick Up Today    │ ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│ Gender           │ │ full photo │ │ full photo │ │ full photo │           │
│ Sale & Offers    │ │            │ │            │ │            │           │
│ Color            │ └────────────┘ └────────────┘ └────────────┘           │
│ Shop by Price    │ label/name     label/name     label/name                │
│ Size             │ subcategory    subcategory    subcategory               │
│ Brand            │ colors/price   colors/price   colors/price              │
│ Collections      │                                                         │
│ Sports           │ ... repeated rows, lazy load/pagination ...             │
│ Shoe Height      │                                                         │
│ Closure Type     │                                                         │
│ Width            │                                                         │
└──────────────────┴─────────────────────────────────────────────────────────┘
```

- Desktop filter sidebar approx. 230–260px; sticky within scrollable viewport under header if feasible.
- Main content: **3 columns desktop** when filters visible; larger layout can support 4 columns on wide screens if the photography still has good width; when filters hidden, 4 columns is an option.
- 2 columns on most mobile displays; 1 column on very narrow screens if necessary; 2–3 on tablet depending width.
- Cards should have **no heavy outer border**, image region nearly square (roughly 1:1), `background: #f5f5f5`, text stacked immediately below with ~8–12px vertical gap.
- Grid gap approx. 12–20px horizontally and 32–48px vertically.
- Title row: category name + **number of matching products**, hide/show filter toggle and sort control. Count updates with applied filters.
- Scrollable horizontally arranged category chips under title; selecting changes category/tag filter and active style.
- Sidebar groups separated by hairline borders; collapsible headers with chevrons and selected counts.
- **Observed filter groups:** Pick Up Today (when fulfillment exists), Gender, Sale & Offers, Color, Shop by Price, Size, Brand, Collections, Sports, Shoe Height, Closure Type, Width. Other catalog groups can be contextual (clothing fit, sleeve length, material).
- Color filter presents a color swatch circle plus color label, with checked/selected outline; multiple colors allowed.
- Size options are selectable chips/checks and differ by shoe vs apparel. Price ranges configurable by currency; default `0–25`, `25–50`, `50–100`, `100–150`, `150+` in USD-like demo catalog; allow a price slider or explicit ranges, not both unless useful.
- Filter groups with many items have `+ More / - Less`. Sticky or visible `Clear All` when any active filters.
- Sort dropdown: `Featured`, `Newest`, `Price: High-Low`, `Price: Low-High`, `Best Sellers`, optionally `Top Rated`.
- Query params represent all filters and sort; shareable URLs; browser back/forward works. Example: `/men/shoes?color=black,white&size=10&sort=price-asc&page=2`.
- Filter logic: AND across filter groups, OR within a multi-select group. No accidental mismatches between displayed count and cards.
- Mobile: sidebar replaced with **Filter & Sort** full-height sheet containing collapsible groups, `Clear`, number of matches, sticky `Show N Results` button; close and restore scroll safely.
- Empty results: clear explanation, `Clear filters`, suggestions and valid category links.
- Loading: grid-shaped skeletons; maintain layout and avoid major content shift.
- Pagination or Load More with stable ordering and URL state. If infinite loading, preserve browser history and screen-reader announcements.

### Product cards — field ordering and visual rules

```
┌────────────────────────────┐
│ [optional Just In tag]     │
│                            │
│       PRODUCT IMAGE        │  neutral studio background
│                            │
│            ♡               │  optional favorite affordance
└────────────────────────────┘
[Just In / Best Seller / Coming Soon / Sale]  <- conditional accent label
Product Display Name                       <- strong, dark
Men's Road Running Shoes                   <- muted product type
[3 Colors / +2]                            <- muted variants information
$89.97    $160.00    44% off               <- sale/current, old strikeout, discount
```

- Required fields: image, status badge only when relevant, product name, audience/type, current price, compare-at price if on sale, optional discount percentage, optional variant count/color thumbnails.
- Eligible labels seen on Nike pages: `Just In`, `Best Seller`, `Coming Soon`, `Recycled Materials`, `Highly Rated`, `Launching in ...` (replace trademarked launch platform with a generic launch state). Never print all badges on one product.
- Price rules: `currentPrice`, `compareAtPrice` only if higher; calculate `% off = round((old-new)/old*100)` and do not hardcode contradictory numbers.
- Out-of-stock products: visually clear but not hidden unless selected filter excludes them; mark unavailable sizes in detail.
- Clicking card/image/title opens PDP; heart click stops propagation; product swatch click updates preview without accidental navigation.
- Hover on desktop: subtle alternative photo or alternate-view swap **only if that image exists**; minimal shadow/elevation; no garish animation.
- Use image alt text naming product and color; `loading=lazy` after above-the-fold cards and responsive `sizes`.

## 7. Product detail page (PDP)

### Desktop layout

- Overall 2-column page: image gallery ~60–65% width, product purchase panel ~35–40% width; wide margins.
- Gallery consists of 2-column tiles or vertical images at large desktop; optional slim thumbnail strip. Support 6–10 product images (front, side, rear, outsole, detail, lifestyle) where assets exist.
- On mobile, swipeable gallery with image count/dots, followed by summary and options.
- Purchase panel near top of gallery, optionally sticky until its content ends.

### Information order

1. Product name (large but not hero-scale), category/audience subtitle.
2. Current price, original struck price and sale percent where applicable; product status label.
3. Color/variant thumbnails with accessible selected border, descriptive labels and valid variant switching. Preserve selected size if offered by next variant; otherwise clear with message.
4. Size heading: `Select Size` + `Size Guide` link/modal; responsive size grid of rectangular rounded border tiles. Unavailable sizes disabled and annotated.
5. Optional fit advice (e.g., `Runs small`) if product data supplies it.
6. `Add to Bag` primary solid-black pill full width; `Favorite` secondary outlined pill full width.
7. Validation: no size selected -> inline error, focus and scroll to size grid; no adding wrong/default size.
8. Shipping/pickup estimate, store finder **only if implemented**; otherwise no false inventory promises.
9. Short original description, color shown, SKU/style code.
10. Accordion/sections: Product Details, Material & Care, Shipping & Returns, Reviews. Relevant products may have technology/benefit editorial explainer.
11. Review summary, star distribution, verified reviews with moderation-safe placeholder seed data; do not claim AI review summaries unless actually generated and labeled.
12. Related products / Complete the Look rail from same category or complementary products.

### Interaction requirements

- Product image click/lightbox zoom with keyboard navigation, Esc close, next/prev, swipe on mobile.
- Color swatches update image gallery, pricing/stock and SKU URL or query param.
- Size guide modal has measurement reference with unit switch; it's data-driven by product type.
- Add to bag checks inventory and desired size server-side. Show toast/mini-bag summary with product image, variant, size, price, quantity and links to bag/checkout.
- Favorite status persists for signed-in users, or locally for guests then merges after login.
- Review filter/sort when seeded data supports it; reviews must not be fictitious customer claims on a live storefront.

## 8. Search experience

- Desktop focus overlay/popover with input, popular search terms, recent searches, product name suggestions and matching categories.
- Keyboard: Enter opens `/search?q=...`, arrow keys cycle suggestions, Escape closes.
- Debounced local search or server endpoint, cancel stale requests, minimum query length; normalize accents and case.
- Results use same reusable PLP with relevance sorting, count, selected filters, typo/empty state suggestions.
- Support category, brand, tags and name searches; highlight typed query safely.

## 9. Cart, wish list and checkout

### Bag

- Item rows: photo, name, color, size, unit price, quantity selector, remove, move to favorites.
- Recalculate totals on every change; do not assume constant inventory or discounts.
- Order summary: subtotal, shipping estimate, taxes displayed as estimated until shipping address known, total. Clear `Continue Shopping` CTA.
- Cart persisted across refresh; guest local storage acceptable for demo; authenticated cart preferably server backed with merge on login.
- Cart indicator in header updates instantly without a full refresh.
- Inventory validation happens again at checkout.

### Checkout

- Contact, shipping address, shipping method, summary, payment method, place order.
- Form validation with Zod/server actions and accessible errors.
- Currency/tax calculations done on server in integer minor units to avoid floating point inconsistencies.
- **Never capture actual card numbers yourself.** Integrate hosted Stripe Checkout only with valid environment config. Otherwise explicitly show `Demo Checkout — No Payment Collected`, record a mock paid=false order and show confirmation.
- Prevent duplicate order submission/idempotency; stock decrement transactional with clear errors. Apply real taxation, local legal and refund policies before production launch.

## 10. Data model — implement properly, not a static list

Tables/entities:

- `User`: id, name, email(unique), passwordHash or authProvider, timestamps.
- `Address`: id, userId, name, lines, city, region, postalCode, country, phone.
- `Category`: id, name, slug, parentId?, audience?, sortOrder.
- `Collection`: id, name, slug, description, heroImage, status.
- `Product`: id, slug(unique), name, subtitle/type, description, categoryId, gender/audience, sport, brand, status, collectionIds/tags, publishedAt, featuredRank, ratingAggregate optional.
- `ProductVariant`: id, productId, sku(unique), colorName, colorHex or swatchImage, priceMinor, compareAtMinor?, currency, inventory by size, image set.
- `ProductImage`: id, variantId, src, alt, displayOrder, mediaType.
- `Inventory`: variantId, sizeCode, quantity, reservedQuantity.
- `Favorite`: userId, productId/variantId, timestamps.
- `Cart` and `CartItem`: account/session ID, variantId, sizeCode, quantity; price recalculated from catalog.
- `Order` and `OrderItem`: immutable price snapshots, currency, shipping snapshot, status, paymentProvider, providerReference, totals.
- `Review`: productId, userId, rating, title, body, verifiedPurchase, published state, timestamps (seed as clearly demo reviews only).
- `Promotion` optional: code, discount rules, validity dates, redemption limits.

### Suggested TypeScript shape

```ts
type ProductStatus = 'just-in' | 'best-seller' | 'coming-soon' | 'sale' | 'standard';
type Audience = 'men' | 'women' | 'kids' | 'unisex';
interface CatalogProduct {
  id: string;
  slug: string;
  name: string;
  productType: string;
  audience: Audience;
  category: string;
  sport?: string;
  collections: string[];
  tags: string[];
  status: ProductStatus;
  variants: Array<{
    id: string; sku: string; colorName: string; swatch: string;
    priceMinor: number; compareAtMinor?: number; currency: string;
    sizes: Array<{ code: string; quantity: number }>;
    images: Array<{ src: string; alt: string }>;
  }>;
}
```

### Seed data

- Minimum **36 realistic original demo products** with a mix of men's, women's and kids' shoes, clothing and accessories, across running/lifestyle/basketball/training.
- At least 12 footwear items with 2–4 colors each; 5–8 gallery views for representative products; 8–12 size options for footwear; diverse available and sold-out sizes.
- At least six sale products with mathematically consistent before/after pricing, six new, six best sellers, and several regular items.
- Accurate filters from real dataset (no empty categories presented as populated); original image URLs only from licensed/allowed sources. If none exist, ship obvious local demo asset placeholders, **never hotlink or scrape Nike's images**.
- Store seed content centrally and do not duplicate records between catalog/search/detail.

## 11. Component plan

```
src/
  app/
    (store)/page.tsx
    (store)/men/page.tsx
    (store)/men/shoes/page.tsx
    (store)/women/shoes/page.tsx
    (store)/product/[slug]/page.tsx
    (store)/search/page.tsx
    (store)/cart/page.tsx
    (store)/checkout/page.tsx
    (auth)/login/page.tsx
    api/...
  components/
    layout/UtilityBar.tsx, Header.tsx, MegaMenu.tsx, MobileDrawer.tsx,
           AnnouncementBar.tsx, SearchOverlay.tsx, Footer.tsx
    home/HeroCampaign.tsx, EditorialTile.tsx, HorizontalRail.tsx,
         CategoryFeature.tsx
    catalog/ProductListing.tsx, FilterSidebar.tsx, MobileFilterSheet.tsx,
            FilterSection.tsx, ActiveFilters.tsx, SortMenu.tsx,
            ProductGrid.tsx, ProductCard.tsx, ColorSwatch.tsx
    product/ProductGallery.tsx, ProductInfo.tsx, SizeSelector.tsx,
            SizeGuideDialog.tsx, ProductAccordion.tsx, RelatedProducts.tsx
    commerce/CartDrawer.tsx, CartLineItem.tsx, OrderSummary.tsx,
             CheckoutForm.tsx
    ui/... (accessible primitives)
  lib/catalog.ts, filters.ts, pricing.ts, cart.ts, auth.ts, validation.ts
  data/seed.ts
  prisma/schema.prisma
  public/images/... (licensed/original assets)
```

Use server components for initial SEO and data fetch; client components for interactive facets, image gallery, drawers and cart. Avoid making the entire page a giant client component.

## 12. Responsive behavior detail

| Element | Desktop ≥1024 | Tablet 640–1023 | Mobile <640 |
|---|---|---|---|
| Main nav | Center links + mega menus | Condensed nav or drawer | Hamburger/drawer |
| Hero | Edge-to-edge wide campaign | Responsive crop | Tall portrait crop |
| Catalog filter | Left sticky sidebar | Side sheet or narrow sidebar | Modal/full-height bottom sheet |
| Product grid | 3 cols w/sidebar; 4 w/o | 2–3 cols | 2 cols, 1 only if too narrow |
| Product cards | Full details | Compact type | Compact text, no clipping |
| PDP | Gallery + right buy panel | Stacked or 55/45 | Gallery then options |
| Footer | 4 columns | 2 columns | Accordions |
| Product rail | Horizontal + arrows | Scroll/snapping | Touch horizontal snap |

Test at widths 320, 375, 390, 768, 1024, 1280, 1440 and 1920. Prevent horizontal document scrolling.

## 13. Behavior, state and accessibility acceptance criteria

- Keyboard usable: nav, mega-menu, filters, sizes, cart, dialogs, checkout.
- Semantic main/nav/header/footer, one H1 per page, heading hierarchy, focus-visible indicator, form labels and descriptive error messages.
- Dialogs have focus trap and restore focus to trigger; Escape closes and mobile drawer locks body scroll.
- Screen reader announces filtered product count and cart update status appropriately.
- All images have meaningful alt text (decorative campaign backgrounds may be empty alt if surrounding copy conveys meaning).
- Color alone is not sole indication of sale, selected variant or stock.
- Good contrast; supports 200% text zoom and reduced motion.
- Responsive images with `next/image`, image aspect ratio and width/height to limit CLS.
- Server-side validation and authorization for account/order operations; rate-limit sensitive endpoints; secure cookies and CSRF defenses consistent with chosen auth library.
- No exposed secrets; `.env.example` documents required environment variables.
- Canonical pages, metadata/title/description, product JSON-LD for truthful available data, sitemap and robots.
- Virtualize only if needed; paginate catalog; throttle expensive search/filter computations.

## 14. Functional user journeys / E2E tests

1. Home -> Men -> Shoes -> choose Black + Size 10 -> Sort low-to-high -> open product -> pick size -> add to bag -> checkout demo -> confirmation.
2. Filter with multiple colors + sale; refresh, back/forward; state remains in URL and count matches visible items.
3. Mobile filter drawer opens, selections apply, count updates and drawer closes without lost page position.
4. PDP changes color; thumbnails/price/stock update; unavailable size remains disabled; adding without size shows error.
5. Wishlist guest add/remove survives refresh; signed-in user favorite persists or merges.
6. Cart quantity update/remove updates totals and bag badge; inventory constraints stop overselling.
7. Search partial product name -> suggestions -> results -> selected product.
8. Login invalid credentials produce safe, useful error; authenticated orders stay isolated per user.
9. Checkout double click does not create multiple orders.
10. Test empty catalogs, invalid product slug, missing image, zero stock, loading/error network and responsive viewport.

Use Playwright for E2E, Vitest/Jest for filtering/pricing units, and axe for accessibility smoke tests. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` must all pass.

## 15. Suggested build sequence for Codex

**Phase 1 — foundation:** inspect repo; initialize stack/config; global tokens, typography, responsive container, header, footer, routing; test page skeletons.

**Phase 2 — catalog data:** schema, migrations, seed records, image strategy, typed queries, price utility, filtering/sorting, product URLs.

**Phase 3 — storefront:** homepage editorial sections; PLP and reusable product cards; working sidebar and mobile sheet; URL state.

**Phase 4 — PDP:** gallery, swatches, size guide/selection, inventory validation, reviews and recommendations.

**Phase 5 — commerce:** cart persistence, favorites, auth, checkout, order history, transactional order creation.

**Phase 6 — polish:** transitions, skeletons, SEO, accessibility and automated tests; cross-device QA; clear README and screenshots.

At each phase, list completed files/functions and outstanding blockers; do not silently skip or substitute non-working mock buttons.

## 16. Codex execution prompt (paste after attaching this file)

> Read `NIKE_INSPIRED_CODEX_MASTER_SPEC.md` in full. Treat it as the product/design/engineering contract. Build a responsive, production-quality Nike-inspired (not Nike-branded) sportswear e-commerce storefront in this repository. Start by inspecting the current codebase and writing a short implementation checklist. Then implement the project end-to-end, prioritizing the homepage, full product listing and filtering behavior, precise product-card content hierarchy, product detail gallery and size/variant selection, cart, search, and checkout. Populate at least 36 realistic original seed products, follow the responsive and accessibility specs, and make every visible user interaction functional. Use original or licensed visuals and brand assets; do not reuse Nike trademarks, copyrighted campaign copy or images. Run lint, typecheck, unit tests, E2E smoke tests and production build. Fix failures. Document environment setup, seed/run commands, demo checkout limitations, and a truthful completed-vs-pending checklist. If real payment or email credentials are absent, implement clearly labeled demo behavior rather than falsely claiming live integration.

## 17. Verification sources and limitations

Research pages consulted October 14, 2026:

1. https://www.nike.com/ — homepage structure and editorial campaigns (regional redirect possible).
2. https://www.nike.com/w/mens-shoes-5pxh3znik1zy7ok — visible filters and product card information.
3. https://www.nike.com/w/new-3n82y — new-arrivals category reference.
4. https://www.nike.com/t/air-max-dn-shoes-zPC01x — PDP structure and labels.
5. https://www.nike.com/t/air-max-90-premium-mens-shoes-bAZ6AeHT/CN8490-002 — secondary PDP reference.

**Not independently audited:** actual DOM/CSS values, exact pixel spacing, all megamenu hover states, real transaction flow, API internals, localization variants, and all product media rights. Design dimensions above are clearly marked approximate, and patterns should be verified visually against current pages during implementation when browsing is available.

## 18. Final acceptance checklist

- [ ] Distinct original brand, no Nike assets or proprietary copy
- [ ] Homepage campaigns + collection rails + working CTAs
- [ ] Desktop and mobile navigation + accessible menus/search
- [ ] PLPs with all contextual filters, sort, URL state and counts
- [ ] Responsive 3-column desktop cards, correct price/status formatting
- [ ] Mobile filter sheet and proper empty/loading states
- [ ] PDP gallery, variants, sizes, availability and size guide
- [ ] Add-to-cart, editable bag, wishlist, persisted state
- [ ] Secure account flow and order isolation
- [ ] Demo checkout (or actual provider if configured) and order receipts
- [ ] Seeded original catalog with at least 36 products
- [ ] Accessibility, image optimization, SEO metadata
- [ ] Automated tests and clean production build
- [ ] README, `.env.example`, migration/seed/setup directions
