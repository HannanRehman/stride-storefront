# Content, customer requests, launch interest and email

Prepared October 27, 2026 under the owner's instruction to finish implementation, test locally, push and deploy while unavailable. See [completion work plan](./COMPLETION_WORK_PLAN.md). The provisional brand and existing catalog are preserved.

## Content and customer help

`/admin/content` edits a versioned draft of the homepage hero, announcement, introduction, staffed support details and plain-text store policies. Save, private preview, explicit publish and restoring a published revision as a draft are supported. Unsaved navigation is guarded. Store links and owned image URLs are validated. Public rendering revalidates the published document and falls back to the original homepage if content activation is pending or the document is invalid. No raw HTML is rendered from CMS text.

`/contact` shows only contact details actually supplied by the owner. Delivery, returns, terms and privacy pages can display additional published merchant information. These fields must contain real operating information before checkout opens; implementation does not create legal/business facts.

Customers use `/account/requests` for questions and private cancellation/return requests. Requests link only to the customer's own order; cancellation requests require an unshipped order, returns a delivered order. Owners use `/admin/requests` to reply and mark requests open/in progress/resolved. Messages are paginated. A reply is not a refund or cancellation: owners must record the real decision and use the order's cancellation action when appropriate. No automatic post-shipment refunds, courier returns or banking actions occur.

Request creation/replies have database idempotency keys, authorization and rate limits. New request attempts are recovered from tab-scoped session storage to avoid duplicating an ambiguous save. Do not include passwords, card data or banking PINs in messages. Every support row is private to its customer and the store owners; anonymous clients have no direct table privileges.

## Launch interest

Launch signup starts disabled. Publish the **Show the launch interest form** option in Content to enable `/launch` and its footer link independently of checkout. Signup requires explicit email permission, includes a honeypot and extra application throttling, and is capped at 100 new records/day in the database, including direct anonymous RPC calls. Existing addresses receive the same generic response; duplicate signups do not create multiple records or confirmation jobs.

Signups begin **unconfirmed**. A private email job contains separate confirmation and unsubscribe tokens. Opening either preference link does not mutate subscription state: the person must press the confirmation/unsubscribe button, avoiding automatic email scanner actions. Unsubscribed people cannot be reactivated by an old confirmation link. `/admin/audience` shows email/status/consent dates but cannot read private tokens. Promotional campaigns are not sent by this application; only confirmed, subscribed people may be considered for a later consent-based launch campaign.

## Transactional email infrastructure

The migration creates a private outbox. Order status events and owner support replies queue customer notifications only for email-confirmed Auth users. Launch signup queues a confirmation. No existing orders are backfilled. Draft publishing, signup, checkout and request APIs do not call an email provider directly.

`POST /api/internal/email-worker` is inactive unless all required server settings exist and `EMAIL_DELIVERY_ENABLED=true`. It requires an `Authorization: Bearer <EMAIL_WORKER_SECRET>` header, compares credentials in constant time and uses a server-only Supabase service-role key to claim/acknowledge jobs. It sends at most three per invocation through Resend, with a stable provider idempotency key per job. Addresses, tokens, API keys and provider error bodies are not logged or returned. Email templates link to private account pages instead of copying delivery information into emails.

Worker leases, bounded retries (five), safe acknowledgements and expired-job handling prevent simultaneous workers from processing the same live lease. Superseded queued order statuses and unsubscribed launch confirmations are suppressed. Provider idempotency is limited to its documented window; this is not a promise of exactly-once email delivery indefinitely. Inspect uncertain/failed jobs before manual recovery. No schedule, paid provider subscription, real test email, promotional email or courier booking has been activated by this implementation.

Required server environment variables:

```dotenv
EMAIL_DELIVERY_ENABLED=false
EMAIL_WORKER_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_SITE_URL=https://your-store-domain
```

Use a long random worker secret and a verified sender on the final domain. Never prefix private keys with `NEXT_PUBLIC_`. Supabase Auth signup/recovery SMTP is a **separate** setup from this outbox; `AUTH_EMAIL_ENABLED` must stay off for public registrations until real confirmation/recovery delivery and redirect allowlists are accepted. A provider choice and verified domain are external setup, not something the code can invent.

Resend's [send endpoint](https://resend.com/docs/api-reference/emails/send-email) and [idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys) were checked for the implementation. Set up a protected scheduler or invoke the worker from trusted server infrastructure only after sender setup and explicit acceptance; do not expose the worker secret in a browser.

## Readiness and activation

`/admin/readiness` shows migration availability, ordering state, application email flags, queued delivery state, canonical configuration and missing merchant contact/policies. It reports configuration, not actual real-world acceptance.

Migrations `20261026225242_checkout_orders.sql`, `20261026225251_store_operations.sql` and `20261026225739_private_rpc_implementations.sql` are **applied and verified** on project `simfvguqxbqevvrgkkdp`. Do not reapply them. Supabase browser authorization was restored during the session. The local database runner and hosted rolled-back assertion suites passed, and checks confirmed no fixture data remains. Public content still has a staged-activation fallback; legacy product writes remain compatible when checkout eligibility stays false.

Privileged implementations now live in the non-exposed `store_internal` schema; the public Data API exposes invoker wrappers with the same signatures and explicit role grants. Internal functions still independently verify the caller/token and enforce all business rules. Moving the implementations resolved the exposed-definer advisor warnings. The remaining security advisory is Supabase Auth's existing disabled leaked-password protection, which needs an Auth setting outside the available tools. Unused-index INFO notices are retained for their intended FK/query paths.

The migration defaults do not open checkout, enable signup or alter existing product names, stock or prices. Never reset or seed the hosted project. The test SQL rolls back its fixtures; automated browser fixtures use a local database and simulated Auth/SMTP transport, not hosted users or actual emails.

## Sharing, SEO and security

The homepage has a canonical, original generated Open Graph image, social metadata and normalized sitemap origin. Product pages have their own social metadata and native share/copy actions. Product structured data is emitted only for explicitly checkout-ready merchandise; offers are included only while checkout is open, using actual PKR prices/stock and no invented reviews. JSON-LD escapes script-closing characters. Private pages and subscription preference links are noindex; preference pages also disable referrers and caching.

The application adds nosniff, same-origin frame protection, limited permissions, and CSP directives for base URL, objects, frames and forms. No third-party audience analytics, advertising scripts, fake reviews, scarcity counters or unsupported merchant promises were introduced. Before a sales launch, complete actual sender, merchant, courier, domain, policies, products and production purchase acceptance.
