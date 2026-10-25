"use client";
import Link from "next/link";
import Image from "@/components/store-image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ProductRecord } from "@/lib/admin-products";
type Form = {
  name: string;
  slug: string;
  subtitle: string;
  audience: string;
  category: string;
  sport: string;
  collection: string;
  price: string;
  compareAt: string;
  currency: string;
  color: string;
  colorHex: string;
  badge: string;
  description: string;
  rank: number;
  sizes: { code: string; stock: number }[];
  images: { src: string; alt: string; label: string }[];
};
const blank: Form = {
  name: "",
  slug: "",
  subtitle: "",
  audience: "unisex",
  category: "clothing",
  sport: "Lifestyle",
  collection: "everyday",
  price: "",
  compareAt: "",
  currency: "PKR",
  color: "",
  colorHex: "#17283b",
  badge: "",
  description: "",
  rank: 0,
  sizes: ["S", "M", "L", "XL"].map((code) => ({ code, stock: 0 })),
  images: [],
};
function toForm(product: ProductRecord): Form {
  return {
    name: product.name,
    slug: product.slug,
    subtitle: product.subtitle,
    audience: product.audience,
    category: product.category,
    sport: product.sport,
    collection: product.collection,
    price: (product.price_minor / 100).toFixed(2),
    compareAt:
      product.compare_at_minor === null
        ? ""
        : (product.compare_at_minor / 100).toFixed(2),
    currency: product.currency,
    color: product.color,
    colorHex: product.color_hex,
    badge: product.badge || "",
    description: product.description,
    rank: product.featured_rank,
    sizes: product.sizes,
    images: product.images?.length
      ? product.images
      : [{ src: product.image, alt: product.name, label: "Product" }],
  };
}
export function ProductEditor({ id }: { id?: string }) {
  const router = useRouter();
  const [form, setForm] = useState<Form>(blank);
  const [record, setRecord] = useState<ProductRecord | null>(null);
  const [baseline, setBaseline] = useState(JSON.stringify(blank));
  const [loading, setLoading] = useState(Boolean(id));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const [reload, setReload] = useState(0);
  const [confirmation, setConfirmation] = useState<
    "publish" | "live" | "unpublish" | null
  >(null);
  const dirty = JSON.stringify(form) !== baseline;
  useEffect(() => {
    if (!id) return;
    const controller = new AbortController();
    fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        return result.product as ProductRecord;
      })
      .then((product) => {
        if (controller.signal.aborted) return;
        const values = toForm(product);
        setRecord(product);
        setForm(values);
        setBaseline(JSON.stringify(values));
        setUncertain(false);
        setLoading(false);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(error.message || "Product could not load.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [id, reload]);
  useEffect(() => {
    if (!dirty && !uploading && !busy) return;
    function unload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    function navigate(event: MouseEvent) {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      )
        return;
      const link = (event.target as Element).closest?.("a");
      if (
        !link ||
        link.target === "_blank" ||
        link.getAttribute("href")?.startsWith("#")
      )
        return;
      if (
        busy ||
        uploading ||
        !window.confirm("Leave this product and discard unsaved edits?")
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", navigate, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", navigate, true);
    };
  }, [dirty, uploading, busy]);
  function field<K extends keyof Form>(name: K, value: Form[K]) {
    setForm((current) => ({ ...current, [name]: value }));
    setMessage("");
  }
  async function save(published: boolean) {
    if (busy || uploading || uncertain) return;
    setBusy(true);
    setError("");
    setMessage("");
    setConfirmation(null);
    let responseReceived = false;
    try {
      const response = await fetch("/api/admin/products", {
        method: record ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          published,
          ...(record ? { id: record.id, updatedAt: record.updated_at } : {}),
        }),
      });
      const result = await response.json();
      responseReceived = true;
      if (!response.ok) {
        if (
          response.status >= 500 ||
          (response.status === 409 && record) ||
          response.status === 401 ||
          response.status === 403
        )
          setUncertain(true);
        throw new Error(result.error);
      }
      const saved = result.product as ProductRecord;
      const values = toForm(saved);
      setRecord(saved);
      setForm(values);
      setBaseline(JSON.stringify(values));
      setMessage(
        saved.published
          ? "Product published. Your storefront will refresh on its next visit."
          : "Draft saved. It is private to the owner.",
      );
      if (!id) router.replace(`/admin/products/${saved.id}`);
    } catch (error) {
      if (!responseReceived) setUncertain(true);
      setError(
        responseReceived && error instanceof Error
          ? error.message
          : "Could not confirm the save. Check your saved products before retrying; your edits are still here.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    if (form.images.length + files.length > 6) {
      setError("Use up to six photos per product.");
      return;
    }
    setUploading(true);
    setError("");
    setMessage("");
    try {
      for (const file of Array.from(files)) {
        if (file.size > 4 * 1024 * 1024)
          throw new Error("Each photo must be 4 MB or smaller.");
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/uploads", {
          method: "POST",
          body,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        setForm((current) => ({
          ...current,
          images: [
            ...current.images,
            {
              src: result.src,
              alt: `${current.name || "Product"}, photo ${current.images.length + 1}`,
              label: `Photo ${current.images.length + 1}`,
            },
          ],
        }));
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "The upload failed. Your edits are still here.",
      );
    } finally {
      setUploading(false);
    }
  }
  function reloadSaved() {
    if (
      dirty &&
      !window.confirm(
        "Reload the saved product? Unsaved edits will be discarded.",
      )
    )
      return;
    setLoading(true);
    setError("");
    setReload((value) => value + 1);
  }
  if (loading)
    return (
      <main id="main" className="admin-main">
        <p role="status">Loading product…</p>
      </main>
    );
  if (id && !record)
    return (
      <main id="main" className="admin-main">
        <h1>Product unavailable</h1>
        <p role="alert">{error}</p>
        <button
          onClick={() => {
            setLoading(true);
            setError("");
            setReload((value) => value + 1);
          }}
        >
          Retry loading
        </button>
      </main>
    );
  return (
    <main id="main" className="admin-main">
      <header className="admin-page-heading">
        <div>
          <Link href="/admin/products" className="admin-back">
            All products
          </Link>
          <h1>{record ? form.name || "Edit product" : "Add a product"}</h1>
          <p>
            {record?.published ? "Published" : "Private draft"}
            {dirty ? " / Unsaved edits" : ""}
          </p>
        </div>
        {record && (
          <Link
            href={`/admin/preview/${record.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="admin-secondary"
          >
            Preview saved product
          </Link>
        )}
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (record?.published) setConfirmation("live");
          else void save(false);
        }}
      >
        {error && (
          <p className="admin-message" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="admin-message is-success" role="status">
            {message}
          </p>
        )}
        {uncertain && (
          <div className="admin-message">
            <p>
              Reload the saved product before another attempt. Your edits are
              still visible here; copy any changes you want to keep.
            </p>
            {record ? (
              <button type="button" onClick={reloadSaved}>
                Reload saved product
              </button>
            ) : (
              <Link href="/admin/products" target="_blank">
                Check products before creating again
              </Link>
            )}
          </div>
        )}
        <fieldset disabled={busy || uploading}>
          <legend className="sr-only">Product details</legend>
          <div className="admin-editor-grid">
            <div>
              <section className="admin-editor-section">
                <h2>The essentials</h2>
                <label>
                  Product name
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => field("name", event.target.value)}
                  />
                </label>
                <label>
                  URL slug
                  <input
                    required
                    maxLength={100}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    readOnly={record?.ever_published}
                    value={form.slug}
                    onChange={(event) => field("slug", event.target.value)}
                  />
                  <small>
                    {record?.ever_published
                      ? "Locked to keep existing product links working."
                      : "For example: navy-hoodie-trouser-set"}
                  </small>
                </label>
                <label>
                  Subtitle
                  <input
                    required
                    maxLength={160}
                    value={form.subtitle}
                    onChange={(event) => field("subtitle", event.target.value)}
                  />
                </label>
                <label>
                  Description
                  <textarea
                    required
                    maxLength={4000}
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      field("description", event.target.value)
                    }
                  />
                </label>
              </section>
              <section className="admin-editor-section">
                <h2>Photography</h2>
                <p>
                  The first photo is the main image. Upload JPEG, PNG or WebP,
                  up to 4 MB each. Photos are optimized automatically. Uploaded
                  image URLs are public, including for drafts.
                </p>
                <label className="admin-upload">
                  Add photos
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={form.images.length >= 6}
                    onChange={(event) => {
                      void upload(event.target.files);
                      event.target.value = "";
                    }}
                  />
                </label>
                <div className="admin-photo-list">
                  {form.images.map((photo, index) => (
                    <div key={photo.src} className="admin-photo-row">
                      <div className="admin-editor-image">
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          fill
                          sizes="90px"
                        />
                      </div>
                      <div>
                        <label>
                          Photo {index + 1} description
                          <input
                            required
                            maxLength={200}
                            value={photo.alt}
                            onChange={(event) =>
                              field(
                                "images",
                                form.images.map((value, i) =>
                                  i === index
                                    ? { ...value, alt: event.target.value }
                                    : value,
                                ),
                              )
                            }
                          />
                        </label>
                        <label>
                          Photo {index + 1} label
                          <input
                            required
                            maxLength={40}
                            value={photo.label}
                            onChange={(event) =>
                              field(
                                "images",
                                form.images.map((value, i) =>
                                  i === index
                                    ? { ...value, label: event.target.value }
                                    : value,
                                ),
                              )
                            }
                          />
                        </label>
                        <div className="admin-inline-actions">
                          {index > 0 ? (
                            <button
                              type="button"
                              onClick={() =>
                                field("images", [
                                  photo,
                                  ...form.images.filter((_, i) => i !== index),
                                ])
                              }
                            >
                              Make primary
                            </button>
                          ) : (
                            <span>Primary photo</span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              field(
                                "images",
                                form.images.filter((_, i) => i !== index),
                              )
                            }
                          >
                            Remove photo {index + 1}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-editor-section">
                <h2>Sizes and stock</h2>
                <p>
                  Enter confirmed quantities only. Leave stock at zero until you
                  know what is available. Stock is not reserved until checkout
                  is implemented.
                </p>
                {form.sizes.map((size, index) => (
                  <div className="admin-size-row" key={index}>
                    <label>
                      Size {index + 1}
                      <input
                        required
                        maxLength={16}
                        value={size.code}
                        onChange={(event) =>
                          field(
                            "sizes",
                            form.sizes.map((value, i) =>
                              i === index
                                ? { ...value, code: event.target.value }
                                : value,
                            ),
                          )
                        }
                      />
                    </label>
                    <label>
                      Stock {index + 1}
                      <input
                        type="number"
                        required
                        min={0}
                        max={100}
                        step={1}
                        value={size.stock}
                        onChange={(event) =>
                          field(
                            "sizes",
                            form.sizes.map((value, i) =>
                              i === index
                                ? {
                                    ...value,
                                    stock: Number(event.target.value),
                                  }
                                : value,
                            ),
                          )
                        }
                      />
                    </label>
                    <button
                      type="button"
                      disabled={form.sizes.length <= 1}
                      onClick={() =>
                        field(
                          "sizes",
                          form.sizes.filter((_, i) => i !== index),
                        )
                      }
                    >
                      Remove size {index + 1}
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="admin-secondary"
                  disabled={form.sizes.length >= 24}
                  onClick={() =>
                    field("sizes", [...form.sizes, { code: "", stock: 0 }])
                  }
                >
                  Add size
                </button>
              </section>
            </div>
            <div>
              <section className="admin-editor-section">
                <h2>Pricing</h2>
                <label>
                  Currency
                  <select
                    value={form.currency}
                    onChange={(event) => field("currency", event.target.value)}
                  >
                    <option value="PKR">PKR — Pakistani rupees</option>
                    <option value="USD">USD — US dollars</option>
                  </select>
                </label>
                <label>
                  Selling price
                  <input
                    required
                    inputMode="decimal"
                    value={form.price}
                    onChange={(event) => field("price", event.target.value)}
                  />
                </label>
                <label>
                  Comparison price (optional)
                  <input
                    inputMode="decimal"
                    value={form.compareAt}
                    onChange={(event) => field("compareAt", event.target.value)}
                  />
                </label>
              </section>
              <section className="admin-editor-section">
                <h2>Organization</h2>
                <label>
                  Audience
                  <select
                    value={form.audience}
                    onChange={(event) => field("audience", event.target.value)}
                  >
                    {["unisex", "men", "women", "kids"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={form.category}
                    onChange={(event) => field("category", event.target.value)}
                  >
                    {["clothing", "shoes", "accessories"].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Movement
                  <input
                    required
                    maxLength={80}
                    value={form.sport}
                    onChange={(event) => field("sport", event.target.value)}
                  />
                </label>
                <label>
                  Collection
                  <input
                    required
                    maxLength={80}
                    value={form.collection}
                    onChange={(event) =>
                      field("collection", event.target.value)
                    }
                  />
                  <small>
                    Use an existing collection: everyday, pace, court or motion.
                  </small>
                </label>
                <label>
                  Color name
                  <input
                    required
                    maxLength={80}
                    value={form.color}
                    onChange={(event) => field("color", event.target.value)}
                  />
                </label>
                <label>
                  Color hex
                  <input
                    required
                    pattern="#[0-9a-fA-F]{6}"
                    value={form.colorHex}
                    onChange={(event) => field("colorHex", event.target.value)}
                  />
                </label>
                <label>
                  Badge (optional)
                  <input
                    maxLength={40}
                    value={form.badge}
                    onChange={(event) => field("badge", event.target.value)}
                  />
                </label>
                <label>
                  Display rank
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    step={1}
                    value={form.rank}
                    onChange={(event) =>
                      field("rank", Number(event.target.value))
                    }
                  />
                  <small>Lower numbers appear first.</small>
                </label>
              </section>
            </div>
          </div>
        </fieldset>
        <div className="admin-save-bar">
          <span role="status">
            {uploading
              ? "Uploading photos…"
              : busy
                ? "Saving product…"
                : dirty
                  ? "Unsaved edits"
                  : "Saved details"}
          </span>
          <div>
            <button
              type="submit"
              className="admin-primary"
              disabled={busy || uploading || uncertain}
            >
              {record?.published ? "Save live changes" : "Save draft"}
            </button>
            {record && (
              <button
                type="button"
                className="admin-secondary"
                disabled={busy || uploading || uncertain}
                onClick={() =>
                  setConfirmation(record.published ? "unpublish" : "publish")
                }
              >
                {record.published ? "Unpublish product" : "Publish product"}
              </button>
            )}
          </div>
        </div>
      </form>
      <Dialog
        open={confirmation !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmation(null);
        }}
      >
        <DialogContent>
          <DialogTitle>
            {confirmation === "unpublish"
              ? "Unpublish product?"
              : confirmation === "live"
                ? "Save changes to the live product?"
                : "Publish product?"}
          </DialogTitle>
          <DialogDescription>
            {confirmation === "unpublish"
              ? "This saves your current edits and removes the product from public browsing. Existing saved references are retained."
              : "This saves your current edits and makes the product visible on the storefront. Purchasing remains unavailable until checkout is built."}
          </DialogDescription>
          <div className="admin-confirm-actions">
            <button
              className="admin-secondary"
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </button>
            <button
              className="admin-primary"
              onClick={() => void save(confirmation !== "unpublish")}
            >
              Confirm{" "}
              {confirmation === "unpublish"
                ? "unpublish"
                : confirmation === "live"
                  ? "live changes"
                  : "publish"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
