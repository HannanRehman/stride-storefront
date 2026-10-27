"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/account-validation";
type Status = {
  required: boolean;
  level: string | null;
  factors: { id: string; name: string }[];
  events: { id: string; kind: string; entity_id: string; created_at: string }[];
  gatewayConfigured: boolean;
};
export function OwnerSecurity() {
  const [status, setStatus] = useState<Status | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0),
    [setup, setSetup] = useState<{
      factorId: string;
      qr: string;
      secret: string;
    } | null>(null),
    [factorId, setFactor] = useState(""),
    [code, setCode] = useState("");
  const next = safeNext(useSearchParams().get("next") || "/admin");
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/admin/security", { cache: "no-store", signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw Error(d.error);
        return d;
      })
      .then((d) => {
        if (!c.signal.aborted) {
          setStatus(d);
          setFactor(d.factors[0]?.id || "");
          setError("");
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [reload]);
  async function action(action: string, event?: FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          factorId: setup?.factorId || factorId,
          code,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      if (action === "enroll") setSetup(d);
      else {
        setSetup(null);
        setCode("");
        setReload((n) => n + 1);
      }
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm this action. Reload security.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="owner-security">
      {error && (
        <p role="alert" className="checkout-message">
          {error}
        </p>
      )}
      <button
        className="order-link-button"
        type="button"
        disabled={busy}
        onClick={() => setReload((n) => n + 1)}
      >
        Reload security
      </button>
      {!status ? (
        <p role="status">Loading security…</p>
      ) : (
        <>
          <section className="admin-editor-section">
            <h2>Two-factor authentication</h2>
            <p>
              {status.required
                ? status.level === "aal2"
                  ? "Authenticator verified. Owner access requires two factors."
                  : "Verify your authenticator to continue to the owner dashboard."
                : "Set up an authenticator to require a second factor for your owner account."}
            </p>
            {!status.required && !setup && !status.factors.length && (
              <button
                type="button"
                className="admin-primary"
                disabled={busy}
                onClick={() => void action("enroll")}
              >
                Set up authenticator
              </button>
            )}
            {setup && (
              <div className="mfa-setup">
                <p>
                  Scan this code with your authenticator app. Keep access to
                  that app; losing it requires verified operator recovery.
                </p>
                {/* A private, provider-generated QR data URL, never a remote product image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={setup.qr}
                  width={220}
                  height={220}
                  alt="Scan to set up your store authenticator"
                />
                <details>
                  <summary>Enter the setup key manually</summary>
                  <code>{setup.secret}</code>
                </details>
              </div>
            )}
            {(setup ||
              (status.factors.length > 0 &&
                (!status.required || status.level !== "aal2"))) && (
              <form
                onSubmit={(e) => void action("verify", e)}
                className="mfa-form"
              >
                {!setup && status.factors.length > 1 && (
                  <label>
                    Authenticator
                    <select
                      value={factorId}
                      onChange={(e) => setFactor(e.target.value)}
                    >
                      {status.factors.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Authenticator code
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    minLength={6}
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    required
                  />
                </label>
                <button className="admin-primary" disabled={busy} type="submit">
                  {busy ? "Verifying…" : "Verify authenticator"}
                </button>
              </form>
            )}
            {status.required && status.level === "aal2" && (
              <Link
                className="admin-primary"
                href={next === "/admin/security" ? "/admin" : next}
              >
                Continue to dashboard
              </Link>
            )}
            {status.required &&
              !status.factors.length &&
              status.level !== "aal2" && (
                <p>
                  There is no verified authenticator on this account. Ask the
                  operator to follow the documented recovery process.
                  Password-only access cannot remove this requirement.
                </p>
              )}
          </section>
          <section className="admin-editor-section">
            <h2>Security status</h2>
            <p>
              Shared abuse protection:{" "}
              {status.gatewayConfigured
                ? "Configured"
                : "Configuration required"}
              . This page does not enable email alerts or change your password.
            </p>
            <p>
              Security history records owner changes and rate-limit alerts
              without delivery addresses, passwords or setup keys.
            </p>
          </section>
          {(!status.required || status.level === "aal2") && (
            <section className="admin-editor-section">
              <h2>Recent security activity</h2>
              {status.events.some((e) => e.kind === "request_limit") && (
                <p className="checkout-message">
                  Recent request bursts were blocked by the shared limit. Review
                  this activity if it was unexpected.
                </p>
              )}
              {status.events.length ? (
                <ul className="security-events">
                  {status.events.map((e) => (
                    <li key={e.id}>
                      <strong>{e.kind.replaceAll("_", " ")}</strong>
                      <span>
                        {new Date(e.created_at).toLocaleString("en-PK")}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No security events recorded yet.</p>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
