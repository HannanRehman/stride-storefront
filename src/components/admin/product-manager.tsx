"use client";
import Link from "next/link";
import Image from "@/components/store-image";
import { useEffect, useState } from "react";
import { money } from "@/lib/utils";
import type { ProductRecord } from "@/lib/admin-products";
export function ProductManager() {
  const [query, setQuery] = useState({ q: "", status: "all", page: 1 });
  const [search, setSearch] = useState("");
  const [data, setData] = useState<{
    products: ProductRecord[];
    count: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  function changeQuery(next: typeof query) {
    setLoading(true);
    setError("");
    setQuery(next);
  }
  useEffect(() => {
    const controller = new AbortController();
    fetch(
      `/api/admin/products?${new URLSearchParams({ q: query.q, status: query.status, page: String(query.page) })}`,
      { cache: "no-store", signal: controller.signal },
    )
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        return result;
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setError(error.message || "Products could not load.");
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [query, retry]);
  return (
    <main id="main" className="admin-main">
      <header className="admin-page-heading">
        <div>
          <h1>Products</h1>
          <p>Build the collection, one piece at a time.</p>
        </div>
        <Link href="/admin/products/new" className="admin-primary">
          Add a product
        </Link>
      </header>
      <form
        className="admin-filters"
        onSubmit={(event) => {
          event.preventDefault();
          changeQuery({ ...query, q: search.trim(), page: 1 });
        }}
      >
        <label>
          Search products
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            maxLength={100}
            placeholder="Product name"
          />
        </label>
        <label>
          Status
          <select
            value={query.status}
            onChange={(event) =>
              changeQuery({ ...query, status: event.target.value, page: 1 })
            }
          >
            <option value="all">All products</option>
            <option value="draft">Drafts</option>
            <option value="published">Published</option>
          </select>
        </label>
        <button type="submit" className="admin-secondary">
          Search
        </button>
      </form>
      {loading ? (
        <p role="status">Loading products…</p>
      ) : error ? (
        <div role="alert" className="admin-message">
          {error}{" "}
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetry((value) => value + 1);
            }}
          >
            Retry
          </button>
        </div>
      ) : data?.products.length ? (
        <>
          <div className="admin-product-list">
            <div className="admin-list-head">
              <span>Product</span>
              <span>Status</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Manage</span>
            </div>
            {data.products.map((product) => (
              <article key={product.id} className="admin-product-row">
                <div className="admin-product-title">
                  <div className="admin-list-image">
                    <Image src={product.image} alt="" fill sizes="60px" />
                  </div>
                  <div>
                    <h2>
                      <Link href={`/admin/products/${product.id}`}>
                        {product.name}
                      </Link>
                    </h2>
                    <p>
                      {product.color} / {product.category}
                    </p>
                  </div>
                </div>
                <span
                  className={`admin-status ${product.published ? "is-published" : ""}`}
                >
                  {product.published ? "Published" : "Draft"}
                </span>
                <span>{money(product.price_minor, product.currency)}</span>
                <span>
                  {product.sizes.reduce((sum, size) => sum + size.stock, 0)}{" "}
                  units
                </span>
                <Link
                  className="admin-edit-link"
                  href={`/admin/products/${product.id}`}
                  aria-label={`Edit ${product.name}`}
                >
                  Edit product
                </Link>
              </article>
            ))}
          </div>
          <nav className="admin-pagination" aria-label="Product pages">
            <button
              disabled={query.page <= 1}
              onClick={() => changeQuery({ ...query, page: query.page - 1 })}
            >
              Previous
            </button>
            <span>
              Page {query.page} of {Math.max(1, Math.ceil(data.count / 20))}
            </span>
            <button
              disabled={query.page * 20 >= data.count}
              onClick={() => changeQuery({ ...query, page: query.page + 1 })}
            >
              Next
            </button>
          </nav>
        </>
      ) : (
        <section className="admin-empty">
          <h2>
            {query.q || query.status !== "all"
              ? "No matching products."
              : "Your collection starts here."}
          </h2>
          <p>
            {query.q || query.status !== "all"
              ? "Try another name or status."
              : "Add your first product as a private draft. You can fill in the details before publishing."}
          </p>
          <Link href="/admin/products/new">Add a product</Link>
        </section>
      )}
    </main>
  );
}
