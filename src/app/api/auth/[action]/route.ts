import { cookies } from "next/headers";
import { accountClient, authConfigured } from "@/lib/supabase-server";
import { allowAuth, body, json } from "@/lib/account-http";
import { emailField, passwordField, textField } from "@/lib/account-validation";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  if (!authConfigured())
    return json(
      {
        error:
          "Accounts are not configured yet. You can still browse and save items on this device.",
      },
      503,
    );
  try {
    const input = await body(request);
    const client = await accountClient();
    if (action === "logout") {
      const { error } = await client.auth.signOut({ scope: "local" });
      if (error)
        return json({ error: "Could not sign out. Please try again." }, 503);
      (await cookies()).delete("stride-recovery");
      return json({ ok: true });
    }
    if (action === "password") {
      const { data } = await client.auth.getUser();
      if (!data.user)
        return json(
          {
            error: "Open a valid recovery link before changing your password.",
          },
          401,
        );
      const password = passwordField(input.password);
      if (input.confirmPassword !== password)
        return json({ error: "Passwords must match." }, 400);
      const recovery =
        (await cookies()).get("stride-recovery")?.value === data.user.id;
      if (!recovery)
        return json(
          { error: "Request a new recovery link to change your password." },
          403,
        );
      const { error } = await client.auth.updateUser({ password });
      if (error)
        return json(
          {
            error:
              "Could not update your password. Request a fresh recovery link and try again.",
          },
          400,
        );
      (await cookies()).delete("stride-recovery");
      await client.auth.signOut({ scope: "global" });
      return json({ ok: true, redirect: "/login?updated=1" });
    }
    if (!["login", "register", "recovery"].includes(action))
      return json({ error: "Unknown account action." }, 404);
    const email = emailField(input.email);
    if (!allowAuth(request, action, email))
      return json(
        { error: "Too many attempts. Wait a few minutes before trying again." },
        429,
      );
    const site =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SITE_URL
        : new URL(request.url).origin;
    if (!site)
      return json({ error: "Account redirects are not configured yet." }, 503);
    if (action === "recovery") {
      if (process.env.AUTH_EMAIL_ENABLED !== "true")
        return json(
          {
            error:
              "Password recovery email is not available yet. Contact the store owner for help accessing your account.",
          },
          503,
        );
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${site}/auth/callback?next=/reset-password`,
      });
      if (error)
        return json(
          {
            error:
              "We could not process this request. Wait a few minutes and try again.",
          },
          503,
        );
      return json({
        message:
          "If an account exists for this email, you’ll receive a recovery link. Check your inbox and spam folder.",
      });
    }
    if (
      action === "login" &&
      (typeof input.password !== "string" ||
        input.password.length < 1 ||
        input.password.length > 128)
    )
      return json({ error: "Enter your password." }, 400);
    const password =
      action === "login"
        ? (input.password as string)
        : passwordField(input.password);
    if (action === "login") {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error)
        return json(
          {
            error:
              "Unable to sign in. Check your email and password, and confirm your email if required.",
          },
          400,
        );
      return json({ ok: true });
    }
    if (process.env.AUTH_EMAIL_ENABLED !== "true")
      return json(
        {
          error:
            "New account registration is not available until confirmation email is configured. You can keep shopping as a guest.",
        },
        503,
      );
    if (input.confirmPassword !== password)
      return json({ error: "Passwords must match." }, 400);
    const full_name = textField(input.fullName, "Name", 1, 100);
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name },
        emailRedirectTo: `${site}/auth/callback?next=/account`,
      },
    });
    if (error)
      return json(
        {
          error:
            "We could not create your account. Try again later, or sign in if you already have an account.",
        },
        400,
      );
    return json(
      data.session
        ? { ok: true }
        : {
            message:
              "Check your inbox for a confirmation link. If you already have an account, sign in or request a password reset.",
          },
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error && !/fetch|Supabase|JSON/i.test(error.message)
            ? error.message
            : "Could not complete your request. Please try again.",
      },
      400,
    );
  }
}
