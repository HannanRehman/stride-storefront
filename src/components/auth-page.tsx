import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { authConfigured } from "@/lib/supabase-server";
export async function AuthPage({
  mode,
  searchParams,
}: {
  mode: "login" | "register" | "recovery" | "password";
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const heading = {
    login: "Welcome back.",
    register: "Make it yours.",
    recovery: "Back to your account.",
    password: "A fresh start.",
  }[mode];
  const copy = {
    login: "Sign in to keep your bag and favorites with you.",
    register:
      "Save your favorites, keep your bag across devices, and manage your details.",
    recovery: "Enter your email to request a password recovery link.",
    password: "Choose a new password for your account.",
  }[mode];
  return (
    <main id="main" className="auth-page section">
      <div className="auth-editorial">
        <Link href="/shop/clothing" className="text-link">
          Explore the collection
        </Link>
        <h1>{heading}</h1>
        <p>{copy}</p>
        <div className="auth-wordmark" aria-hidden="true">
          stride.
        </div>
      </div>
      <div className="auth-panel">
        <h2>
          {
            {
              login: "Sign in",
              register: "Create an account",
              recovery: "Forgot password",
              password: "Reset password",
            }[mode]
          }
        </h2>
        <AuthForm
          mode={mode}
          next={typeof params.next === "string" ? params.next : undefined}
          configured={authConfigured()}
          emailEnabled={process.env.AUTH_EMAIL_ENABLED === "true"}
          initialError={
            params.callbackError
              ? "This link has expired or could not be verified. Request a fresh link and open it in the same browser."
              : params.updated
                ? "Your password has been changed. Sign in with your new password."
                : undefined
          }
        />
      </div>
    </main>
  );
}
