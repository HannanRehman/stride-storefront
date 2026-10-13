"use client";
import Image from "@/components/store-image";
import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown, Heart, Maximize2 } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SizeGuide } from "@/components/size-guide";
import { money } from "@/lib/utils";
import type { Product } from "@/lib/catalog";
export function ProductDetail({ product }: { product: Product }) {
  const { favorites, toggleFavorite, addToBag, notice } = useStore();
  const [size, setSize] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const sizeGrid = useRef<HTMLDivElement>(null);
  const saved = favorites.includes(product.id);
  function add() {
    if (!size) {
      setError("Choose an available size before adding to your bag.");
      sizeGrid.current?.focus();
      return;
    }
    const ok = addToBag(product.id, size);
    if (ok) {
      setAdded(true);
      setError("");
    } else
      setError(
        "Your bag already contains the available quantity for this size.",
      );
  }
  return (
    <div className="product-detail section">
      <div className="product-gallery">
        <Dialog>
          <DialogTrigger asChild>
            <button
              className="gallery-main"
              aria-label={`Zoom ${product.name} image`}
            >
              <Image
                src={product.image}
                alt={`${product.name}, ${product.color}, original product concept`}
                fill
                preload
                sizes="(max-width: 639px) 100vw, 58vw"
              />
              <span className="gallery-zoom icon-button">
                <Maximize2 size={20} />
              </span>
            </button>
          </DialogTrigger>
          <DialogContent className="lightbox-content">
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {product.color} · Original product concept
            </DialogDescription>
            <div className="lightbox-image">
              <Image
                src={product.image}
                alt={`${product.name} enlarged`}
                fill
                sizes="90vw"
              />
            </div>
          </DialogContent>
        </Dialog>
        <p className="gallery-caption">
          Original product concept. Imagery is illustrative.
        </p>
      </div>
      <section className="product-info">
        <span className="product-badge">{product.badge}</span>
        <h1>{product.name}</h1>
        <p className="product-subtitle">{product.subtitle}</p>
        <div className="product-price">
          <span>{money(product.price)}</span>
          {product.compareAt && (
            <>
              <del>{money(product.compareAt)}</del>
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
        <div className="color-choice">
          <p>Color shown: {product.color}</p>
          <div className="color-thumb">
            <Image
              src={product.image}
              alt={`${product.color} colorway`}
              fill
              sizes="68px"
            />
          </div>
        </div>
        <div className="size-heading">
          <span id="size-heading">Select size</span>
          <Dialog>
            <DialogTrigger asChild>
              <button>Size guide</button>
            </DialogTrigger>
            <DialogContent>
              <DialogTitle>Find your fit</DialogTitle>
              <DialogDescription>
                Measurement guidance for {product.subtitle.toLowerCase()}.
              </DialogDescription>
              <SizeGuide
                category={product.category}
                audience={product.audience}
              />
            </DialogContent>
          </Dialog>
        </div>
        <div
          ref={sizeGrid}
          className="size-selector"
          role="group"
          aria-labelledby="size-heading"
          aria-describedby={error ? "size-error" : undefined}
          tabIndex={-1}
        >
          {product.sizes.map((s) => (
            <button
              key={s.code}
              disabled={!s.stock}
              aria-label={`${s.code}${!s.stock ? ", unavailable" : ""}`}
              aria-pressed={size === s.code}
              onClick={() => {
                setSize(s.code);
                setError("");
                setAdded(false);
              }}
            >
              {s.code}
            </button>
          ))}
        </div>
        {error && (
          <p className="inline-error" id="size-error" role="alert">
            {error}
          </p>
        )}
        <div className="purchase-actions">
          <Button onClick={add}>{added ? "Add another" : "Add to bag"}</Button>
          <Button
            variant="outline"
            aria-pressed={saved}
            onClick={() => toggleFavorite(product.id)}
          >
            {saved ? "Saved to favorites" : "Favorite"}
            <Heart size={18} fill={saved ? "currentColor" : "none"} />
          </Button>
        </div>
        {added && (
          <p className="product-notice" role="status">
            Added to your bag. <Link href="/cart">View bag</Link>
          </p>
        )}
        <p className="product-description">{product.description}</p>
        <p>
          Style: ST-{String(product.rank + 1).padStart(4, "0")} ·{" "}
          {product.color}
        </p>
        {[
          {
            title: "Product details",
            content:
              "This is an original Stride demo product concept. Color, materials and fit are illustrative. Availability shown here is sample catalog data; it does not represent stock from a live merchant.",
          },
          {
            title: "Material & care",
            content:
              product.category === "shoes"
                ? "Concept upper: textile or suede panels. Concept sole: rubber. For actual footwear, follow the care label, brush away dry dirt and avoid machine washing unless approved by the manufacturer."
                : product.category === "clothing"
                  ? "Concept fabric: cotton blend. Always follow the final garment's care label. Wash with similar colors and avoid high heat where instructed."
                  : "Concept fabric: woven nylon. Follow the final care instructions. Spot-clean gently and air-dry.",
          },
          {
            title: "Shipping & returns",
            content:
              "This public storefront saves a bag for browsing. It does not currently accept orders, collect payment, or ship products. No delivery or returns commitment is made.",
          },
          {
            title: "Reviews",
            content:
              "No customer reviews yet. We do not publish fictional customer endorsements for these demo concepts.",
          },
        ].map((section) => (
          <details className="product-accordion" key={section.title}>
            <summary>
              {section.title}
              <ChevronDown size={18} />
            </summary>
            <p>{section.content}</p>
          </details>
        ))}
        <span className="sr-only">{notice}</span>
      </section>
    </div>
  );
}
