# Navy product listing draft

Status: website product preview prepared for the owner's requested GitHub release after audit. Owner confirmed one hoodie and one trouser sold together, a temporary PKR 7,000 price, and S, M, L and XL sizes. Stock quantities remain unconfirmed. Hosted deployment verification is separate from local validation.

## Product listing

- Name: Navy Hoodie & Trouser Set
- Category: Clothing
- Color: Deep navy
- Description: A coordinated navy hoodie and trouser pairing with a clean, understated look. The pullover hoodie features a drawstring hood, ribbed cuffs and a ribbed hem. The matching trousers have a drawstring waistband and white printed detailing. Wear the pieces together or style them separately for everyday outfits.
- Material and care: Follow the garment's own care label. Fabric composition, weight and fit measurements have not been supplied.
- Temporary price: PKR 7,000 for the complete two-piece set.
- Sizes: Small (S), Medium (M), Large (L), Extra large (XL).
- Stock quantities and fit measurements: awaiting confirmation. The preview uses zero stock as a non-purchasable placeholder, not a claim that confirmed stock is sold out.
- URL: `/product/navy-hoodie-trouser-set`.

## Integration

`src/lib/product-previews.ts` adds the presentation record to both configured Supabase reads and the bundled fallback catalog. It appears in the homepage featured rail, clothing catalog, everyday collection and search. It is not provisioned in the database; bag and favorites actions are unavailable for this preview so account writes cannot refer to an unknown product ID.

The new record explicitly uses PKR while existing demo products retain USD. Dollar price filters exclude PKR previews, and price sorting groups currencies rather than comparing dollar and rupee amounts. Migrating the entire demo catalog to PKR remains part of the admin/CMS plan.

Before enabling shopping, confirm stock and fit, provision the record in Supabase with appropriate currency support, and verify account bag/favorites behavior. Remove the presentation overlay when the database becomes the source for this product.

Do not claim brand authenticity, fabric composition, exact fit, shipping terms or stock from the photographs alone.

## Photos

- Original user photos: `products/hoodie&trouser.jpeg`, `products/hoodieblue.jpeg`, `products/hoodieblue1.jpeg`, `products/trouserblue.jpeg`.
- Edited master: `products/navy-hoodie-trouser-set-edited.png`.
- Optimized website asset: `public/images/products/navy-hoodie-trouser-set.webp`.
- Gallery: full set, hoodie and trouser views, with keyboard-accessible thumbnails and a zoom dialog showing the selected image. Additional retouched masters are `products/navy-hoodie-edited.png` and `products/navy-trouser-edited.png`; compressed copies are `public/images/products/navy-hoodie.webp` and `public/images/products/navy-trouser.webp`.
- The main set photo was edited with the built-in imagegen tool to remove surrounding clutter and the hangtag, replace the shop surface with a softly blurred neutral setting, and improve lighting while retaining the navy garments and existing printed markings. Review the edited image against actual merchandise before publishing.
- Only resize/format compression was used after the imagegen edit. Originals are retained unchanged.
