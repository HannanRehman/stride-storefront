"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { money } from "@/lib/utils";
import {
  orderDate,
  orderReference,
  orderTransitions,
  statusLabel,
  type OrderStatus,
  type StoreOrder,
  type OrderEvent,
} from "@/lib/orders";
export function OrderDetail({
  id,
  owner = false,
}: {
  id: string;
  owner?: boolean;
}) {
  const [order, setOrder] = useState<StoreOrder | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const endpoint = `${owner ? "/api/admin" : "/api"}/orders/${encodeURIComponent(id)}`;
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: "no-store", signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        return data;
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          setOrder(data.order);
          setEvents(data.events);
          setCourier(data.order.courier);
          setTracking(data.order.tracking_reference);
          setError("");
          setUncertain(false);
          setLoaded(true);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setError(e.message);
          setLoaded(true);
        }
      });
    return () => controller.abort();
  }, [endpoint, reload]);
  async function update() {
    if (!order || !target || busy || uncertain) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: target,
          updatedAt: order.updated_at,
          courier,
          tracking,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setUncertain(true);
      setReload((n) => n + 1);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm this update. Reload the order before retrying.",
      );
      setUncertain(true);
    } finally {
      setTarget(null);
      setBusy(false);
    }
  }
  return (
    <div className="order-detail">
      <Link href={owner ? "/admin/orders" : "/account/orders"}>
        Back to orders
      </Link>
      {!loaded ? (
        <p role="status">Loading order…</p>
      ) : (
        <>
          {error && (
            <p className="checkout-message" role="alert">
              {error}
            </p>
          )}
          <button
            className="order-link-button"
            disabled={busy}
            onClick={() => {
              setLoaded(false);
              setReload((n) => n + 1);
            }}
          >
            Reload order
          </button>
          {order && (
            <>
              <div className="order-heading">
                <div>
                  <h2>Order {orderReference(order.id)}</h2>
                  <p>{orderDate(order.created_at)}</p>
                </div>
                <span className={`order-status order-status-${order.status}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              {order.status === "pending" && (
                <p>
                  Your order has been received and is awaiting store
                  confirmation.
                </p>
              )}
              <div className="order-detail-grid">
                <section>
                  <h3>Items</h3>
                  <ul className="order-items">
                    {order.items.map((i) => (
                      <li key={`${i.productId}:${i.size}`}>
                        <div>
                          <strong>{i.name}</strong>
                          <p>
                            {i.color} / {i.size} · Qty {i.quantity}
                          </p>
                          <p>{money(i.unit_minor, "PKR")} each</p>
                        </div>
                        <strong>{money(i.line_minor, "PKR")}</strong>
                      </li>
                    ))}
                  </ul>
                  <dl className="order-totals">
                    <div>
                      <dt>Subtotal</dt>
                      <dd>{money(order.subtotal_minor, "PKR")}</dd>
                    </div>
                    <div>
                      <dt>Delivery</dt>
                      <dd>{money(order.shipping_minor, "PKR")}</dd>
                    </div>
                    <div>
                      <dt>Total</dt>
                      <dd>{money(order.total_minor, "PKR")}</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3>Delivery address</h3>
                  <address>
                    {order.address.recipient}
                    <br />
                    {order.address.line1}
                    {order.address.line2 && (
                      <>
                        <br />
                        {order.address.line2}
                      </>
                    )}
                    <br />
                    {order.address.city}, {order.address.province}{" "}
                    {order.address.postal_code}
                    <br />
                    Pakistan
                    <br />
                    {order.address.phone}
                  </address>
                  <h3>Payment</h3>
                  <p>
                    {order.payment_status === "collected"
                      ? "Cash collected on delivery"
                      : order.status === "cancelled"
                        ? "Cancelled · no payment collected"
                        : `Cash on delivery · ${money(order.total_minor, "PKR")} due`}
                  </p>
                  {order.tracking_reference && (
                    <>
                      <h3>Shipment</h3>
                      <p>
                        {order.courier}
                        <br />
                        Tracking: {order.tracking_reference}
                      </p>
                    </>
                  )}
                </section>
              </div>
              {!owner && (
                <p>
                  <Link href={`/account/requests/new?order=${order.id}`}>
                    Get help with this order
                  </Link>
                </p>
              )}
              <section className="order-timeline">
                <h3>Order history</h3>
                <ol>
                  {events.map((e) => (
                    <li key={e.id}>
                      <strong>{statusLabel(e.status)}</strong>
                      <span>{orderDate(e.created_at)}</span>
                    </li>
                  ))}
                </ol>
              </section>
              {owner && (
                <section className="order-management">
                  <h3>Manage this order</h3>
                  {uncertain && (
                    <p role="status">
                      Reload the order to confirm its current status before
                      making another change.
                    </p>
                  )}
                  {order.status === "confirmed" && (
                    <div className="checkout-fields">
                      <label>
                        Courier name
                        <input
                          maxLength={80}
                          value={courier}
                          disabled={busy || uncertain}
                          onChange={(e) => setCourier(e.target.value)}
                        />
                      </label>
                      <label>
                        Tracking reference
                        <input
                          maxLength={120}
                          value={tracking}
                          disabled={busy || uncertain}
                          onChange={(e) => setTracking(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                  <div className="order-actions">
                    {orderTransitions[order.status].map((s) => (
                      <button
                        key={s}
                        className={
                          s === "cancelled"
                            ? "admin-secondary"
                            : "admin-primary"
                        }
                        disabled={busy || uncertain}
                        onClick={() => setTarget(s)}
                      >
                        {s === "cancelled" ? "Cancel order" : `Mark ${s}`}
                      </button>
                    ))}
                  </div>
                  {!orderTransitions[order.status].length && (
                    <p>
                      This order is complete. No further status changes are
                      available.
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}
      <Dialog
        open={Boolean(target)}
        onOpenChange={(open) => {
          if (!open && !busy) setTarget(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {target === "cancelled"
              ? "Cancel this order?"
              : `Mark order ${target}?`}
          </DialogTitle>
          <DialogDescription>
            {target === "delivered"
              ? "Only continue after delivery and cash collection have been verified. This records payment as collected."
              : target === "cancelled"
                ? "The reserved stock will be returned. This cannot be undone."
                : target === "shipped"
                  ? "Confirm the parcel has been handed to the courier. The customer will see the tracking reference."
                  : "Confirm stock and delivery details before accepting this order."}
          </DialogDescription>
          <div className="order-actions">
            <button
              className="admin-secondary"
              disabled={busy}
              onClick={() => setTarget(null)}
            >
              Keep current status
            </button>
            <button className="admin-primary" disabled={busy} onClick={update}>
              {busy ? "Saving…" : "Confirm status change"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
