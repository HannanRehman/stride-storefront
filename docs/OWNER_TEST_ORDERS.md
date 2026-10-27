# Test checkout before real products arrive

Updated October 27, 2026: **any signed-in store account can now order the test set**. Owner membership is no longer required for test checkout. Admin pages, order management, CMS and other customers' information remain protected.

## Try it

1. Start the local site with `npm.cmd run dev`, then open `/product/navy-hoodie-trouser-set` → **Try test checkout**, or go directly to `/product/checkout-test-set`. There is also a test link in the account overview and Admin → Orders.
2. Choose S, M, L or XL and add the test set to your bag. Remove other items; test and real products cannot share an order.
3. Sign in, then continue to `/checkout`. One test set is PKR 7,000 plus the configured PKR 250 delivery charge: **PKR 7,250 simulated total**.
4. Use dummy details: Test Customer, 03001234567, Test Street, Lahore, Punjab. Select **Place test order**.
5. Open **View your order** to inspect the receipt and history. A regular customer can read only their own orders.
6. For processing, sign in as an owner and open `/admin/orders`. Test confirmation/cancellation, or confirm → use `Test courier` / `TEST-123` → shipped → delivered. Delivery and payment records remain simulated for test orders.

The five-new-orders-per-account-per-hour limit also applies to testing. Retry the same submission after an uncertain response rather than creating another order. Cancellation restores simulated stock. No parcel, real payment or order email is created.

Public-product checkout stays closed. The original 36 demo products and real hoodie preview are not made purchasable. The test product is separate, with 50 initial simulated units in each size. Existing test inventory is not reset automatically.

## Database and access

- `20261027122354_owner_test_orders` added the product/order test markers and suppression of order emails.
- `20261027124731_signed_in_test_orders` removes owner membership from test quoting. The database still requires a signed-in identity and enforces real-product checkout closure, no mixed test/real orders, authoritative prices and stock, idempotent submission and private order access.
- Both migrations are applied to the connected Supabase project. Do not reapply them.
- `supabase/fixtures/owner-test-product.sql` provisions the separate test listing without resetting an existing record. The filename reflects its original owner-only version.
- The test page is noindex, excluded from ordinary search/listings/recommendations and sitemap, and directly reachable from the preview/account links. Its public URL/data are not an access-control mechanism.
- SQL assertions in `supabase/tests/owner_test_orders.sql` are updated for signed-in testing and roll back all fixture changes. The legacy filename is retained for continuity.

## When real products and the domain are ready

Archive the test listing and decide whether rehearsal remains available. Owner-only testing can be restored explicitly if desired. Keep admin authentication and RLS in place throughout. Domain changes are not a substitute for these controls.

Application updates are local until an authorized push/deployment. A shared database migration can be active before the website UI is deployed. The test UI is intended to be reviewed locally first.
