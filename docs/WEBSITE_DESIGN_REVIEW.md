# Website look and feel review

**Implementation follow-up:** performance/layout fixes, mobile footer/admin navigation, CMS sections, shopping labels and clothing-focused hero copy are implemented. [The implementation report](IMPROVEMENTS_IMPLEMENTATION.md) records verification and remaining merchant inputs. The observations below are the original audit baseline. Brand, real categories/products, PKR stock/prices, measurements, contacts and policies still require the client's facts.

October 27, 2026. Review based on the current implementation, local browser interaction and desktop/mobile screenshots. Recommendations below are proposals; this audit does not silently redesign the approved site.

## Keep this direction

Keep the white product/content areas, near-black utility bar and footer, and light gray announcement. The contrast now gives the page clear beginning/end points without making black clothing disappear into a dark interface. Preserve DM Sans for body copy, Barlow Condensed for campaign headlines, generous spacing around product photos, understated buttons and reduced-motion behavior.

Reference tokens: white `#FFFFFF`, near-black `#111111`, off-white `#F5F5F5`, secondary gray `#707072`, divider `#E5E5E5`. Use near-black/off-white for primary actions and surfaces; avoid adding another accent color before the brand identity is settled. Keep link underlines/focus indicators clear on the black surfaces.

## Priorities

| Priority | Current observation | Recommended change | Why it helps |
| --- | --- | --- | --- |
| 1 | The slow-mobile production sample showed roughly 5–6 seconds before the main home/product visual, and substantial layout movement in catalog views. | Profile the largest images/fonts, reduce first-view transfer, reserve space for loading catalog content, and check layout-shift sources before launch. | A calmer, faster first load matters more than adding decorative features. See the lab sample in the test report; these are local measurements, not field scores. |
| 1 | Homepage and navigation still describe running, court shoes and broad men/women/kids collections, while the intended store is moving toward hoodies/trousers. | Once the client confirms scope, align hero copy, category names, campaigns and navigation around the actual clothing drop. Remove empty categories. | Visitors understand what the store sells immediately. |
| 1 | Most catalog concepts are USD, while the hoodie is PKR. A notice explains this, but the experience still feels like a demo. | Keep the explanation while testing; replace concepts with consistent PKR prices and real inventory for launch. | Removes pricing uncertainty for Pakistani customers. |
| 1 | A large photo-led hero is visually strong, but its collection link still goes to a placeholder campaign. | Send the primary hero CTA to the first real clothing collection; use one specific message and one main CTA. | The first action leads to merchandise that matches the photo. |
| 1 | Real contact hours, policy details and product measurements are missing. | Publish the actual support channel, coverage, shipping/return terms and per-product size measurements when supplied. Surface the most relevant facts next to the purchase action. | Gives customers practical reasons to trust the store. Do not invent delivery promises or guarantees. |
| 2 | The footer is readable but every group starts expanded on mobile, making account and information pages long. | Consider closed-by-default mobile groups with Help visible, while preserving the desktop columns. | Less scrolling; faster access to the links people need. |
| 2 | Product pages have the right gallery structure, but the test/preview/real merchandise states require different explanations. | Use one consistent status line and action vocabulary across card, product, bag and checkout. The new test link already removes the original preview dead end. | Customers know what they can do without guessing. |
| 2 | Product details contain material/care/reviews sections before real garment facts are supplied. | Prioritize fit, fabric, garment measurements and the set contents; show genuine reviews only after actual customers exist. | Useful information outranks decorative sections. |
| 2 | Mobile admin navigation wraps across several rows, and the content editor is a very long form. | Add active-section styling and a compact admin menu. Split CMS into campaign/contact/policies tabs or anchored sections, with a clear saved/unsaved state. | Makes routine changes easier on a phone. |
| 2 | Bag/checkout require sign-in, and checkout mixes the main form with explanatory prelaunch text. | Make sign-in requirements clear before checkout. Keep test labeling explicit now; after launch, use concise delivery → review → order progress cues. | Reduces uncertainty during checkout. Guest checkout can be considered separately if the business wants it. |
| 2 | Desktop hero type is assertive; form pages use much quieter headings and long whitespace. | Keep the campaign contrast but tighten heading/spacing consistency on account, help and checkout pages. | Makes the whole site feel like one store. |
| 3 | Product-image LCP warnings appear in development runs. | Profile the final production image candidates on a slower phone; reserve eager loading for the actual above-the-fold image and retain lazy loading below it. | Improves perceived speed without downloading every image early. A development warning alone is not a production speed score. |
| 3 | Collection rails work but can depend on small arrow controls for discovery. | Ensure part of the next card remains visible on mobile and test swipe affordance. Keep native touch scrolling and reduced-motion support. | More people notice that the collection continues horizontally. |
| 3 | Real social profiles, brand story and customer content do not exist yet. | Add only genuine social links, an original brand story and permission-based customer photos when ready. | Adds personality and credibility without fake followers/reviews or copied competitor assets. |

## Suggested next design pass

The most useful next pass is a small clothing-focused homepage revision once the product direction is confirmed: one strong original garment image, a short brand statement, a real first-drop rail, fit/material information and verified delivery/support facts. Keep the approved black/white frame around it.

Avoid adding countdowns, fake discounts, invented sales counters, intrusive popups or constant scroll animations. These would obscure the merchandise and the calm visual direction.

`/new` currently prerenders the catalog's loading fallback and fills its heading/results after JavaScript hydration, as the installed Next.js guide describes for `useSearchParams` inside Suspense. Rendering useful initial catalog content or a better-sized skeleton would improve progressive loading and reduce the jump. The browser-rendered page and its navigation passed the functional checks.

## Email direction

The [11 email drafts](email-templates/README.md) use the same black/white palette with email-safe typography and a single clear action. The brand name and destination URLs are placeholders. Real inbox rendering and sender setup remain separate from browser layout checks.
