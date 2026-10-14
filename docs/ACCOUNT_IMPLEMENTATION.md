# Account implementation

Products remain demonstration data; real assortment, imagery, variants, inventory and checkout are deferred at the user's request.

## Design

Preserve the storefront palette: white #ffffff, ink #111111, muted #646466, surface #f5f5f5 and line #e5e5e5. DM Sans handles forms and navigation; Barlow Condensed carries a single large editorial title. A quiet two-column account layout puts profile and addresses beside account navigation; auth forms are narrow and left aligned. On mobile these stack. No new photography or decorative dashboard tiles are needed.

## Delivery

- Supabase email/password auth through server routes, HTTP-only session cookies and Next.js Proxy refresh.
- Registration, login/logout, email confirmation callback, forgot-password and protected password update.
- Protected profile and saved address pages, with ownership enforced by database RLS.
- Account bag/favorites with per-user atomic operations and repeatable guest merge receipts.
- Private routes and APIs have no-store caching; public catalog pages keep their existing rendering behavior.
- Verify credentials, recovery failures, ownership isolation, cross-device shopping, merge retries and existing guest journeys.

Production activation needs the Supabase variables in Vercel, configured auth redirect URLs and working confirmation/recovery email delivery. The code must report failures honestly and cannot promise email delivery before that setup is verified.
