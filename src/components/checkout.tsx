"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/components/store-provider";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/utils";
import { notifyAccount } from "@/lib/account-events";
import type { OrderQuote, DeliveryAddress, CheckoutItem } from "@/lib/orders";

type Attempt = {
  customerId: string;
  requestId: string;
  items: CheckoutItem[];
  address: DeliveryAddress;
  quote: OrderQuote;
};
type SavedAddress = DeliveryAddress & { id: string; label: string };
const blank: DeliveryAddress = {
  recipient: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  province: "",
  postal_code: "",
  country: "PK",
};
export function Checkout() {
  const { user } = useStore();
  return <CheckoutSession key={user?.id || "guest"} />;
}
function CheckoutSession() {
  const { bag, user, ready, saving, syncError } = useStore();
  const signature = JSON.stringify(bag);
  const [quote, setQuote] = useState<OrderQuote | null>(null);
  const [quotedFor, setQuotedFor] = useState("");
  const [address, setAddress] = useState(blank);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<Attempt | null>(null);
  const [receipt, setReceipt] = useState("");
  const submitting = useRef(false);
  const key = `stride-checkout-pending:${user?.id || "guest"}`;
  useEffect(() => {
    if (!user) return;
    const c = new AbortController();
    fetch("/api/account/checkout-details", {
      cache: "no-store",
      signal: c.signal,
    })
      .then(async (r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!c.signal.aborted && data) {
          setAddresses(data.addresses || []);
          setAddress((a) => ({
            ...a,
            recipient: a.recipient || data.profile?.full_name || "",
            phone: a.phone || data.profile?.phone || "",
          }));
        }
      })
      .catch(() => {});
    return () => c.abort();
  }, [user]);
  useEffect(() => {
    if (!ready || !user) return;
    const controller = new AbortController();
    // Read before fetching a new quote: an uncertain submission must reuse its original request.
    Promise.resolve()
      .then(async () => {
        const stored = sessionStorage.getItem(key);
        if (stored) {
          const attempt = JSON.parse(stored) as Attempt;
          if (
            attempt.customerId !== user.id ||
            !attempt.requestId ||
            !attempt.quote ||
            !attempt.address ||
            !Array.isArray(attempt.items)
          )
            throw new Error(
              "Your saved checkout attempt could not load. Check your orders before starting again.",
            );
          if (!controller.signal.aborted) {
            setPending(attempt);
            setAddress(attempt.address);
          }
          return;
        }
        if (!bag.length) return;
        const response = await fetch("/api/checkout/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: JSON.parse(signature) }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) {
          setQuote(data.quote);
          setQuotedFor(signature);
          setError("");
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) {
          setQuote(null);
          setError(e.message || "Could not review your order. Try again.");
        }
      });
    return () => controller.abort();
  }, [ready, user, key, signature, reload, bag.length]);
  async function place(event?: FormEvent) {
    event?.preventDefault();
    if (
      submitting.current ||
      busy ||
      saving ||
      syncError ||
      !user ||
      (!pending && (!quote || quotedFor !== signature))
    )
      return;
    submitting.current = true;
    setBusy(true);
    setError("");
    const attempt = pending || {
      customerId: user.id,
      requestId: crypto.randomUUID(),
      items: JSON.parse(signature),
      address,
      quote: quote!,
    };
    try {
      // Persist the exact payload BEFORE sending. Retrying after a lost response never creates a second order.
      try {
        sessionStorage.setItem(key, JSON.stringify(attempt));
      } catch {
        throw new Error(
          "Allow session storage in your browser before placing an order. This attempt was not sent.",
        );
      }
      setPending(attempt);
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt),
      });
      const result = await response.json();
      if (!response.ok) {
        if (
          response.status < 500 &&
          ![401, 403].includes(response.status) &&
          result.code !== "request_changed"
        ) {
          sessionStorage.removeItem(key);
          setPending(null);
          setQuote(null);
          setReload((n) => n + 1);
        }
        throw new Error(result.error);
      }
      setReceipt(result.id);
      sessionStorage.removeItem(key);
      setPending(null);
      notifyAccount();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not confirm your order. Check your orders or retry this same attempt.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }
  if (receipt)
    return (
      <main id="main" className="checkout-page section">
        <div className="checkout-received">
          <h1>Order received.</h1>
          <p>
            Your cash on delivery order is awaiting confirmation from the store.
            No online payment was taken.
          </p>
          <Button asChild>
            <Link href={`/account/orders/${receipt}`}>View your order</Link>
          </Button>
          <p className="form-note">
            Purchased quantities have been removed from your saved bag. Any
            other selections are kept.
          </p>
        </div>
      </main>
    );
  const review = pending?.quote || (quotedFor === signature ? quote : null);
  return (
    <main id="main" className="checkout-page section">
      <Link href="/cart" className="checkout-back">
        Back to your bag
      </Link>
      <h1>Checkout</h1>
      <p className="checkout-intro">
        Delivered in Pakistan. Pay cash when your order arrives.
      </p>
      {!ready ? (
        <p role="status">Loading your bag…</p>
      ) : !user ? (
        <p>
          <Link href="/login?next=/checkout">Sign in to continue</Link>
        </p>
      ) : (
        <>
          {error && (
            <div className="checkout-message" role="alert">
              {error}
            </div>
          )}
          {syncError && (
            <p role="alert">Resolve the bag sync error before continuing.</p>
          )}
          {pending && (
            <div className="checkout-message">
              <h2>Check your last attempt</h2>
              <p>
                An order may already have been received. Retry below using the
                same request, or{" "}
                <Link href="/account/orders">check your orders</Link>. Your
                original address and total are kept for this attempt.
              </p>
            </div>
          )}
          {!bag.length && !pending ? (
            <p>
              Your bag is empty.{" "}
              <Link href="/shop/all">Explore the collection</Link>.
            </p>
          ) : (
            <div className="checkout-layout">
              <form onSubmit={place} className="checkout-form">
                <h2>Delivery details</h2>
                <fieldset disabled={busy || Boolean(pending)}>
                  {addresses.length > 0 && (
                    <label className="checkout-saved-address">
                      Use a saved address
                      <select
                        defaultValue=""
                        aria-label="Saved delivery address"
                        onChange={(e) => {
                          const saved = addresses.find(
                            (a) => a.id === e.target.value,
                          );
                          if (saved)
                            setAddress({
                              recipient: saved.recipient,
                              phone: saved.phone,
                              line1: saved.line1,
                              line2: saved.line2,
                              city: saved.city,
                              province: saved.province,
                              postal_code: saved.postal_code,
                              country: "PK",
                            });
                        }}
                      >
                        <option value="">Enter an address below</option>
                        {addresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label} · {a.city}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="checkout-fields">
                    <label className="checkout-wide">
                      Full name
                      <input
                        name="recipient"
                        autoComplete="shipping name"
                        required
                        maxLength={100}
                        value={address.recipient}
                        onChange={(e) =>
                          setAddress({ ...address, recipient: e.target.value })
                        }
                      />
                    </label>
                    <label className="checkout-wide">
                      Mobile number
                      <input
                        name="phone"
                        type="tel"
                        autoComplete="shipping tel"
                        inputMode="tel"
                        required
                        maxLength={30}
                        placeholder="03001234567"
                        value={address.phone}
                        onChange={(e) =>
                          setAddress({ ...address, phone: e.target.value })
                        }
                      />
                    </label>
                    <label className="checkout-wide">
                      Street address
                      <input
                        name="line1"
                        autoComplete="shipping address-line1"
                        required
                        maxLength={150}
                        value={address.line1}
                        onChange={(e) =>
                          setAddress({ ...address, line1: e.target.value })
                        }
                      />
                    </label>
                    <label className="checkout-wide">
                      Apartment, floor or landmark (optional)
                      <input
                        name="line2"
                        autoComplete="shipping address-line2"
                        maxLength={150}
                        value={address.line2}
                        onChange={(e) =>
                          setAddress({ ...address, line2: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      City
                      <input
                        name="city"
                        autoComplete="shipping address-level2"
                        required
                        maxLength={80}
                        value={address.city}
                        onChange={(e) =>
                          setAddress({ ...address, city: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Province or region
                      <input
                        name="province"
                        autoComplete="shipping address-level1"
                        required
                        maxLength={80}
                        value={address.province}
                        onChange={(e) =>
                          setAddress({ ...address, province: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Postal code (optional)
                      <input
                        name="postal_code"
                        autoComplete="shipping postal-code"
                        inputMode="numeric"
                        pattern="[0-9]{5}"
                        maxLength={5}
                        value={address.postal_code}
                        onChange={(e) =>
                          setAddress({
                            ...address,
                            postal_code: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Country
                      <input
                        value="Pakistan"
                        readOnly
                        autoComplete="shipping country-name"
                      />
                    </label>
                  </div>
                </fieldset>
                <div className="checkout-payment">
                  <h2>Cash on delivery</h2>
                  <p>
                    Pay the full order total to the courier on delivery. Your
                    order is subject to stock and store confirmation.
                  </p>
                </div>
                <p className="form-note">
                  By placing an order, you agree to our{" "}
                  <Link href="/terms">terms</Link> and{" "}
                  <Link href="/shipping-returns">
                    shipping and returns policy
                  </Link>
                  . See how we use delivery information in our{" "}
                  <Link href="/privacy">privacy policy</Link>.
                </p>
                <Button
                  type="submit"
                  disabled={busy || saving || Boolean(syncError) || !review}
                >
                  {busy
                    ? "Confirming order…"
                    : pending
                      ? "Retry the same order"
                      : "Place order · cash on delivery"}
                </Button>
              </form>
              <aside className="checkout-summary" aria-label="Order review">
                <h2>Your order</h2>
                {review ? (
                  <>
                    <ul>
                      {review.items.map((i) => (
                        <li key={`${i.productId}:${i.size}`}>
                          <div>
                            <strong>{i.name}</strong>
                            <p>
                              {i.color} / {i.size} · Qty {i.quantity}
                            </p>
                          </div>
                          <span>{money(i.line_minor, "PKR")}</span>
                        </li>
                      ))}
                    </ul>
                    <dl>
                      <div>
                        <dt>Subtotal</dt>
                        <dd>{money(review.subtotal_minor, "PKR")}</dd>
                      </div>
                      <div>
                        <dt>Delivery</dt>
                        <dd>{money(review.shipping_minor, "PKR")}</dd>
                      </div>
                      <div className="checkout-total">
                        <dt>Total to pay on delivery</dt>
                        <dd>{money(review.total_minor, "PKR")}</dd>
                      </div>
                    </dl>
                  </>
                ) : (
                  <>
                    <p>
                      {error
                        ? "Review is unavailable. Your bag has been kept."
                        : "Checking current prices and stock…"}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setReload((n) => n + 1)}
                    >
                      Review again
                    </Button>
                  </>
                )}
              </aside>
            </div>
          )}
        </>
      )}
    </main>
  );
}
