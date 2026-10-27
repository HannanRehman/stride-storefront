import { ownerIdentity } from "@/lib/admin-server";
import { adminFailure } from "@/lib/admin-server";
import { orderBody } from "@/lib/orders-server";
import { json } from "@/lib/account-http";
import { AdminError } from "@/lib/admin-products";
import { sharedLimit, SecurityError } from "@/lib/security-server";

export async function GET() {
  try {
    const { client, user, mfaRequired } = await ownerIdentity();
    const { data, error } =
      await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error)
      throw new AdminError(
        "Could not verify your session. Sign in again.",
        401,
      );
    const factors = (user.factors || [])
      .filter((f) => f.factor_type === "totp" && f.status === "verified")
      .map((f) => ({ id: f.id, name: f.friendly_name || "Authenticator" }));
    let events: unknown[] = [];
    if (!mfaRequired || data.currentLevel === "aal2") {
      const result = await client
        .from("security_events")
        .select("id,kind,entity_id,created_at")
        .order("created_at", { ascending: false })
        .limit(50);
      if (result.error)
        throw new AdminError("Security history is not activated yet.", 503);
      events = result.data || [];
    }
    return json({
      required: mfaRequired,
      level: data.currentLevel,
      factors,
      events,
      gatewayConfigured: Boolean(process.env.SECURITY_RPC_SECRET),
    });
  } catch (error) {
    return adminFailure(error);
  }
}
export async function POST(request: Request) {
  try {
    const { client, user, mfaRequired } = await ownerIdentity();
    const input = await orderBody(request);
    await sharedLimit(request, "mfa", user.id);
    const level = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level.error)
      throw new AdminError("Could not verify this session.", 401);
    if (input.action === "enroll") {
      if (mfaRequired && level.data.currentLevel !== "aal2")
        throw new AdminError(
          "Verify your existing authenticator before adding another. If it is lost, use the documented operator recovery process.",
          403,
        );
      const pending = (user.factors || []).find(
        (f) => f.factor_type === "totp" && f.status === "unverified",
      );
      if (pending) {
        const result = await client.auth.mfa.unenroll({ factorId: pending.id });
        if (result.error)
          throw new AdminError(
            "Could not replace the unfinished setup. Reload security and try again.",
            503,
          );
      }
      const { data, error } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Store authenticator ${Date.now()}`,
      });
      if (error)
        throw new AdminError(
          "Could not start authenticator setup. Reload security and try again.",
          503,
        );
      return json({
        factorId: data.id,
        qr: data.totp.qr_code.startsWith("data:image/svg+xml;utf-8,")
          ? "data:image/svg+xml;charset=utf-8," +
            encodeURIComponent(
              data.totp.qr_code.slice("data:image/svg+xml;utf-8,".length),
            )
          : data.totp.qr_code,
        secret: data.totp.secret,
      });
    }
    if (
      input.action !== "verify" ||
      typeof input.factorId !== "string" ||
      !/^\d{6}$/.test(String(input.code))
    )
      throw new AdminError("Enter the six-digit code from your authenticator.");
    if (
      !(user.factors || []).some(
        (f) => f.id === input.factorId && f.factor_type === "totp",
      )
    )
      throw new AdminError(
        "Reload security before verifying this authenticator.",
        403,
      );
    const challenge = await client.auth.mfa.challenge({
      factorId: input.factorId,
    });
    if (challenge.error)
      throw new AdminError("Could not start verification. Try again.", 503);
    const verified = await client.auth.mfa.verify({
      factorId: input.factorId,
      challengeId: challenge.data.id,
      code: String(input.code),
    });
    if (verified.error)
      throw new AdminError(
        "The authenticator code could not be verified. Try the current code.",
        400,
      );
    const { error } = await client.rpc("enable_owner_mfa");
    if (error)
      throw new AdminError(
        "Your code was verified, but enforcement could not be confirmed. Reload security before continuing.",
        503,
      );
    return json({ ok: true });
  } catch (error) {
    if (error instanceof SecurityError)
      return json({ error: error.message }, error.status);
    return adminFailure(error);
  }
}
