"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { CheckoutSettings as Settings } from "@/lib/orders";
export function CheckoutSettings() {
  const [saved, setSaved] = useState<Settings | null>(null);
  const [shipping, setShipping] = useState("250");
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [confirmation, setConfirmation] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/checkout-settings", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d.settings as Settings;
      })
      .then((s) => {
        if (!controller.signal.aborted) {
          setSaved(s);
          setShipping((s.shipping_minor / 100).toFixed(2));
          setEnabled(s.enabled);
          setError("");
          setUncertain(false);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [reload]);
  async function save(event?: FormEvent) {
    event?.preventDefault();
    if (!saved || busy || uncertain) return;
    if (enabled && !confirmation) {
      setConfirmation(true);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/checkout-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shipping,
          enabled,
          updatedAt: saved.updated_at,
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
          : "Could not confirm checkout settings. Reload them before retrying.",
      );
      setUncertain(true);
    } finally {
      setBusy(false);
      setConfirmation(false);
    }
  }
  return (
    <section className="checkout-settings">
      <h2>Checkout availability</h2>
      <p>
        {saved?.enabled
          ? "Public ordering is open."
          : "Public ordering is closed."}{" "}
        Cash on delivery, Pakistan only.
      </p>
      {error && <p role="alert">{error}</p>}
      {saved && (
        <form onSubmit={save}>
          <fieldset disabled={busy || uncertain}>
            <label>
              Delivery charge (PKR)
              <input
                inputMode="decimal"
                required
                pattern="[0-9]+([.][0-9]{1,2})?"
                value={shipping}
                onChange={(e) => setShipping(e.target.value)}
              />
            </label>
            <label className="order-checkbox">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              Accept public orders
            </label>
            <p>
              Open ordering only after real products, stock, delivery
              arrangements and store policies are ready. Products must also be
              marked checkout-ready.
            </p>
            <button className="admin-primary" type="submit">
              {busy ? "Saving…" : "Save checkout settings"}
            </button>
          </fieldset>
        </form>
      )}
      <button
        type="button"
        className="order-link-button"
        disabled={busy}
        onClick={() => setReload((n) => n + 1)}
      >
        Reload checkout settings
      </button>
      <Dialog
        open={confirmation}
        onOpenChange={(open) => {
          if (!busy) setConfirmation(open);
        }}
      >
        <DialogContent>
          <DialogTitle>Accept public orders?</DialogTitle>
          <DialogDescription>
            This enables real cash on delivery orders for checkout-ready
            products, with PKR {shipping} delivery per order. Confirm
            fulfillment and store policies are ready.
          </DialogDescription>
          <div className="order-actions">
            <button
              className="admin-secondary"
              disabled={busy}
              onClick={() => setConfirmation(false)}
            >
              Keep closed
            </button>
            <button
              className="admin-primary"
              disabled={busy}
              onClick={() => save()}
            >
              {busy ? "Saving…" : "Open ordering"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
