"use client";
import { useEffect, useState } from "react";
export function AudienceManager() {
  const [result, setResult] = useState<{
      people: {
        id: string;
        email: string;
        status: string;
        created_at: string;
      }[];
      count: number;
    } | null>(null),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    fetch(`/api/admin/audience?page=${page}&status=${status}`, {
      cache: "no-store",
      signal: c.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        if (!c.signal.aborted) {
          setResult(d);
          setError("");
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [page, status, reload]);
  return (
    <>
      <div className="orders-toolbar">
        <label>
          Signup status
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All signups</option>
            {["unconfirmed", "confirmed", "unsubscribed"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button
          className="order-link-button"
          onClick={() => setReload((n) => n + 1)}
        >
          Refresh audience
        </button>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : result ? (
        <>
          <p>
            {result.count} matching signups. Only confirmed, subscribed people
            are eligible for future launch messages.
          </p>
          <ul className="order-rows">
            {result.people.map((p) => (
              <li key={p.id} className="audience-row">
                <span>{p.email}</span>
                <span className="order-status">{p.status}</span>
                <span>
                  {new Date(p.created_at).toLocaleDateString("en-PK")}
                </span>
              </li>
            ))}
          </ul>
          <div className="orders-pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              disabled={page * 20 >= result.count}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p role="status">Loading audience…</p>
      )}
    </>
  );
}
