"use client";
import Link from "next/link";
import Image from "@/components/store-image";
import { Heart } from "lucide-react";
import { useStore } from "@/components/store-provider";
import type { Product } from "@/lib/catalog";
import { money } from "@/lib/utils";
import { shoppingState } from "@/lib/shopping-state";
export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { favorites, toggleFavorite, ready, saving, syncError, orderingOpen } =
    useStore();
  const saved = favorites.includes(product.id);
  return (
    <article className="product-card">
      <div
        className={`product-card-media${product.preview || product.images?.length ? " product-photo" : ""}`}
      >
        <Link
          href={`/product/${product.slug}`}
          aria-label={`View ${product.name}, ${product.subtitle}`}
        >
          <Image
            src={product.image}
            alt={`${product.name} in ${product.color}`}
            fill
            sizes="(max-width: 639px) 48vw, (max-width: 1023px) 45vw, 30vw"
            loading={priority ? "eager" : "lazy"}
            quality={70}
          />
        </Link>
        {!product.preview && (
          <button
            className="product-favorite icon-button"
            aria-label={`${saved ? "Remove" : "Save"} ${product.name} ${saved ? "from" : "to"} favorites`}
            aria-pressed={saved}
            disabled={!ready || saving || Boolean(syncError)}
            onClick={() => toggleFavorite(product.id)}
          >
            <Heart size={20} fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <Link href={`/product/${product.slug}`} className="product-card-info">
        <span className="shopping-state">
          {shoppingState(product, orderingOpen).label}
        </span>
        {product.badge && (
          <span
            className={
              product.compareAt ? "product-badge sale" : "product-badge"
            }
          >
            {product.badge}
          </span>
        )}
        <h3>{product.name}</h3>
        <p>{product.subtitle}</p>
        <p className="product-color">{product.color}</p>
        <div className="product-price">
          <span>{money(product.price, product.currency)}</span>
          {product.compareAt && (
            <>
              <del>{money(product.compareAt, product.currency)}</del>
              <span className="sale">
                {Math.round(
                  ((product.compareAt - product.price) / product.compareAt) *
                    100,
                )}
                % off
              </span>
            </>
          )}
        </div>
      </Link>
    </article>
  );
}
