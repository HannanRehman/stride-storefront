# Supabase Auth templates

These two HTML files are ready to paste into Supabase's **Authentication → Email → Templates** dashboard. They use Supabase's `{{ .ConfirmationURL }}` action variable, matching this application's existing PKCE callback. They have not been installed into hosted Auth configuration: the connected Supabase tools do not expose that configuration.

| Dashboard template | HTML file | Subject |
| --- | --- | --- |
| Confirm signup | [confirm-signup.html](confirm-signup.html) | Confirm your Stride Storefront account |
| Reset password | [reset-password.html](reset-password.html) | Reset your Stride Storefront password |

Temporary sender name: **Stride Storefront**. It is independent of the required verified sending domain. A recipient opens links in the same browser in which the signup/recovery request began. Never replace the action variable with the home page URL.

Regenerate after changing the site or sender name:

```powershell
npx.cmd tsx scripts/prepare-auth-email-templates.ts --site https://stride-storefront-peach.vercel.app --brand "Stride Storefront"
npx.cmd tsx scripts/verify-email-runtime.ts
```

Keep email/password enabled and email confirmation on. Set the production Site URL to `https://stride-storefront-peach.vercel.app` and allow both callbacks:

```text
https://stride-storefront-peach.vercel.app/auth/callback?next=/account
https://stride-storefront-peach.vercel.app/auth/callback?next=/reset-password
```

Resend SMTP settings after domain verification: host `smtp.resend.com`, port `465`, username `resend`, password a Resend sending API key, and a sender address on the verified domain. Enter keys directly in the service's private settings, never in this file or chat. Keep click tracking off for authentication links. [Resend SMTP setup](https://resend.com/docs/send-with-supabase-smtp), [Supabase email templates](https://supabase.com/docs/guides/auth/auth-email-templates).

Enable public `AUTH_EMAIL_ENABLED=true` only after sender, callback settings and actual confirmation/reset delivery are accepted. The existing built-in sender can still support restricted team-member testing; a successful generic Resend test email does not prove the Supabase Auth flow is configured.
