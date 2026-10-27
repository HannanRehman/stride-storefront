# Email integration status — October 27, 2026

## Completed in this session

- Resend MCP is connected through OAuth. The explicitly requested test email, subject **Hello from MCP**, from `onboarding@resend.dev` to the requested recipient was sent once; Resend reported **delivered**. No signup/recovery, order or promotional emails were sent.
- Resend reports **no sending domains**. The temporary display name is **Stride Storefront**; it does not establish ownership of a sending domain.
- Seven runtime message variants now use the approved black/white, table-based design: received, confirmed, shipped, delivered, cancelled, support reply and launch confirmation. HTML and plain-text alternatives share the same message content. Private order totals, addresses and message bodies remain inside signed-in account pages; no invented values fill the old draft placeholders.
- Two dashboard-ready [Supabase Auth templates](email-templates/supabase/README.md) use `{{ .ConfirmationURL }}` for the existing PKCE callback. They have not been installed into hosted Auth settings.
- The existing `POST /api/internal/email-worker` retains its private worker secret. A `GET` handler supports Vercel Cron using a separate `CRON_SECRET`; both reject missing/incorrect credentials before reading jobs. Delivery remains disabled unless all sender/database credentials exist and `EMAIL_DELIVERY_ENABLED=true`.
- Independent random worker/scheduler secrets were saved in ignored `.env.local` and encrypted Vercel Production variables. Production also has `EMAIL_BRAND_NAME=Stride Storefront` and `EMAIL_DELIVERY_ENABLED=false`. Existing variables were preserved and private values were not printed.
- [The one-minute cron example](vercel-email-cron.example.json) is prepared but **not active**. It is not the repository's root `vercel.json`. Frequent Vercel Cron requires a supporting plan; the connected team's billing plan was not returned, so no plan or schedule was assumed or purchased.

Application changes are local and not committed/pushed/deployed by this session. The previously deployed release remains `91e7d4c`. New Vercel environment settings apply to a future deployment; saving them does not deploy the new code.

## What still prevents customer activation

1. **A verified Resend sending domain and sender address.** `onboarding@resend.dev` is restricted to testing the Resend account's own address. A domain owned by the operator can be temporary and replaced later. The Vercel-provided website subdomain cannot be verified by this project because the operator does not control its parent DNS. No fake domain was registered.
2. **Resend sending API credentials.** MCP OAuth allows interactive service operations; it is not an API key for the deployed application. Create a sending-only key after choosing the domain and store it in private settings. No unnecessary key was created before a domain existed.
3. **Supabase Auth SMTP/redirect configuration.** The connected Supabase MCP does not expose Auth configuration updates. Set Site URL, exact callbacks, email templates and SMTP in its dashboard. Resend SMTP uses `smtp.resend.com`, port `465`, username `resend` and a Resend API key as password. Use a sender on the verified domain. The [Auth template guide](email-templates/supabase/README.md) contains exact URLs and files.
4. **Worker queue access.** The existing outbox's claim/finish RPCs require a server-only Supabase service-role key. It is not present locally or in Vercel. The available Supabase tool returns publishable keys, not the privileged worker credential. Put the correct project key directly into private settings; never paste it into chat or prefix it with `NEXT_PUBLIC_`.
5. **Release and acceptance.** Install the approved templates, configure the missing settings, deploy tested application changes in an authorized release, then verify genuine confirmation/reset links and transaction delivery with designated test accounts. Open links in the browser where the request began. Test expiry/reuse and old-password rejection. Only afterward enable public `AUTH_EMAIL_ENABLED=true` and transactional delivery.
6. **Scheduler activation.** After sender acceptance, merge the example schedule into root `vercel.json` on a supporting plan, or configure an approved trusted scheduler. Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically. The endpoint processes at most three leased jobs per invocation. Tune schedule/capacity to actual traffic and provider quotas; no bulk marketing sender is included.

Public checkout remains closed, test-order email suppression remains in the database and no hosted orders/email jobs were created. Actual owner MFA enrollment, policy changes and product setup are outside this email integration session.

## Verification

- 39 unit tests across ten suites passed, including leased acknowledgements, provider rejection privacy, uncertain acknowledgement stop, exact secret checks, all order variants, URL validation and HTML escaping.
- Lint, TypeScript production compilation and optimized build passed.
- Chrome production smoke passed, including the protected POST worker and GET scheduler, public/private routes, gallery, 404, sitemap/robots and zero browser page errors.
- Nine runtime/Auth email layouts passed offline Chrome checks at 320/375/600/900px, allowed HTTPS links and serious/critical axe checks, with zero network requests. Screenshots for received-order and signup messages were inspected. Offline HTML is not Gmail/Outlook acceptance.
- An additional targeted fixture-browser run was blocked at server startup by an already running workspace Next dev process on port 3000; no assertion ran. That existing process was not stopped or reused. The relevant worker authorization is covered by the completed production smoke and unit tests; no successful fixture run is claimed for this session.
- Hosted state after the test message: zero store orders, zero outbox jobs and public checkout closed. The test email was sent directly through the authorized Resend connection, independently of the app's disabled outbox.

Useful commands:

```powershell
npm.cmd run test
npm.cmd run lint
npx.cmd tsx scripts/prepare-auth-email-templates.ts --site https://stride-storefront-peach.vercel.app --brand "Stride Storefront"
npx.cmd tsx scripts/verify-email-runtime.ts
npm.cmd run build
$env:PLAYWRIGHT_CHANNEL='chrome'
node scripts/verify-production.mjs
```

Sources: [Resend Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp), [Resend test sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain), [Vercel cron authorization](https://vercel.com/docs/cron-jobs/manage-cron-jobs), [Vercel cron plan limits](https://vercel.com/docs/cron-jobs/usage-and-pricing).
