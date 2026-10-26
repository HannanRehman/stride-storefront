"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useStore } from "@/components/store-provider";
import { orderDate, orderReference, type StoreOrder } from "@/lib/orders";
import {
  requestKinds,
  type RequestKind,
  type SupportRequest,
  type SupportMessage,
} from "@/lib/support";
import { Button } from "@/components/ui/button";
export function RequestList({ owner = false }: { owner?: boolean }) {
  const [result, setResult] = useState<{
      requests: SupportRequest[];
      count: number;
    } | null>(null),
    [page, setPage] = useState(1),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0),
    [loaded, setLoaded] = useState("");
  const sig = `${page}:${status}:${reload}`;
  useEffect(() => {
    const c = new AbortController();
    fetch(
      `${owner ? "/api/admin" : "/api"}/requests?page=${page}&status=${status}`,
      { cache: "no-store", signal: c.signal },
    )
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      })
      .then((d) => {
        if (!c.signal.aborted) {
          setResult(d);
          setError("");
          setLoaded(sig);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) {
          setError(e.message);
          setLoaded(sig);
        }
      });
    return () => c.abort();
  }, [owner, page, status, reload, sig]);
  return (
    <>
      <div className="orders-toolbar">
        {owner ? (
          <label>
            Request status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All requests</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
        ) : (
          <Link className="button button-primary" href="/account/requests/new">
            New request
          </Link>
        )}
        <button
          className="order-link-button"
          onClick={() => setReload((n) => n + 1)}
        >
          Refresh requests
        </button>
      </div>
      {loaded !== sig ? (
        <p role="status">Loading requests…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : result?.requests.length ? (
        <ul className="order-rows">
          {result.requests.map((r) => (
            <li key={r.id}>
              <Link href={`${owner ? "/admin" : "/account"}/requests/${r.id}`}>
                <div>
                  <strong>{r.subject}</strong>
                  <span>
                    {r.kind} · {orderDate(r.created_at)}
                  </span>
                </div>
                <span className="order-status">
                  {r.status.replace("_", " ")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>No requests yet.</p>
      )}
      {result && (
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
      )}
    </>
  );
}
type PendingRequest = {
  customerId: string;
  requestKey: string;
  kind: RequestKind;
  subject: string;
  message: string;
  orderId: string;
};
export function NewRequest({ initialOrder = "" }: { initialOrder?: string }) {
  const { user, ready } = useStore();
  if (!user)
    return ready ? (
      <p>
        <Link href="/login?next=/account/requests/new">
          Sign in to send a request
        </Link>
      </p>
    ) : (
      <p role="status">Loading your account…</p>
    );
  return (
    <NewRequestSession key={user?.id || "guest"} initialOrder={initialOrder} />
  );
}
function NewRequestSession({ initialOrder }: { initialOrder: string }) {
  const { user, ready } = useStore();
  const [kind, setKind] = useState<RequestKind>("question"),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [orderId, setOrderId] = useState(initialOrder),
    [orders, setOrders] = useState<StoreOrder[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [pending, setPending] = useState<PendingRequest | null>(null),
    [recovered, setRecovered] = useState(false),
    [receipt, setReceipt] = useState("");
  const storageKey = `stride-help-request:${user?.id || "guest"}`;
  useEffect(() => {
    if (!user) return;
    let mounted = true;
    Promise.resolve()
      .then(() => {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
          const item = JSON.parse(saved) as PendingRequest;
          if (
            item.customerId !== user.id ||
            !item.requestKey ||
            !requestKinds.includes(item.kind) ||
            typeof item.message !== "string" ||
            typeof item.subject !== "string" ||
            typeof item.orderId !== "string"
          )
            throw new Error(
              "Check your saved requests before starting a new request. This browser could not restore the last attempt.",
            );
          if (mounted) {
            setPending(item);
            setKind(item.kind);
            setSubject(item.subject);
            setMessage(item.message);
            setOrderId(item.orderId);
          }
        }
        if (mounted) setRecovered(true);
      })
      .catch((e) => {
        if (mounted)
          setError(
            e.message || "Allow session storage to send a help request.",
          );
      });
    return () => {
      mounted = false;
    };
  }, [storageKey, user]);
  useEffect(() => {
    const c = new AbortController();
    fetch("/api/orders", { cache: "no-store", signal: c.signal })
      .then((r) => r.json())
      .then((d) => {
        if (!c.signal.aborted && Array.isArray(d.orders)) setOrders(d.orders);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !user || !ready || !recovered) return;
    setBusy(true);
    setError("");
    const payload = pending || {
      customerId: user.id,
      requestKey: crypto.randomUUID(),
      kind,
      subject,
      message,
      orderId,
    };
    try {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(payload));
      } catch {
        throw new Error(
          "Allow session storage before sending. This request was not sent.",
        );
      }
      setPending(payload);
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) {
        if (
          r.status < 500 &&
          ![401, 403].includes(r.status) &&
          d.code !== "request_changed"
        ) {
          sessionStorage.removeItem(storageKey);
          setPending(null);
        }
        throw new Error(d.error);
      }
      setReceipt(d.id);
      sessionStorage.removeItem(storageKey);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm your request. Retry the same request.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <div>
        <h2>Request received</h2>
        <p>
          Follow the conversation in your account. No cancellation, return or
          refund is approved automatically.
        </p>
        <Link href={`/account/requests/${receipt}`}>View your request</Link>
      </div>
    );
  return (
    <form onSubmit={send} className="support-form">
      {error && <p role="alert">{error}</p>}
      <fieldset disabled={busy || Boolean(pending) || !ready || !recovered}>
        <label>
          Request type
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as RequestKind)}
          >
            {requestKinds.map((k) => (
              <option key={k} value={k}>
                {k.charAt(0).toUpperCase() + k.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Order{kind === "question" ? " (optional)" : ""}
          <select
            required={kind !== "question"}
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          >
            <option value="">Choose an order</option>
            {orderId && !orders.some((o) => o.id === orderId) && (
              <option value={orderId}>{orderReference(orderId)}</option>
            )}
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {orderReference(o.id)} · {o.status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Subject
          <input
            required
            maxLength={120}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </label>
        <label>
          Message
          <textarea
            required
            rows={6}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </label>
      </fieldset>
      <p className="form-note">
        Do not include passwords or payment card details. Cancellation requests
        are for unshipped orders; return requests are for delivered orders.
        Requests require store review.
      </p>
      <Button disabled={busy || !ready || !recovered}>
        {busy
          ? "Sending…"
          : pending
            ? "Retry the same request"
            : "Send request"}
      </Button>
    </form>
  );
}
export function RequestDetail({
  id,
  owner = false,
}: {
  id: string;
  owner?: boolean;
}) {
  const [record, setRecord] = useState<SupportRequest | null>(null),
    [messages, setMessages] = useState<SupportMessage[]>([]),
    [body, setBody] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [reload, setReload] = useState(0),
    [uncertain, setUncertain] = useState(false),
    [replyKey, setReplyKey] = useState("");
  const pendingReply = useRef<{ key: string; body: string } | null>(null);
  const [messagePage, setMessagePage] = useState(1),
    [messageCount, setMessageCount] = useState(0);
  const endpoint = `${owner ? "/api/admin" : "/api"}/requests/${encodeURIComponent(id)}`;
  useEffect(() => {
    const c = new AbortController();
    fetch(`${endpoint}?page=${messagePage}`, {
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
          setRecord(d.request);
          setMessages(d.messages);
          setMessageCount(d.messagesCount || 0);
          if (
            pendingReply.current &&
            d.messages.some(
              (m: SupportMessage) =>
                m.client_key === pendingReply.current?.key &&
                m.body === pendingReply.current?.body,
            )
          ) {
            setBody("");
            setReplyKey("");
            pendingReply.current = null;
          }
          setError("");
          setUncertain(false);
        }
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [endpoint, reload, messagePage]);
  async function change(action: "reply" | "status", status?: string) {
    if (!record || busy || uncertain) return;
    setBusy(true);
    setError("");
    const key = replyKey || crypto.randomUUID();
    if (action === "reply") {
      setReplyKey(key);
      pendingReply.current = { key, body };
    }
    try {
      const r = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          status,
          updatedAt: record.updated_at,
          message: body,
          messageKey: key,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      if (action === "reply") {
        setBody("");
        setReplyKey("");
        pendingReply.current = null;
        setMessagePage(1);
      }
      setUncertain(true);
      setReload((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm this change. Reload the request.",
      );
      setUncertain(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="request-detail">
      <Link href={owner ? "/admin/requests" : "/account/requests"}>
        Back to requests
      </Link>
      {error && (
        <p className="checkout-message" role="alert">
          {error}
        </p>
      )}
      <button
        className="order-link-button"
        disabled={busy}
        onClick={() => setReload((n) => n + 1)}
      >
        Reload request
      </button>
      {record ? (
        <>
          <h2>{record.subject}</h2>
          <p>
            {record.kind} · {record.status.replace("_", " ")} ·{" "}
            {orderDate(record.created_at)}
          </p>
          {record.order_id && (
            <Link
              href={`${owner ? "/admin" : "/account"}/orders/${record.order_id}`}
            >
              View related order
            </Link>
          )}
          <ol className="support-messages">
            {messages.map((m) => (
              <li key={m.id}>
                <div>
                  <strong>
                    {m.author_role === "owner" ? "Store team" : "Customer"}
                  </strong>
                  <span>{orderDate(m.created_at)}</span>
                </div>
                <p>{m.body}</p>
              </li>
            ))}
          </ol>
          {messageCount > 50 && (
            <div className="orders-pagination">
              <button
                disabled={messagePage * 50 >= messageCount || busy}
                onClick={() => setMessagePage((p) => p + 1)}
              >
                Older messages
              </button>
              <span>Conversation page {messagePage}</span>
              <button
                disabled={messagePage === 1 || busy}
                onClick={() => setMessagePage((p) => p - 1)}
              >
                Newer messages
              </button>
            </div>
          )}
          {record.status !== "resolved" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void change("reply");
              }}
            >
              <label>
                Reply
                <textarea
                  required
                  maxLength={2000}
                  rows={5}
                  value={body}
                  disabled={busy || uncertain || Boolean(replyKey)}
                  onChange={(e) => setBody(e.target.value)}
                />
              </label>
              <Button disabled={busy || uncertain}>
                {busy ? "Sending…" : "Send reply"}
              </Button>
            </form>
          )}
          {owner && (
            <div className="order-actions">
              {["open", "in_progress", "resolved"]
                .filter((s) => s !== record.status)
                .map((s) => (
                  <button
                    key={s}
                    className="admin-secondary"
                    disabled={busy || uncertain || Boolean(replyKey)}
                    onClick={() => change("status", s)}
                  >
                    Mark {s.replace("_", " ")}
                  </button>
                ))}
            </div>
          )}
          {record.kind !== "question" && owner && (
            <p className="form-note">
              Resolving this request does not change the order, issue a refund
              or approve a return. Record the actual decision in your reply and
              manage any unshipped cancellation on the order.
            </p>
          )}
        </>
      ) : (
        !error && <p role="status">Loading request…</p>
      )}
    </div>
  );
}
