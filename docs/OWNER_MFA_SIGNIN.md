# Owner authenticator sign-in step

October 27, 2026. Requested change: collect the authenticator code on a dedicated page after owner password sign-in, before showing the admin portal. This implementation is local until a separately authorized push/deployment.

## Final flow

1. Open an admin destination, for example `/admin/orders`. An anonymous visitor goes to sign-in with that destination preserved.
2. Successful owner password sign-in redirects to `/auth/verify?next=%2Fadmin%2Forders`.
3. The verification page shows only the store wordmark, sign-out, explanation and authenticator form. No admin sidebar, navigation or security history is rendered.
4. An unenrolled owner sees authenticator setup first. Only the owner scans the private QR and enters their code; the agent does not enroll real accounts or handle their setup keys.
5. Invalid codes keep the owner on the verification page. A valid provider verification creates an AAL2 session, confirms per-owner database enforcement and automatically opens the original admin destination.
6. An already verified session skips the verification form. Customer browsing/account sign-in does not require owner MFA; ordinary customers cannot use the owner verification screen.

All application admin pages and privileged admin APIs now require AAL2, including owners who have not yet enrolled. The limited owner-security endpoint remains available for setup/challenge metadata and verification, but returns no security history until AAL2. Security settings/history are inside the protected portal after verification.

Return destinations are restricted to normalized local `/admin` paths. External URLs, non-admin pages, encoded path separators and paths that normalize out of `/admin` fall back to `/admin`. The proxy still overwrites its trusted path header; that header cannot exempt a page from MFA.

No hosted schema, policy, factor or membership flag was changed by this UI/routing work. Existing database RLS/RPC MFA enforcement remains tied to each owner's successful enrollment. A read-only check found one of the two genuine owners already enrolled; that authenticator was preserved.

## Design

Keep the approved white/near-black theme, DM Sans body and Barlow Condensed heading. A single column, at most 440px wide, makes the six-digit input the main task. It supports password-manager one-time-code autofill, numeric keyboards, normal keyboard submission and visible focus/error states. Setup and existing-factor verification use the same server operations as the previous Security flow; no alternate authentication mechanism was introduced.

## Test isolation

Browser fixtures use a dedicated Next output directory under ignored `.tools/next-checkout` or `.tools/next-admin`, selected only by their child process's `STOREFRONT_TEST_MODE`. This avoids claiming or stopping an owner's normal `.next` dev server. Fixture owner sessions for unrelated admin scenarios explicitly carry AAL2; the MFA scenario uses actual fixture password login and wrong/correct code transitions from AAL1.

The hosted Auth provider, real authenticator app and actual owner sign-in remain manual acceptance after deployment. Test factor/QR/code fixtures never reach hosted Supabase.

## Verification results

- 39 unit tests across ten suites passed, including normalized admin destinations, traversal/encoded-separator rejection and existing account/email boundaries.
- All 21 checkout/account/security scenarios passed in Google Chrome. The MFA scenario signs in with a fixture owner's password, completes first-time setup, rejects wrong codes, opens the requested order page only after successful verification, signs in again and checks the dedicated code screen. Password-only admin APIs return 428, pending-owner security history is empty, and a spoofed path header cannot exempt admin access. Guests/customers are denied the verification flow.
- All six product-admin Chrome scenarios passed using explicitly verified owner fixture sessions. Customer checkout, support, CMS, account sync and cancellation/restock regressions remain passing.
- The verification screen passed the tested 375px layout/axe scan; its mobile screenshot was inspected. This is not a full screen-reader audit or a claim of physical-device testing.
- Lint, TypeScript production compilation, optimized build and Chrome production smoke passed. The smoke includes anonymous protection for `/auth/verify`, public/private routes, existing 404/sitemap/robots and protected email worker, with zero browser page errors.
- No genuine factors, membership flags, orders or emails were changed by the tests. No commit/push/deployment was performed. Test servers stopped themselves; this work did not stop the owner's pre-existing development server or VS Code port forwarding.

Ignored evidence: `.tools/mfa-checkout.log`, `.tools/mfa-admin.log` and `.tools/owner-verification-mobile.png`.
