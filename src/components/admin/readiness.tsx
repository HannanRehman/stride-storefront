"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
type Readiness = {
  database: Record<string, boolean>;
  checkout: { enabled: boolean; shipping_minor: number } | null;
  content: {
    published: Record<string, string>;
    version: number;
    published_at: string | null;
  } | null;
  openRequests: number | null;
  emailJobs:
    | {
        id: string;
        kind: string;
        state: string;
        attempts: number;
        last_error: string | null;
      }[]
    | null;
  services: {
    signupEmail: boolean;
    transactionalEmail: boolean;
    canonicalConfigured: boolean;
    payments: string;
    shipping: string;
  };
};
export function Readiness() {
  const [data, setData] = useState<Readiness | null>(null),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/admin/readiness", { cache: "no-store", signal: c.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        if (!c.signal.aborted) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [reload]);
  return (
    <>
      <button
        className="order-link-button"
        onClick={() => setReload((n) => n + 1)}
      >
        Refresh readiness
      </button>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <dl className="readiness-list">
            {Object.entries(data.database).map(([k, v]) => (
              <div key={k}>
                <dt>{k} database</dt>
                <dd>{v ? "Available" : "Activation required"}</dd>
              </div>
            ))}
            <div>
              <dt>Public ordering</dt>
              <dd>{data.checkout?.enabled ? "Open" : "Closed"}</dd>
            </div>
            <div>
              <dt>Signup/recovery email</dt>
              <dd>
                {data.services.signupEmail
                  ? "Application enabled; delivery acceptance still required"
                  : "Disabled"}
              </dd>
            </div>
            <div>
              <dt>Transactional email</dt>
              <dd>
                {data.services.transactionalEmail
                  ? "Configured; provider acceptance still required"
                  : "Disabled / credentials required"}
              </dd>
            </div>
            <div>
              <dt>Payment method</dt>
              <dd>{data.services.payments}</dd>
            </div>
            <div>
              <dt>Shipment booking</dt>
              <dd>{data.services.shipping}</dd>
            </div>
            <div>
              <dt>Canonical site URL</dt>
              <dd>
                {data.services.canonicalConfigured
                  ? "Configured"
                  : "Needs production URL"}
              </dd>
            </div>
            <div>
              <dt>Open customer requests</dt>
              <dd>{data.openRequests ?? "Unavailable"}</dd>
            </div>
            <div>
              <dt>Staffed support email</dt>
              <dd>
                {data.content?.published?.supportEmail
                  ? "Published"
                  : "Not supplied"}
              </dd>
            </div>
            <div>
              <dt>Final returns information</dt>
              <dd>
                {data.content?.published?.returnsInfo
                  ? "Published; verify business accuracy"
                  : "Not supplied"}
              </dd>
            </div>
          </dl>
          <p>
            Availability checks confirm configuration, not successful real-world
            email delivery, payments or fulfillment. Keep ordering closed until
            merchant setup and final production acceptance are complete.
          </p>
          <p>
            <Link href="/admin/content">Edit store information</Link> ·{" "}
            <Link href="/admin/orders">Manage checkout</Link>
          </p>
          <section>
            <h2>Recent email jobs</h2>
            <p>
              Queues do not send while delivery is disabled. Only delivery state
              is shown here; addresses and private tokens are omitted.
            </p>
            <ul className="order-rows">
              {data.emailJobs?.map((j) => (
                <li key={j.id} className="audience-row">
                  <span>{j.kind.replaceAll("_", " ")}</span>
                  <span>
                    {j.state} · {j.attempts} attempts
                  </span>
                  <span>{j.last_error || ""}</span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
