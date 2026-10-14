# Activate customer accounts

The code and database are prepared. These instructions describe remaining external configuration; email delivery has not been verified.

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
