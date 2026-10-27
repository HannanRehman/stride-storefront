# Activate customer accounts

**October 27 follow-up:** Resend MCP is connected and the requested generic test email was reported delivered. No sending domain exists yet. Dashboard-ready signup/reset templates are in [email-templates/supabase](email-templates/supabase/README.md); actual hosted SMTP, redirect allowlist and Auth template installation remain dashboard steps. Production signup/recovery remains disabled. See [current email integration status](EMAIL_DELIVERY_SETUP.md); historical local-testing notes below do not confirm current production activation.

The code and database are prepared. These instructions describe remaining external configuration; email delivery has not been verified.

## Temporary local testing with Supabase's built-in sender

Local `.env.local` now sets `AUTH_EMAIL_ENABLED=true` for this temporary test. It is ignored by Git. Vercel settings and production activation have not been changed, and no test emails have been sent by the agent.

1. Use `http://localhost:3000` for this local session. Restart `npm.cmd run dev` if the account forms still say email is unavailable.
2. In the [project's Supabase dashboard](https://supabase.com/dashboard/project/simfvguqxbqevvrgkkdp), open Authentication → URL Configuration. Add both entries below to Redirect URLs and save:

   ```text
   http://localhost:3000/auth/callback?next=/account
   http://localhost:3000/auth/callback?next=/reset-password
   ```

   Preserve existing redirect entries. Leave the deployed Site URL as `https://stride-storefront-peach.vercel.app` if it is already configured. The local application explicitly requests the localhost callback URL. These dashboard settings have not been changed or verified by the agent's database tools.
3. Confirm email/password sign-in and email confirmation are enabled in Supabase. Keep confirmation and recovery template links using `{{ .ConfirmationURL }}`. No custom SMTP credentials are needed for the built-in sender.
4. Use an email address listed in the Supabase organization's Team members. The built-in service only delivers to authorized team-member addresses, currently at most two emails per hour, with best-effort delivery. See [Supabase sender restrictions](https://supabase.com/docs/guides/auth/auth-smtp).
5. Open `http://localhost:3000/register`, create a test account using that team-member email, and open its confirmation link in the same browser. After signing in/out, test `http://localhost:3000/forgot-password` with the same email. Open the recovery link in the same browser and choose a new password. Signup confirmation plus recovery will normally use the two-email allowance; avoid repeatedly requesting links.

Local preparation does not verify actual delivery. After the test, set `AUTH_EMAIL_ENABLED=false` in `.env.local` to close the forms again if desired. General customer email still requires a custom sender when the brand/domain is ready.

Preparation checks passed: the public Auth settings report email/password enabled, signup allowed and email confirmation required. Both local form buttons are enabled. A mismatched-password request was rejected before account creation or email sending. The callback allowlist and actual email delivery still require the dashboard/manual checks above.

## Production activation after the brand/domain is ready

1. In Vercel, configure Production with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` from the ignored local `.env.local`. Keep `NEXT_PUBLIC_SITE_URL=https://stride-storefront-peach.vercel.app`. Redeploy. This enables existing-user sign-in and saved account data.
2. In Supabase → Authentication → URL Configuration, set Site URL to `https://stride-storefront-peach.vercel.app`. Add these redirect URLs:

   ```text
   https://stride-storefront-peach.vercel.app/auth/callback?next=/account
   https://stride-storefront-peach.vercel.app/auth/callback?next=/reset-password
   ```

   For local testing also allow the same two paths on `http://localhost:3000` and `http://127.0.0.1:3000`. Confirm the email/password provider is enabled and email confirmation stays enabled.
3. Configure a working sender through Supabase's custom SMTP settings. Keep confirmation and recovery email templates linked to `{{ .ConfirmationURL }}` for the PKCE callback flow. The default email service is intended for restricted testing, not general customer email. See [SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp) and [redirect URL documentation](https://supabase.com/docs/guides/auth/redirect-urls).
4. After verifying the sender/provider setup, add `AUTH_EMAIL_ENABLED=true` to Vercel Production and redeploy. For local acceptance checks set it in `.env.local` and restart. This opens signup and recovery forms; failed provider requests still show an error.
5. Complete acceptance checks with your own designated test email: register, open the confirmation link in the browser where registration started, sign in, save profile/address, sign out, request recovery and open the link in the browser where recovery started. Choose a new password and verify the old password no longer works. Supabase issues single-use, expiring confirmation/recovery codes; the app's recovery page also requires its short-lived HTTP-only recovery marker.

The account routes are excluded from indexing. Cookies and cached responses must remain private; do not add CDN caching in front of account/auth routes. Real products, checkout and orders are still deferred.
