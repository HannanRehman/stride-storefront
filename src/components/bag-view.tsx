"use client";
import Link from "next/link";
import Image from "@/components/store-image";
import { Heart, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/utils";
import { bagTotals } from "@/lib/bag-totals";
export function BagView() {
  const {
    bag,
    catalog,
    ready,
    saving,
    syncError,
    user,
    updateQuantity,
    removeItem,
    moveToFavorites,
  } = useStore();
  const totals = bagTotals(bag, catalog);
  return (
    <main id="main" className="bag-page section">
      <h1>Your bag</h1>
      {saving && (
        <p className="product-notice" role="status">
          Saving your changes…
        </p>
      )}
      {!ready ? (
        <p role="status">Loading your bag…</p>
      ) : bag.length ? (
        <div className="bag-layout">
          <div>
            {bag.map((item) => {
              const p = catalog.find((p) => p.id === item.productId)!;
              const stock = p.sizes.find((s) => s.code === item.size)!.stock;
              return (
                <article className="bag-line" key={`${p.id}:${item.size}`}>
                  <Link href={`/product/${p.slug}`} className="bag-line-image">
                    <Image
                      src={p.image}
                      alt={`${p.name}, ${p.color}`}
                      fill
                      sizes="145px"
                    />
                  </Link>
                  <div className="bag-line-info">
                    <div className="bag-line-title">
                      <h2>
                        <Link href={`/product/${p.slug}`}>{p.name}</Link>
                      </h2>
                      <span>{money(p.price * item.quantity, p.currency)}</span>
                    </div>
                    <p>{p.subtitle}</p>
                    <p>{p.color}</p>
                    <p>Size: {item.size}</p>
                    <div className="bag-line-bottom">
                      <div className="bag-quantity">
                        <button
                          aria-label={`Decrease ${p.name} quantity`}
                          disabled={
                            item.quantity === 1 || saving || Boolean(syncError)
                          }
                          onClick={() =>
                            updateQuantity(p.id, item.size, item.quantity - 1)
                          }
                        >
                          <Minus size={14} />
                        </button>
                        <span aria-label={`Quantity ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          aria-label={`Increase ${p.name} quantity`}
                          disabled={
                            item.quantity >= stock ||
                            saving ||
                            Boolean(syncError)
                          }
                          onClick={() =>
                            updateQuantity(p.id, item.size, item.quantity + 1)
                          }
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="bag-line-buttons">
                        <button
                          className="icon-button"
                          aria-label={`Move ${p.name} to favorites`}
                          disabled={saving || Boolean(syncError)}
                          onClick={() => moveToFavorites(p.id, item.size)}
                        >
                          <Heart size={19} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Remove ${p.name} from bag`}
                          disabled={saving || Boolean(syncError)}
                          onClick={() => removeItem(p.id, item.size)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <aside className="bag-summary">
            <h2>Summary</h2>
            <div>
              <span>Subtotal</span>
              <span>
                {totals.map(([currency, subtotal]) => (
                  <span className="bag-currency-total" key={currency}>
                    {money(subtotal, currency)}
                  </span>
                ))}
              </span>
            </div>
            <div>
              <span>Shipping</span>
              <span>Not available</span>
            </div>
            <div className="bag-total">
              <span>Bag subtotal</span>
              <span>
                {totals.map(([currency, subtotal]) => (
                  <span className="bag-currency-total" key={currency}>
                    {money(subtotal, currency)}
                  </span>
                ))}
              </span>
            </div>
            {totals.length > 1 && (
              <p>
                Totals are shown separately for each currency. No currency
                conversion is applied.
              </p>
            )}
            <p>
              {user
                ? "Your bag is saved to your account and syncs across devices."
                : "Your bag is saved on this device."}{" "}
              This is a public demo storefront; purchasing, payments, and
              shipping are not available yet.
            </p>
            <Button asChild>
              <Link href="/shop/all">Continue exploring</Link>
            </Button>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <ShoppingBag size={40} style={{ margin: "0 auto 22px" }} />
          <h2>Good things are ahead.</h2>
          <p>Your bag is empty. Find something that moves you.</p>
          <Button asChild>
            <Link href="/shop/all">Explore Stride</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
