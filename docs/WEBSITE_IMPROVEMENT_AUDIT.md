# Website review and audience-growth plan

Reviewed October 14, 2026. Scope: review and recommendations only. No application changes, database changes, emails, commits, pushes or deployments were made for this review. The separate temporary email preparation in `AUTH_SETUP.md` remains local and its actual delivery is not yet verified.

## Main recommendation

Keep the white theme and black-hoodie hero the user selected. Improve the brand message, local shopping details and reliability first. Audience growth needs discovery through content/search/creators, a clear reason to join or return, and a dependable shopping experience. The feature suggestions below are hypotheses to test, not promises of traffic or sales.

Working assumption: a Pakistan-focused hoodie and casual streetwear brand. Its final name, launch assortment, prices and target customer are still undecided. Real products, stock and checkout remain deferred as requested.

## What was checked

- Reviewed the implementation plan, current delivery notes, home/navigation, catalog/filter/search, product/detail/size guide, bag/favorites, account/auth, help/policies, metadata, sitemap and data adapter code.
- Requested all 60 URLs in the local sitemap, including all 36 demo product pages. Requested 12 additional account, utility, search and invalid routes. Examined titles, H1 output, canonical/noindex metadata and structured-data presence. HTTP results are interpreted with Next.js streaming/redirect behavior; a 200 alone does not prove a working page.
- Ran desktop browser/axe checks on home, clothing catalog, product, bag, favorites, registration, help and size guide. No serious/critical violations were found in those scans and no JavaScript page errors were observed. These are smoke checks, not a complete accessibility certification.
- Checked six templates at 390px: home, clothing catalog, product, bag, registration and help. No document-level horizontal overflow was observed. Inspected the current desktop/mobile screenshots.
- Checked the public Vercel homepage, one product, help and sitemap. All returned 200; the live homepage contains the black-hoodie hero. The sampled product canonical URL uses the actual Vercel domain.
- Follow-up checks covered additional rendered internal links and unauthenticated account/recovery redirects. A streamed `/reset-password` response initially has no H1 because it redirects; the browser resolves to the recovery-request page. That is expected behavior, not a missing-content finding.

Machine-readable evidence is in ignored local `.tools/website-audit.json` and `.tools/website-audit-followup.json`. Screenshots are in `.tools/audit-*.png`.

Limits: no real purchase flow exists; no real products were supplied; this review did not send signup/recovery emails or sign into a customer account. Account ownership checks and the isolated authenticated shopping journey were performed during the prior account milestone. Safari, Firefox, real devices, assistive-technology testing, field performance and production environment-variable configuration were not audited here. Matching live demo data does not establish whether Vercel is using the Supabase adapter or local fallback.

## Existing strengths to keep

- White space, consistent typography, the original hoodie hero and clear product grids provide a useful visual foundation.
- Responsive navigation, image zoom, visible size buttons, mobile filters, URL sorting/search and guest bag/favorites already exist.
- Account syncing, repeatable guest merging, private data permissions and profile/address pages already exist; rebuilding these would add little value.
- Local images, compression, licensed local fonts, reduced-motion handling, metadata, sitemap and honest demo limitations are present.
- The product concept disclosures and absence of invented customer reviews are appropriate while real merchandise is unavailable.

## Prioritized findings

| Priority | Finding and evidence | Recommended improvement | Completion check / dependency |
| --- | --- | --- | --- |
| P0: reliability | `StoreProvider` returns false for an action while account state is loading or saving fails, while `ProductDetail` treats every false result as a stock-limit error. A prior browser run reproduced a misleading stock message on a fast add; retry passed. Sources: `src/components/store-provider.tsx`, `src/components/product-detail.tsx`. | Give loading, unavailable size, quantity limit and failed persistence distinct outcomes. Show readiness/saving feedback and prevent premature actions. Show “saved” only after server acknowledgement for account operations. | A delayed session and failed shopping request show the correct message; valid stock remains addable after readiness, and failed saves do not present success. |
| P0: account testing | Temporary local signup/recovery is enabled, but callback allowlist and actual delivery still require manual testing. The built-in sender is restricted to team members. | Finish the local confirmation/recovery acceptance check. Keep general customer signup dependent on a proper sender and production setup. | Confirmation works in the requesting browser; recovery changes the password; the old password fails. No claim that setting a flag establishes email delivery. |
| P1: positioning | The hero shows a black hoodie, but its CTA and small label promote Pace/running. Lower sections emphasize shoes, courts and sports. Source: `src/app/page.tsx`. | Once the launch direction is confirmed, align the hero copy and destination with hoodies/casualwear or a first-drop preview. Choose navigation from the actual assortment. Preserve the chosen layout while making its content relevant. | A first-time visitor understands what the brand sells and where the main button goes. No links to fabricated hoodie inventory. |
| P1: Pakistan localization | Prices and price filters use USD; footer says United States. Sources: `src/lib/utils.ts`, `src/components/catalog-view.tsx`, `src/components/footer.tsx`. The demo database also constrains currency to USD. | Introduce actual PKR prices and compatible currency data/formatting, then update filters, bag totals, product metadata and country copy consistently. | Actual merchant prices are supplied. Every displayed amount agrees; changing only `$` to `Rs` is insufficient. Product pricing remains deferred. |
| P1: customer confidence | PDPs use one shared concept image and illustrative sizing/materials. There are no real product measurements or garment videos. | When products arrive, photograph each real item: front/back, model fit, fabric/detail and accurate colours. Include garment measurements, model height and worn size, fit notes, fabric composition and measured GSM when known. | All claims and measurements match real garments. Provide cm/inch sizing and the existing zoom/size selection. Never use an AI concept as proof of the delivered product. |
| P1: launch readiness | Bag correctly says purchasing/shipping are unavailable; no checkout, orders, fulfillment or merchant payment integration exists. | When merchandise and operations are ready, build guest checkout, transparent shipping/totals, reliable order creation, confirmation and tracking. Evaluate COD and a Pakistan-compatible digital-payment provider. | Provider/merchant and courier eligibility is confirmed, pricing/policies are supplied, and real inventory/order retry tests pass. No checkout work is proposed for immediate implementation. |
| P2: account copy | Bag summary says it is saved on this device even for signed-in users whose bag syncs across devices. Source: `src/components/bag-view.tsx`. | Show guest/account-specific persistence text and a concise sync state. Add show/hide password and present password-update success as a status rather than an error. | The text matches the logged-in state and password visibility is accessible. |
| P2: search relevance | Partial-name search works, but there are currently no hoodie products and no clothing-specific synonyms/facets. | Once actual items exist, support meaningful terms such as hoodie/hoody, sweatshirt, oversized and zip hoodie; use fit/fabric filters only when populated. | Search terms map to real inventory, and empty results suggest relevant categories. Avoid advertising nonexistent products. |
| P2: sharing and search visibility | Product titles/descriptions and many canonicals exist, but there is no Product JSON-LD or page-specific social-card metadata. Homepage has no explicit canonical in the inspected output. | Add canonical coverage and original Open Graph/social previews. Add accurate product/variant data at launch, plus truthful business information and sizing content. | Share previews have the correct brand, image and URL. Rich-result markup agrees with real offers and is validated; do not invent review ratings or merchant offers for demo products. |
| P2: speed | Generated WebP assets and local fonts are helpful, but dev runs report above-the-fold image-loading warnings. No field performance baseline exists. | Check eager/preload behavior for hero/PDP images against the installed Next.js guide. Measure a production build, image requests and real-user mobile performance before adding scripts or embeds. | Target good LCP ≤2.5s, INP ≤200ms and CLS ≤0.1 at the 75th percentile. Current scores are unknown; dev timings are not production measurements. |
| P2: observability | No audience/funnel analytics are installed. | Add a small measurement plan and appropriate privacy updates, with no passwords, email addresses, session tokens or private account content in events. | Measure source → landing → product → size → bag, plus waitlist signup; checkout/purchase events come later. Establish a baseline before judging experiments. |
| P3: catalog scale | Adapter reads a maximum of 200 published products and filters in the client. Source: `src/lib/catalog-server.ts`. | Add server query pagination/facets only when assortment size and measured load justify it. | No products disappear beyond the read limit; counts/filters remain correct. This is not an immediate issue for 36 demo entries. |

Baymard's apparel research supports making fit information and model imagery clear, while its checkout research supports easy guest purchasing and clear delivery information. These are general usability findings, not Pakistan-specific conversion predictions. [Apparel research](https://baymard.com/research-articles/apparel-5-best-practices), [checkout research](https://baymard.com/research-articles/current-state-of-checkout-ux).

For future search eligibility, use the appropriate Google product markup for the actual selling capability; rich results are not guaranteed. [Google Product documentation](https://developers.google.com/search/docs/appearance/structured-data/product). Performance thresholds above come from [Web Vitals guidance](https://web.dev/articles/vitals).

## Features most worth testing for audience growth

| Rank | Proposed feature | Role | What the visitor gets | When / requirements | How to measure |
| --- | --- | --- | --- | --- | --- |
| 1 | First-drop waitlist | Capture interest before products launch | A simple way to hear about the first collection; no account/password required | After brand/launch message is confirmed. One email field, clear notification permission, validated saving and duplicate handling. A proper sender is needed before emailing the general public. Supabase's temporary Auth sender is not a newsletter system. | Voluntary signups per qualified landing visit, source attribution, later launch engagement |
| 2 | Original lookbook and short styling videos | Discover/share | Outfits, fabric movement and ways to wear an oversized hoodie | Authentic garments/photos when available; earlier brand mood content must clearly remain concept/teaser content. Start with a few lightweight owned clips rather than an autoplay social-feed embed. | Visits from each creator/post, lookbook → product clicks, engaged visits |
| 3 | Useful sharing and social previews | Discover | A clean link/card to share a collection or outfit with friends | Public collection pages with correct social images; optional native share/copy-link actions. Any shareable wishlist must be a separate opt-in public view so private account data stays private. | Share clicks and attributable referred visits; no assumption that every share creates a buyer |
| 4 | Clear sizing help / optional WhatsApp support | Confidence | An answer to “which size should I choose?” | Real garment charts first. WhatsApp link only after the owner provides a staffed number and response expectations. A quiet contextual link can suit the minimal layout. | Help use, repeated questions, add-to-bag after size help; returns by fit later |
| 5 | Drop/restock alerts for a selected size | Return visits | Hear when the exact piece/size is available | Real inventory, explicit opt-in, unsubscribe handling and a customer email provider. Use a genuine launch date only when confirmed. | Alert opt-ins, delivered notifications, return visits and later purchases |
| 6 | Customer outfit photos and fit reviews | Confidence/share | See the item on real customers and learn how it fits | Only after actual customers receive products; permission/moderation and truthful purchase verification. Do not seed fictional five-star reviews. | Review participation, gallery use, product engagement and fit-related returns |
| 7 | Complete-the-look / curated bundles | Conversion | A coordinated outfit with clear compatibility and value | Real complementary products and stock. The existing related-items rail can be refined instead of building an elaborate outfit engine. Discounts require actual margin/pricing rules. | Rail clicks, genuine bundle purchases and contribution margin |
| 8 | Referral rewards | Discover/return | A genuine reward for introducing a friend | After checkout/order tracking is stable. Reward real qualifying orders, make terms clear and handle cancellations/duplicate abuse. | New customers per referrer, fulfillment-adjusted cost and repeat purchase |

The current Groovy storefront visibly organizes merchandise into drops, apparel categories and PKR prices, with a shipping-threshold message. That is useful local merchandising context, not evidence that copying those features guarantees growth. [Groovy storefront](https://groovypakistan.com/). Our proposed features must use original branding/content and our own operational promises.

## Practical discovery plan

1. Choose the final brand and a narrow launch message: who the hoodie is for, its actual fit/quality and why someone would wear it. Give that message one relevant landing page.
2. Create a small series of original vertical videos: outfit styling, construction details, fit comparisons and behind-the-scenes work. Label concept content accurately while products are unavailable.
3. Test a small number of relevant Pakistani fashion creators using a dedicated landing link/source tag for each. Assess audience relevance and referred engagement, not just follower counts. This is a proposed experiment; no creators have been contacted or paid.
4. Turn recurring questions into useful pages/videos, for example measuring a hoodie or choosing between regular and oversized fits. Build on real measurements and original content.
5. Capture voluntary launch interest through the waitlist. Promote customer purchase flows only once actual products and operations are ready.
6. Review which sources bring interested visitors who take useful actions. Repeat the content/creator formats that show evidence, with a budget chosen by the owner. No paid campaign or marketing automation is being activated in this review.

## Recommended order of work

| Stage | Work | Approval/dependency |
| --- | --- | --- |
| Next small implementation | Fix shopping readiness/success/error feedback and guest/account bag wording. | User chooses whether to implement; review does not authorize changes. |
| Local account acceptance | Complete the two allowed team-member email tests and callback configuration. | User performs the email actions; no email has been sent by the agent. |
| Prelaunch audience work | Final brand/copy, first-drop landing + waitlist, useful share previews, a light analytics plan and original content. | Brand decision and consent/communication plan; custom sender before general-public notifications. |
| Product arrival | Real imagery, measured sizing, PKR pricing, clothing navigation/search and variant inventory. | Actual assortment, prices and garment specifications; currently deferred. |
| Sales launch | Guest checkout, suitable payments/COD, shipping rules, orders/tracking and clear support/returns. | Merchant/courier setup and full purchase-flow validation; currently deferred. |
| After real customers | Fit/photo reviews, size-specific restock alerts, curated bundles and measured referrals. | Genuine customer/order data and operating capacity. |

## Features to postpone

AI styling chatbots, virtual try-on, a points programme, a native app, large automatic social embeds and aggressive coupon popups are lower priority for this small prelaunch catalog. Fake scarcity counters, fictional customer reviews and unsupported delivery/free-return promises should not be used. Keep smooth scrolling accessible and restrained; no further theme overhaul is recommended after the user's white-theme decision.

## What would prove an improvement

Record a baseline before setting numerical targets. Useful measures are qualified traffic by source, landing engagement, waitlist signup rate, product/size-guide interaction, successful bag actions and return visits. Once orders exist, add completed purchases, checkout exits, returns by reason and fulfillment-adjusted referral cost. Use small moderated sessions with prospective customers to learn whether the brand, size information and next action are clear. Avoid universal conversion benchmarks or a claimed uplift without your own evidence.
