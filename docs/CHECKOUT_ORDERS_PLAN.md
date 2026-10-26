# Checkout and orders

Build cash on delivery for signed-in customers in Pakistan. Delivery is PKR 250 per order, as agreed. Public ordering starts closed; existing demo products start ineligible for checkout. No payment provider, emails, courier booking, returns or refunds are implied by an order status.

## Design

Keep the approved white storefront: white #ffffff, ink #111111, muted text #616165, line #e5e5e5 and quiet panel #f5f5f5. Use the existing DM Sans for forms and Barlow Condensed for the checkout heading. Left-align delivery fields; put a compact order review beside them, stacking below on mobile. Use clear totals and one explicit “Place order · cash on delivery” action. Retain the owner dashboard's existing typography and spacing for orders.

## Implementation

1. Database: private customer/owner order reads, immutable product/address/price snapshots, events, closed-by-default checkout settings and explicit product eligibility. Database functions validate quantities, PKR, publication, stock, address and reviewed totals. Deterministic row locks prevent overselling; a customer-scoped request ID prevents duplicate orders. Pending/confirmed cancellations restore stock once, within existing size/stock limits.
2. Checkout: signed-in delivery form, live quote, review, retry-safe submission and private receipt. Reject unavailable/demo/USD items rather than silently dropping them. Save the request ID before submission and keep it through uncertain responses. Atomically subtract purchased bag quantities while preserving additional quantities and unrelated selections.
3. Account: paginated orders and private order details with timeline, delivery address, totals and COD status.
4. Owner: paginated/status-filtered orders, customer/address details, tracking reference, guarded status transitions with stale-edit protection, and an explicit launch toggle. Allow pending → confirmed/cancelled, confirmed → shipped/cancelled and shipped → delivered. Delivered means cash collected; owners must verify collection before recording delivery.
5. Verify database RLS, direct RPC bypasses, rollback, stock, idempotency and transitions in a disposable database; validate forms and exercise checkout/customer/owner flows in isolated browser fixtures. Run lint, types and production build. Document activation and outstanding launch checks.

## Activation

The migrations were tested locally, applied through the authorized Supabase connection and verified with rolled-back hosted assertions. Never use a service-role secret in frontend code. Keep public checkout disabled until real products, fulfillment, store policies and final live acceptance are ready. The owner authorized commit, push and deployment after local verification on October 27.
