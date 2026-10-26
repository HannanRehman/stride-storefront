"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
export function LaunchForm() {
  const [email, setEmail] = useState(""),
    [consent, setConsent] = useState(false),
    [website, setWebsite] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", email, consent, website }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not save your interest. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return done ? (
    <p role="status">
      Your interest has been recorded. If confirmation is needed and email
      delivery is active, you’ll receive a confirmation link. No account or
      order was created.
    </p>
  ) : (
    <form className="launch-form" onSubmit={submit}>
      {error && <p role="alert">{error}</p>}
      <label>
        Email address
        <input
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          value={email}
          disabled={busy}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <div className="form-trap" aria-hidden="true">
        <label>
          Website
          <input
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>
      <label className="order-checkbox">
        <input
          type="checkbox"
          required
          checked={consent}
          disabled={busy}
          onChange={(e) => setConsent(e.target.checked)}
        />
        I’d like email updates about the first launch. I can unsubscribe at any
        time.
      </label>
      <p className="form-note">
        We save your email and permission for launch updates. Signup does not
        reserve a product. Read our{" "}
        <Link href="/privacy">privacy information</Link>.
      </p>
      <Button disabled={busy}>{busy ? "Saving…" : "Keep me posted"}</Button>
    </form>
  );
}
export function LaunchAction({
  action,
  token,
}: {
  action: "confirm" | "unsubscribe";
  token: string;
}) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function act() {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, token }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage(
        action === "confirm"
          ? "If this confirmation link was valid, your preference has been saved. You can close this page."
          : "If this unsubscribe link was valid, launch updates have been stopped. You can close this page.",
      );
    } catch (e) {
      setMessage(
        e instanceof Error
          ? e.message
          : "The preference could not be saved. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {message && <p role="status">{message}</p>}
      <Button disabled={busy} onClick={act}>
        {busy
          ? "Saving…"
          : action === "confirm"
            ? "Confirm launch updates"
            : "Unsubscribe from launch updates"}
      </Button>
    </>
  );
}
