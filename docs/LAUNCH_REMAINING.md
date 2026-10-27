# Remaining launch work — October 27, 2026

**Email follow-up:** runtime templates, Supabase-ready Auth HTML and protected scheduling support are prepared locally; the requested Resend MCP test was delivered. Sender/domain, hosted Auth settings, worker queue credentials and actual activation still remain. See [email integration status](EMAIL_DELIVERY_SETUP.md). The checklist below records the preceding deployment review.

Review requested after release `91e7d4ca672a6c54dc9f0f59814c1a3916ad0672`. Excludes buying/configuring the final domain and supplying products. This is a status review, not authorization to enable sales, email sending, paid services or real owner MFA enrollment.

## Verified now

- Vercel's current production deployment is READY: `dpl_56qhzz32bf9cVD42y628GuyPXxrM`. The preceding release verification matched this exact Git SHA and the production domain; its live Chrome smoke passed.
- Fresh requests to home, contact, privacy, terms, shipping/returns, registration, password recovery, sitemap and robots returned HTTP 200. Policy pages still contain explicit demo/prelaunch wording. Registration/recovery notices confirm email is not enabled.
- Production environment metadata contains only the public Supabase URL/key, canonical URL and encrypted server security gateway key. Auth email and transactional sender/worker settings are absent. Values were not decrypted or printed.
- Hosted database: two owners, zero owners requiring MFA, public checkout closed, PKR 250 delivery, zero orders/email jobs and the private security gateway configured. Published CMS version is zero with no publication date; support email/phone/hours and shipping/returns/privacy/terms additions are empty.
- Supabase security advisor reports its existing leaked-password-protection warning. No claim is made that an independent attack/load audit has passed.
- Existing verification remains valid for this unchanged application revision: 33 unit tests, 52 Chrome functional scenarios, 12 production browser checks across Chrome/Firefox/WebKit, six local/hosted SQL suites and a disposable restore drill. The tests' real-world limitations remain in the [implementation report](IMPROVEMENTS_IMPLEMENTATION.md). No repeat full-suite run was necessary for this read-only review.

## Finish before accepting real customers/orders

| Priority | Remaining item | Actual work |
| --- | --- | --- |
| 1 | Public signup and password recovery | Configure and accept Supabase confirmation/recovery email, production Site URL and callback allowlist. Test real links, expired links and reset completion in inboxes. Then enable `AUTH_EMAIL_ENABLED`; current public signup is closed. Existing-account login works. |
| 1 | Order/support email delivery | Configure a verified sender/provider and server credentials; set up a protected scheduler/invoker for the existing worker, retries/failure visibility and actual inbox acceptance. Delivery is currently disabled and no repository scheduler is configured. |
| 1 | Final email presentation | The 11 HTML drafts are separate from the basic runtime renderer. Wire approved order/support/launch-confirmation designs into their actual send paths and map account templates to Supabase-supported variables. Password-change notices and launch broadcasts remain draft-only additional features. Do not equate previews with active delivery. |
| 1 | Owner MFA | Both genuine owners must enroll their own authenticator through `/admin/security` and verify a fresh login. The prerequisite UI is now deployed. Record a verified operator recovery procedure; no owner should share passwords/setup QR codes. |
| 1 | Password protection | Enable Supabase leaked-password protection where supported by the project's plan, then recheck the advisor. Its Auth configuration is not available through the connected MCP tools. |
| 1 | Real contact and commercial information | Supply a staffed support email/phone, hours and applicable business identity/address. Decide delivery coverage/timelines, cancellation, returns/exchanges/refunds and how applicable charges are presented. Publish the agreed information through CMS. PKR 250 shipping alone is not the fulfillment policy. |
| 1 | Final policy pages | Finalize privacy/terms/shipping/returns content using the actual business decisions, retention/deletion process and providers. Update the page rendering to replace demo/prelaunch sections when final content is published; current CMS fields append merchant text beneath existing demo copy. This still requires a small code/content pass, not simply filling a field. This review does not certify legal compliance. |
| 1 | Genuine hosted acceptance | Use an authorized test account/test-only item to verify real signup/recovery, owner login/MFA, Storage upload, CMS publish/restore, checkout through receipt, order transitions/cancel/restock and support replies against deployed services. Disposable Auth/Storage mocks do not prove these hosted integrations. Test final-unit contention using independent hosted connections without touching real stock. |
| 1 | Recovery and incident handling | Confirm actual backup availability/retention, assign recovery access and restore an approved backup into an isolated target. Verify database, real Auth identities and media separately. Only disposable database restoration has passed; no hosted recovery was performed. |
| 1 | Real fulfillment rehearsal and launch switch | Agree who confirms orders, books a courier, records tracking, collects/reconciles COD and handles failed delivery/refunds. Manual courier entry is implemented; automatic courier booking is not. Rehearse with the operator, then explicitly open public checkout only after acceptance. |

## Recommended operational acceptance

- Check actual Android Chrome and iPhone Safari, keyboard/screen-reader use and production loading under realistic network conditions. Engine/viewport automation has passed; physical phones and a full screen-reader audit have not.
- Choose who watches errors, uptime, queue failures and security history. Dashboard history exists; external security alerts and a dedicated external error/uptime monitoring service are not verified or activated by this project.
- Confirm deployment/rollback ownership, access to GitHub/Vercel/Supabase and a practical incident contact. Keep recovery material and secrets outside source control.

## Optional rather than missing COD functionality

Online card/wallet payments, automatic courier integrations, guest checkout, analytics, promotions/broadcasts, reviews and an admin subdomain are optional later scope. COD, manual tracking, customer order history, owner order management, CMS, private support, responsive UI, sharing, metadata, sitemap, robots and custom 404 already exist. No additional CMS needs to be built.

## Best next work without final products/domain

Wire approved email drafts into runtime delivery, prepare a safe worker scheduler, improve policy rendering, complete owner MFA enrollment with each owner, and collect/publish genuine support/operating information. Sender activation, real inbox acceptance and hosted recovery still require the operator's service access and choices. Keep real checkout closed until the final acceptance gate is passed.

This checklist is saved locally. This review did not modify application code, send email, create orders, alter owner MFA, push or deploy anything.
