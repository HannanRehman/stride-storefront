"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { safeNext } from "@/lib/account-validation";
import { notifyAccount } from "@/lib/account-events";
type Mode = "login" | "register" | "recovery" | "password";
export function AuthForm({
  mode,
  next,
  initialError,
  initialMessage,
  configured,
  emailEnabled,
}: {
  mode: Mode;
  next?: string;
  initialError?: string;
  initialMessage?: string;
  configured: boolean;
  emailEnabled: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || "");
  const [message, setMessage] = useState(initialMessage || "");
  const [showPasswords, setShowPasswords] = useState(false);
  const needsEmail = mode === "register" || mode === "recovery";
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (result.message) setMessage(result.message);
      else {
        notifyAccount();
        router.push(result.redirect || safeNext(next));
        router.refresh();
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {!configured && (
        <p className="form-status" role="status">
          Accounts are not available yet. You can still browse and save items on
          this device.
        </p>
      )}
      {configured && needsEmail && !emailEnabled && (
        <p className="form-status" role="status">
          {mode === "register"
            ? "Registration will open once confirmation email is ready. Your guest bag and favorites are still available."
            : "Recovery email is not available yet. Contact the store owner for help accessing your account."}
        </p>
      )}
      <form onSubmit={submit} className="account-form">
        {mode === "register" && (
          <label>
            Full name
            <input
              name="fullName"
              autoComplete="name"
              required
              maxLength={100}
            />
          </label>
        )}
        {mode !== "password" && (
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
        )}
        {mode !== "recovery" && (
          <label>
            {mode === "password" ? "New password" : "Password"}
            <input
              name="password"
              aria-label={mode === "password" ? "New password" : "Password"}
              aria-describedby={
                mode !== "login" ? "auth-password-hint" : undefined
              }
              type={showPasswords ? "text" : "password"}
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              minLength={mode === "login" ? 1 : 10}
              maxLength={128}
            />
            {mode !== "login" && (
              <small id="auth-password-hint">Use at least 10 characters.</small>
            )}
          </label>
        )}
        {(mode === "register" || mode === "password") && (
          <label>
            Confirm password
            <input
              name="confirmPassword"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
            />
          </label>
        )}
        {mode !== "recovery" && (
          <button
            type="button"
            className="order-link-button"
            aria-pressed={showPasswords}
            onClick={() => setShowPasswords((v) => !v)}
          >
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>
        )}
        {mode === "register" && (
          <p className="form-note">
            By creating an account, you agree to our{" "}
            <Link href="/terms">terms</Link> and acknowledge our{" "}
            <Link href="/privacy">privacy policy</Link>.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="form-status" role="status">
            {message}
          </p>
        )}
        <Button
          disabled={busy || !configured || (needsEmail && !emailEnabled)}
          type="submit"
        >
          {busy
            ? "Please wait…"
            : {
                login: "Sign in",
                register: "Create account",
                recovery: "Request recovery link",
                password: "Save new password",
              }[mode]}
        </Button>
      </form>
      <div className="auth-links">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password">Forgot your password?</Link>
            <p>
              New here? <Link href="/register">Create an account</Link>
            </p>
          </>
        ) : (
          <Link href="/login">Back to sign in</Link>
        )}
      </div>
    </>
  );
}
