import "server-only";
import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
export class SecurityError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
export async function sharedLimit(
  request: Request,
  action: "login" | "register" | "recovery" | "mfa" | "launch",
  identity: string,
) {
  const secret = process.env.SECURITY_RPC_SECRET;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!secret || !url || !key)
    throw new SecurityError(
      "Security verification is not configured. Contact the store owner.",
    );
  // Vercel overwrites X-Forwarded-For at the trusted ingress. Local tests use
  // the direct connection fallback. Never store an email address or IP in SQL.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const hash = (value: string) =>
    createHmac("sha256", secret).update(value).digest("hex");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.rpc("consume_security_limit", {
    p_action: action,
    p_identity: hash(identity.trim().toLowerCase()),
    p_ip: hash(ip),
    p_secret: secret,
  });
  if (error)
    throw new SecurityError(
      "Security verification is temporarily unavailable. Try again shortly.",
    );
  if (data !== true)
    throw new SecurityError(
      "Too many attempts. Wait ten minutes before trying again.",
      429,
    );
}
