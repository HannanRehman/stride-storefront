# Owner admin panel and homepage CMS

October 27 completion update: product management, checkout/order management, private customer requests and homepage/contact/policy CMS are implemented and locally tested. The three new migrations are applied and verified. The owner authorized release after tests. See [store operations](./STORE_OPERATIONS_SETUP.md) and [checkout setup](./CHECKOUT_ORDERS_SETUP.md). The original planning scope below predates this completed milestone.

Status: product-management implementation prepared locally on October 26, 2026. Hosted migrations, storage policies and both confirmed owner memberships are activated with approval; browser acceptance against real owner sessions and deployment remain pending. Homepage CMS is deferred at the owner's current request to focus on other work. Original decisions agreed October 15, 2026; see [owner dashboard setup](./OWNER_DASHBOARD_SETUP.md) for the current milestone.

## Goal and scope

Build a private `/admin` area using the existing Next.js application and Supabase authentication, database and storage. Manage products and homepage content without editing code. Keep the existing white storefront design.

The first version includes product management, image uploads, homepage draft/preview/publish, and PKR pricing. Orders, checkout, payments, discounts, staff permissions, analytics, and editing other pages are deferred.

## Admin experience

- Navigation: Overview, Products, Homepage. Desktop sidebar and compact mobile navigation; tables become readable cards on small screens.
- Overview: actual published/draft counts, out-of-stock sizes, homepage draft status, and shortcuts. No invented revenue metrics.
- White surfaces, DM Sans, black buttons, restrained borders, existing accessible UI primitives and shadcn-style additions where needed.
- Explicit loading, saving, error and success states; warn before leaving unsaved changes. Native scrolling in admin.

## Owner access

- Reuse login and preserve the intended admin destination after authentication.
- Assign the two designated owners through protected database membership records linked to their Supabase user IDs, as requested October 26. Document manual bootstrap after confirming both accounts. No staff permission hierarchy in this milestone.
- Public signup and editable profile metadata cannot grant admin access. No in-app membership management in this version.
- Check owner permission on every admin page, API, database write and storage upload. Redirect anonymous visitors to login and deny ordinary customers.
- Use session-aware Supabase clients and RLS; never expose privileged credentials to the browser.
- Private, uncached admin and preview responses; exclude them from indexing and sitemaps.
- Separate admin layout from storefront header, footer, shopping provider and smooth scrolling, preserving existing public URLs.

## Products

- Extend `catalog_products`; do not create a competing catalog. Searchable, paginated listings with category and published/draft filters.
- Edit name, slug, subtitle, description, audience, category, movement/sport, collection, price, comparison price, color, badge, display rank, primary image and size-level stock.
- One image and one colorway per product initially; galleries and linked variants are deferred.
- New products start unpublished, with owner-only previews and explicit publication. Unpublish rather than permanently delete.
- Published product edits use a confirmed **Save live changes** action. Staged revisions of existing published products are deferred.
- Stable IDs; lock slugs after first publication to preserve links and saved selections.
- Validate unique slugs, required fields, nonnegative prices, valid comparison prices, unique size codes and whole-number nonnegative stock in application and database layers.
- Detect stale edits and require reloading before overwriting newer changes.
- Stock remains catalog availability, not checkout reservation or an inventory ledger.

## Homepage CMS

- Structured fields within the current layout, not a drag-and-drop builder.
- Editable hero image/copy/button, introductory copy/buttons, campaign tiles, featured product selection/order, category tiles, collection cards, sport tiles and brand-story content.
- Navigation, footer, global branding, FAQs and shipping pages remain outside this version.
- Separate validated draft and published documents. **Save draft** stays private; owner-only **Preview** uses the actual homepage components and disables caching.
- **Publish homepage** validates and atomically replaces published content. Keep the previous published version for a confirmed restore action.
- Validate links as supported internal store destinations; require image descriptions and show only published featured products.
- Seed with the current homepage to preserve its appearance. Refresh affected public caches after publishing and report failures accurately.

## Images, PKR and storefront integration

- Supabase Storage uploads: original/licensed JPEG, PNG and WebP, maximum 5 MB. Validate contents and extension; reject SVG and executable formats.
- Owner-only uploads, unique object paths and public-readable assets. Draft text is private, but uploaded image URLs are not confidential.
- Retain local image support; configure Next.js image loading for the project's storage host.
- Change currency support and shared formatting to PKR. Store minor units; accept rupee input and convert precisely server-side.
- Keep demo products with explicit documented sample PKR prices per family. Do not relabel USD amounts or imply exchange-rate conversion. Update fallback data, seeds, tests and metadata consistently.
- Preserve customer bag/favorite references. Replace the current silent 200-product catalog cap with paginated reads.
- Hide unpublished/unavailable products appropriately and refresh catalog, product and sitemap caches after relevant writes.

## Verification and release

- Test anonymous/customer denial across admin pages, APIs, direct database access, storage uploads and role escalation.
- Test product draft, reload, image upload, publish, stock change, unpublish, validation, stale edits and storefront updates.
- Test draft privacy, accurate previews, atomic homepage publication and restoring the previous version.
- Test expired sessions, failed saves/uploads/publication, preserved form input and actionable feedback.
- Verify PKR formatting, bag/favorites, filters, search, mobile layouts, keyboard access and accessibility smoke checks. Run lint, TypeScript, unit tests, browser tests and production build.
- Prepare reviewed migrations and an owner setup guide. Verify database behavior using disposable or rolled-back fixtures before shared-project changes.
- Preserve existing local changes. Commit, push, hosted migration and deployment require explicit user approval.

## Delivery order

1. Owner authorization, database policies and separate admin layout.
2. Product editor, image uploads and PKR integration.
3. Homepage structured editor, draft preview, publication and restore.
4. Regression verification, setup documentation and local review.

No implementation or deployment is implied by this plan.
