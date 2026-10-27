# Owner authentication and abuse protection

October 27, 2026. Authenticator setup, MFA enforcement, shared database request limits and private security history are implemented. Migration `20261027140044_security_hardening` is applied and all six SQL assertion suites passed locally and on hosted Supabase. The matching gateway configuration is present locally and as an encrypted Vercel Production variable. The application changes have not been deployed. See [the implementation log](IMPROVEMENTS_IMPLEMENTATION.md).

## Owner two-factor setup

1. Deploy the new security UI before enrolling a genuine owner. Local development uses the same hosted membership: enrolling locally would also enable the requirement on the live database, while the old deployed UI has no verification screen. Until the new UI is deployed, use only the disposable browser fixtures for MFA testing.
2. Sign in as an owner and open `/admin/security`.
3. Select **Set up authenticator**, scan the private QR with an authenticator app, and enter its six-digit code. No SMS provider or paid service is required by this implementation.
4. Successful verification enables `mfa_required` for that owner. Subsequent password-only sessions are redirected to Security. A verified session can continue to the dashboard.
5. Each owner must complete their own setup. No genuine account is enrolled by automated tests. Keep access to the authenticator; do not copy its QR/setup key into screenshots, source control, chat or logs.

The staged default keeps existing memberships usable before their owner completes enrollment. Once enabled, the requirement is checked in both server authorization and PostgreSQL RLS/owner RPCs, including direct Data API calls. Customers' own order/support access and signed-in test checkout remain separate from owner privileges. The security setup endpoint cannot remove an enabled requirement using a password-only session.

## Shared request limits

`SECURITY_RPC_SECRET` is a server-only gateway key. `node scripts/configure-security-local.mjs` creates it only when missing and prints its SHA-256 digest, never the key. `.env.local` remains ignored. The digest belongs in `store_internal.security_config.rpc_secret_hash`; the same key must be configured as an encrypted server variable in the deployment environment before deploying the new auth routes.

The database validates the gateway key before accepting limiter calls. No anonymous client can read the configuration or counters. IP/email identifiers are HMAC hashes rather than plain personal details. Windows are shared across application instances, with limits per action: 8 attempts per IP/identity pair, 16 per identity, 60 per IP, within ten minutes. Login, registration, recovery, MFA and launch signup are covered. Invalid/unavailable security configuration fails closed rather than falling back to an instance-local counter.

The current hosting assumption is Vercel's trusted ingress, which overwrites forwarded-IP headers ([request header documentation](https://vercel.com/docs/headers/request-headers)). Reassess the trust boundary before adding another reverse proxy or self-hosting; arbitrary client-supplied forwarded headers are not a reliable security identity.

Supabase Auth retains its own provider-side abuse limits. The custom gateway does not replace those or prevent every denial-of-service attack. Secrets and matching digests must be rotated together; do not silently replace an existing deployment variable.

## Security history and alerts

`/admin/security` shows recent private security events. Database triggers record owner product, order, campaign and checkout-setting changes; MFA enabling and blocked request bursts are recorded too. History includes actor IDs, event types, record IDs and timestamps, without passwords, setup keys, delivery addresses or email bodies. Customers cannot read or delete it, and owners have no direct update/delete privileges.

This is an in-dashboard alert/history surface. No outside email/SMS/Slack alert destination is activated. Connect an approved destination and verified sender separately if operational notifications are required. Do not claim an external alert was delivered from a dashboard entry.

## Lost authenticator recovery

Recovery requires the trusted project operator to verify identity outside the signed-in browser. An ordinary password reset does not disable owner MFA. Use the provider's authorized session-revocation and lost-factor recovery process, then reset the requirement for only the verified owner's UUID in a trusted SQL session and record the recovery event. Re-enroll immediately afterward. Never add a public recovery endpoint or a global bypass flag.

Example after identity/provider recovery, replacing the placeholder with the single verified UUID:

```sql
begin;
update public.store_owners set mfa_required=false
where user_id='<verified-owner-uuid>'::uuid;
insert into public.security_events(kind,entity_id)
values('operator_mfa_recovery','<verified-owner-uuid>');
commit;
```

Review an uncertain recovery before retrying. Never run an unqualified membership update, remove other owners' factors or delete security evidence as cleanup.

## Password protection and remaining operator steps

The connected MCP tools do not expose Supabase Auth configuration updates. Enable [leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) in the project's Auth configuration when available. Its advisor warning is recorded honestly until the setting is verified; no private Auth service tables are edited as a substitute.

An independent security review, rate-limit tuning for actual traffic, actual owner enrollment and real account-recovery acceptance remain operator work. The implementation does not buy services, open sales, enroll owners silently or send security messages.
