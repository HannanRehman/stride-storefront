# Cash on delivery checkout and order management

October 27 update: [test orders](OWNER_TEST_ORDERS.md) allow any signed-in account to rehearse with a separate test set while real-product ordering stays closed. The test-only owner restriction has been removed through migration `20261027124731_signed_in_test_orders`; admin authorization remains enforced. Application changes require deployment for the live site.

Implemented and locally verified on October 27, 2026. Supabase migrations `20261026225242_checkout_orders`, `20261026225251_store_operations` and `20261026225739_private_rpc_implementations` are applied and their hosted SQL assertions passed. Public ordering remains closed, all 36 existing demo products remain ineligible, both owners are intact, and no orders, jobs or fixture accounts remain. The owner authorized pushing/deploying this tested application release.

## Behavior

- `/checkout`: signed-in customers, Pakistan delivery, Pakistani mobile validation, delivery form, authoritative quote and explicit cash on delivery submission. Delivery defaults to the agreed **PKR 250** per order. No currency conversion: USD demo items are rejected.
- `/account/orders` and `/account/orders/[id]`: paginated order history, private receipt, saved delivery address, original price/item snapshots, status timeline and shipment tracking reference.
- `/admin/orders`: paginated orders with status filters and checkout settings. Ordering starts **closed**, and all existing/new products start **ineligible** for checkout. Publishing alone never makes a product purchasable. The product editor's “Allow checkout for this product” switch requires a positive PKR price; only enable it for real merchandise with verified stock.
- `/admin/orders/[id]`: pending → confirmed/cancelled; confirmed → shipped/cancelled; shipped → delivered. Shipping requires courier name and tracking reference. Delivery requires the owner to confirm actual delivery and cash collection, then records payment as collected. Cancelled/delivered are terminal states; no hard delete, refund, return or post-shipment cancellation workflow is included.
- Owners can change the delivery charge and explicitly open/close public ordering. Opening asks for confirmation. The application does not open ordering automatically.

## Integrity and access

Orders and events have RLS: customers read only their own orders, owners read all orders, anonymous users read none. Public roles have no direct order/event/settings write privileges. All write RPCs independently verify identity and authorization, including direct calls outside the Next.js API. No service-role key is used.

The database builds quotes from published, checkout-ready PKR catalog rows. It validates positive quantities (up to 10 per size, at most 20 distinct product/size lines), stock, delivery address and the exact reviewed quote. The order total is capped at PKR 1,000,000. Different currencies and unavailable items are rejected in full; no line is silently dropped by checkout.

Placement locks the customer's request stream, shares the settings lock and locks every involved product in ID order. Repricing, stock decrement, immutable order snapshots and the initial event commit together. An authenticated customer is limited to five new orders per hour, counting cancelled orders. `(user_id, request_id)` is unique; reusing the same key/payload returns the saved order, even after checkout closes or the order is cancelled. A changed payload using the same key is rejected.

The browser persists the exact attempt in tab-scoped session storage **before sending**. Lost/unknown responses preserve it for retry, including across refreshes. A retry after an expired session retains it. The customer identity is checked again by the API. Storage must be available to place an order. Do not clear storage or start a new checkout to recover an uncertain order; first check order history or retry the saved attempt. Closing the tab loses local recovery state but never cancels an already committed order. Idempotency covers retries of the same attempt, not intentionally submitting a new order from another tab.

In the same database transaction, checkout subtracts purchased quantities from the signed-in bag, preserving additional quantities and unrelated selections. It shares the customer lock with existing bag actions, and idempotent retries never subtract twice. The receipt refreshes account selections in this tab and notifies other tabs. Bag membership never reserves stock.

Cancelling an unshipped order returns reserved quantities exactly once. If an owner removed its original size or increased available stock so restoration would exceed the catalog's 100-unit limit, cancellation fails atomically with instructions to restore that size/leave capacity, then retry. Product/order/settings timestamps protect against stale owner edits. After ambiguous order/settings writes the UI requires reloading authoritative data.

API writes require same-origin JSON bodies, read with a 20 KB byte limit. Private API responses use no-store caching. No delivery addresses or mobile numbers are logged, hardcoded in source or placed in URLs. Customer-facing order references use a UUID prefix; full UUIDs remain in private routes. Owner-supplied tracking is displayed as text, without arbitrary external tracking URLs.

## Hosted activation and deployment

1. The three migrations above are already applied to project `simfvguqxbqevvrgkkdp`; **do not reapply them**. For a new project, apply migrations in filename order after the original catalog/account/owner migrations. The commerce migrations add tables/functions/policies and eligibility without creating real orders or changing existing stock. Preserve the closed/default-ineligible state.
2. Run `supabase/tests/checkout_orders.sql` as a trusted SQL session. Its fixtures roll back. Check security/performance advisors and verify no fixture users/products/orders remain. Test real PostgreSQL concurrent sessions contending for the final unit; PGlite exercises transaction logic but is not proof of multi-connection hosted locking behavior.
3. The owner authorized this release's commit/push/deployment after local verification. No new environment variables or payment secrets are needed for COD/CMS/support. Existing auth and project keys remain server/session based. Optional email delivery has separate disabled-by-default settings in the operations guide.
4. Before opening public orders: final brand/contact details, actual products/stock/prices, service coverage/courier arrangements, final delivery/returns/refund/tax information and owner/customer acceptance in production must be ready. The launch toggle is in Orders → Checkout availability; product eligibility is a separate switch.
5. Conduct a coordinated real acceptance order only when authorized, verifying receipt, stock, history, owner processing and cancellation. Do not publish fixture products or place real orders as part of automated tests.

## Tests

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
node scripts/verify-owner-db.mjs
$env:PLAYWRIGHT_CHANNEL='msedge'
npx.cmd playwright test --config playwright.checkout.config.ts
npx.cmd playwright test --config playwright.admin.config.ts
npm.cmd run build
```

For disposable SQL tests only, the ignored tool dependency can be installed with `npm.cmd install --prefix .tools/db-test --no-save --package-lock=false @electric-sql/pglite`. It is not an application dependency. The checkout browser fixture uses actual disposable migration/RLS/RPC logic behind a small local Auth/PostgREST transport; it never contacts Supabase, sends emails or books shipments. Run browser servers and the production build sequentially because they share `.next`.

Not included: guest checkout, online payment, transactional order emails/SMS, automatic courier booking, tax calculation, coupons, returns/refunds, staff roles or delivery proof integration. Confirmation is currently the website receipt/account history. Public policies are prelaunch information and still need final merchant details before opening.
