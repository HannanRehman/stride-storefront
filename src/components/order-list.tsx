"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";
import {
  orderDate,
  orderReference,
  orderStatuses,
  statusLabel,
  type StoreOrder,
} from "@/lib/orders";
export function OrderList({ owner = false }: { owner?: boolean }) {
  const [result, setResult] = useState<{
    orders: StoreOrder[];
    count: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [reload, setReload] = useState(0);
  const [loadedFor, setLoadedFor] = useState("");
  const signature = `${page}:${status}:${reload}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `${owner ? "/api/admin/orders" : "/api/orders"}?page=${page}&status=${status}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult(data);
          setLoadedFor(signature);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoadedFor(signature);
          setResult(null);
        }
      });
    return () => controller.abort();
  }, [owner, page, status, reload, signature]);
  return (
    <div className="orders-list">
      <div className="orders-toolbar">
        {owner && (
          <label>
            Order status
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All orders</option>
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className="order-link-button"
          onClick={() => setReload((n) => n + 1)}
        >
          Refresh orders
        </button>
      </div>
      {loadedFor !== signature ? (
        <p role="status">Loading orders…</p>
      ) : error ? (
        <p role="alert">{error}</p>
      ) : result?.orders.length ? (
        <>
          <ul className="order-rows">
            {result.orders.map((o) => (
              <li key={o.id}>
                <Link href={`${owner ? "/admin" : "/account"}/orders/${o.id}`}>
                  <div>
                    <strong>{orderReference(o.id)}</strong>
                    <span>{orderDate(o.created_at)}</span>
                    {owner && (
                      <span>
                        {o.address.recipient} · {o.address.city}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className={`order-status order-status-${o.status}`}>
                      {statusLabel(o.status)}
                    </span>
                    <strong>{money(o.total_minor, "PKR")}</strong>
                    <span>Cash on delivery</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="orders-pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>
              Page {page} of {Math.max(1, Math.ceil(result.count / 20))}
            </span>
            <button
              disabled={page * 20 >= result.count}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </>
      ) : (
        <p>
          No orders{status ? ` with status ${status}` : " yet"}.{" "}
          {owner ? (
            "New cash on delivery orders will appear here."
          ) : (
            <Link href="/shop/all">Explore the collection</Link>
          )}
        </p>
      )}
    </div>
  );
}
