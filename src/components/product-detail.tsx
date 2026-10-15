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
  const {
    favorites,
    toggleFavorite,
    addToBag,
    notice,
    ready,
    saving,
    syncError,
  } = useStore();
  const [adding, setAdding] = useState(false);
  const [size, setSize] = useState("");
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const images = product.images?.length
    ? product.images
    : [
        {
          src: product.image,
          alt: `${product.name}, ${product.color}`,
          label: "Product",
        },
      ];
  const selectedImage = images[imageIndex] ?? images[0];
  const sizeGrid = useRef<HTMLDivElement>(null);
  const saved = favorites.includes(product.id);
  async function add() {
    if (adding) return;
    setAdded(false);
    if (!size) {
      setError("Choose an available size before adding to your bag.");
      sizeGrid.current?.focus();
      return;
    }
    setError("");
    setAdding(true);
    try {
      const result = await addToBag(product.id, size);
      if (result.ok) setAdded(true);
      else setError(result.message);
    } finally {
      setAdding(false);
    }
  }
  return (
    <div className="product-detail section">
      <div className="product-gallery">
        <Dialog>
          <DialogTrigger asChild>
            <button
              className={`gallery-main${product.preview ? " gallery-photo" : ""}`}
              aria-label={`Zoom ${product.name} image`}
            >
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
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
              {product.color} ·{" "}
              {product.preview
                ? "Retouched product photograph"
                : "Original product concept"}
            </DialogDescription>
            <div className="lightbox-image">
              <Image
                src={selectedImage.src}
                alt={`${selectedImage.alt}, enlarged`}
                fill
                sizes="90vw"
              />
            </div>
          </DialogContent>
        </Dialog>
        {images.length > 1 && (
          <div
            className="gallery-thumbnails"
            role="group"
            aria-label="Product photographs"
          >
            {images.map((photo, index) => (
              <button
                type="button"
                key={photo.src}
                aria-label={`View ${photo.label} photo`}
                aria-pressed={index === imageIndex}
                onClick={() => setImageIndex(index)}
              >
                <span className="gallery-thumbnail-image">
                  <Image src={photo.src} alt="" fill sizes="100px" />
                </span>
                <span>{photo.label}</span>
              </button>
            ))}
          </div>
        )}
        <p className="gallery-caption">
          {product.preview
            ? "Actual product photo with AI-retouched background and lighting."
            : "Original product concept. Imagery is illustrative."}
        </p>
      </div>
      <section className="product-info">
        <span className="product-badge">{product.badge}</span>
        <h1>{product.name}</h1>
        <p className="product-subtitle">{product.subtitle}</p>
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
        {product.preview && (
          <p className="product-notice">
            Temporary price for the complete set: one hoodie and one trouser.
          </p>
        )}
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
          <span id="size-heading">
            {product.preview ? "Planned sizes" : "Select size"}
          </span>
          {!product.preview && (
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
          )}
        </div>
        <div
          ref={sizeGrid}
          className={`size-selector${product.preview ? " size-preview" : ""}`}
          role="group"
          aria-labelledby="size-heading"
          aria-describedby={error ? "size-error" : undefined}
          tabIndex={-1}
        >
          {product.sizes.map((s) => (
            <button
              key={s.code}
              disabled={product.preview || !s.stock || adding}
              aria-label={`${s.code}${product.preview ? ", stock to be confirmed" : !s.stock ? ", unavailable" : ""}`}
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
          <Button
            onClick={add}
            disabled={
              product.preview ||
              !ready ||
              saving ||
              adding ||
              Boolean(syncError)
            }
            aria-busy={adding}
          >
            {product.preview
              ? "Availability coming soon"
              : adding
                ? "Adding…"
                : added
                  ? "Add another"
                  : "Add to bag"}
          </Button>
          {!product.preview && (
            <Button
              variant="outline"
              aria-pressed={saved}
              disabled={!ready || saving || Boolean(syncError)}
              onClick={() => toggleFavorite(product.id)}
            >
              {saved ? "Saved to favorites" : "Favorite"}
              <Heart size={18} fill={saved ? "currentColor" : "none"} />
            </Button>
          )}
        </div>
        {product.preview && (
          <p className="product-notice">
            Small, Medium, Large and Extra large. Stock quantities and fit
            measurements are being confirmed.
          </p>
        )}
        {!product.preview && (!ready || saving || syncError) && (
          <p className="product-notice" role="status">
            {syncError
              ? "Your bag could not sync. Use Retry syncing to reconnect."
              : !ready
                ? "Loading your bag…"
                : "Saving your changes…"}
          </p>
        )}
        {added && (
          <p className="product-notice" role="status">
            Added to your bag. <Link href="/cart">View bag</Link>
          </p>
        )}
        <p className="product-description">{product.description}</p>
        <p>
          {product.preview
            ? "Two-piece set"
            : `Style: ST-${String(product.rank + 1).padStart(4, "0")}`}{" "}
          · {product.color}
        </p>
        {[
          {
            title: "Product details",
            content: product.preview
              ? "Includes one navy pullover hoodie and one matching trouser. Drawstring hood, ribbed cuffs and hem, drawstring trouser waistband, and white printed detailing. Price is provisional. Stock and exact fit measurements have not yet been confirmed."
              : "This is an original Stride demo product concept. Color, materials and fit are illustrative. Availability shown here is sample catalog data; it does not represent stock from a live merchant.",
          },
          {
            title: "Material & care",
            content: product.preview
              ? "Fabric composition and weight have not yet been confirmed. Follow the garment's own care label for washing and drying instructions."
              : product.category === "shoes"
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
