"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
export function FavoritesView() {
  const { favorites, catalog, ready } = useStore();
  const saved = catalog.filter((p) => favorites.includes(p.id));
  return (
    <main id="main" className="favorites-page section">
      <h1>
        Favorites {ready && saved.length > 0 && <span>({saved.length})</span>}
      </h1>
      {!ready ? (
        <p role="status">Loading favorites…</p>
      ) : saved.length ? (
        <>
          <p className="product-notice">
            Saved on this device. Open a product to choose your size and add it
            to your bag.
          </p>
          <div className="product-grid">
            {saved.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Heart size={40} style={{ margin: "0 auto 22px" }} />
          <h2>A place for your favorites.</h2>
          <p>Tap the heart on anything you like. Find it all right here.</p>
          <Button asChild>
            <Link href="/shop/all">Find your favorites</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
