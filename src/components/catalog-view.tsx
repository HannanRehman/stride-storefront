"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import {
  filterProducts,
  parseFilters,
  type CatalogFilters,
  type Product,
} from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
type Props = {
  title: string;
  products: Product[];
  constraints?: CatalogFilters;
};
export function CatalogView({ title, products, constraints = {} }: Props) {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<URLSearchParams>(new URLSearchParams());
  const params = Object.fromEntries(search.entries());
  const filters = { ...parseFilters(params), ...constraints };
  const results = filterProducts(products, filters);
  const base = filterProducts(products, constraints);
  const pages = Math.max(1, Math.ceil(results.length / 12));
  const page = Math.min(filters.page || 1, pages);
  const visible = results.slice((page - 1) * 12, page * 12);
  const groups = [
    {
      key: "sport",
      title: "Sport",
      values: [...new Set(base.map((p) => p.sport))].map((v) => [v, v]),
    },
    {
      key: "color",
      title: "Color",
      values: [...new Set(base.flatMap((p) => p.color.split(" / ")))].map(
        (v) => [v, v],
      ),
    },
    {
      key: "price",
      title: "Shop by price (USD demos)",
      values: [
        ["0-50", "Under $50"],
        ["50-100", "$50–$100"],
        ["100-150", "$100–$150"],
        ["150-0", "$150 and up"],
      ],
    },
    {
      key: "size",
      title: "Size",
      values: [...new Set(base.flatMap((p) => p.sizes.map((s) => s.code)))].map(
        (v) => [v, v],
      ),
    },
  ];
  const activeFilters = ["sport", "color", "price", "size", "sale"].flatMap(
    (key) =>
      (search.get(key) || "")
        .split(",")
        .filter(Boolean)
        .map((value) => ({ key, value })),
  );
  function navigate(next: URLSearchParams) {
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }
  function setParam(key: string, value: string, temporary = false) {
    const next = new URLSearchParams(temporary ? draft : search);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    if (temporary) setDraft(next);
    else navigate(next);
  }
  function toggle(key: string, value: string, temporary = false) {
    const current =
      (temporary ? draft : search).get(key)?.split(",").filter(Boolean) || [];
    const values = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    setParam(key, values.join(","), temporary);
  }
  function clear(temporary = false) {
    const next = new URLSearchParams(temporary ? draft : search);
    ["sport", "color", "price", "size", "sale", "page"].forEach((k) =>
      next.delete(k),
    );
    if (temporary) setDraft(next);
    else navigate(next);
  }
  function facetPanel(temporary = false) {
    const selected = temporary ? draft : search;
    return (
      <>
        <div className="filter-panel-heading">
          <span>Filters</span>
          <button onClick={() => clear(temporary)}>Clear all</button>
        </div>
        {!constraints.sale && (
          <details open className="filter-group">
            <summary>
              Sale & offers
              <ChevronDown size={17} />
            </summary>
            <label className="filter-check">
              <input
                type="checkbox"
                checked={selected.get("sale") === "true"}
                onChange={() =>
                  setParam(
                    "sale",
                    selected.get("sale") === "true" ? "" : "true",
                    temporary,
                  )
                }
              />
              Sale
            </label>
          </details>
        )}
        {groups.map((group) => (
          <details
            key={group.key}
            className="filter-group"
            open={group.key !== "size"}
          >
            <summary>
              {group.title}
              <ChevronDown size={17} />
            </summary>
            <div
              className={
                group.key === "size" ? "size-filters" : "filter-options"
              }
            >
              {group.values.map(([value, label]) => (
                <label
                  key={value}
                  className={
                    group.key === "size" ? "size-filter" : "filter-check"
                  }
                >
                  <input
                    type="checkbox"
                    checked={(selected.get(group.key) || "")
                      .split(",")
                      .includes(value)}
                    onChange={() => toggle(group.key, value, temporary)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </details>
        ))}
      </>
    );
  }
  const draftResults = filterProducts(products, {
    ...parseFilters(Object.fromEntries(draft.entries())),
    ...constraints,
  });
  return (
    <div className="catalog section">
      <div className="catalog-heading">
        <h1>
          {title} <span>({results.length})</span>
        </h1>
        <div className="catalog-controls">
          <button
            className="desktop-filter-toggle"
            onClick={() => setHidden(!hidden)}
          >
            {hidden ? "Show" : "Hide"} filters
            <SlidersHorizontal size={20} />
          </button>
          <button
            className="mobile-filter-toggle"
            onClick={() => {
              setDraft(new URLSearchParams(search));
              setOpen(true);
            }}
          >
            Filter & sort
            <SlidersHorizontal size={19} />
          </button>
          <label className="sort-control">
            <span>Sort by</span>
            <select
              aria-label="Sort products"
              value={filters.sort || "featured"}
              onChange={(e) => setParam("sort", e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low–high</option>
              <option value="price-desc">Price: high–low</option>
              <option value="best">Best sellers</option>
            </select>
          </label>
        </div>
      </div>
      {base.some((product) => product.currency === "PKR") && (
        <p className="product-notice">
          The navy set is priced in PKR. Other demo prices are in USD. Price
          filters apply to USD items; price sorting groups currencies.
        </p>
      )}
      <div className="catalog-chips">
        {[...new Set(base.map((p) => p.sport))].map((sport) => (
          <button
            key={sport}
            aria-pressed={filters.sport?.includes(sport) || false}
            onClick={() => toggle("sport", sport)}
          >
            {sport}
          </button>
        ))}
      </div>
      {activeFilters.length > 0 && (
        <div className="active-filters">
          {activeFilters.map((f) => (
            <button
              key={`${f.key}:${f.value}`}
              onClick={() =>
                f.key === "sale" ? setParam("sale", "") : toggle(f.key, f.value)
              }
              aria-label={`Remove ${f.key} ${f.value} filter`}
            >
              {f.key === "sale" ? "Sale" : f.value}
              <X size={14} />
            </button>
          ))}
          <button className="clear-filters" onClick={() => clear()}>
            Clear all
          </button>
        </div>
      )}
      <p className="sr-only" role="status" aria-live="polite">
        {results.length} products found.
      </p>
      <div className={`catalog-body ${hidden ? "filters-hidden" : ""}`}>
        {!hidden && (
          <aside
            data-lenis-prevent
            className="filter-sidebar"
            aria-label="Product filters"
          >
            {facetPanel()}
          </aside>
        )}
        <div className="catalog-results">
          {visible.length ? (
            <>
              <div className="product-grid">
                {visible.map((p, index) => (
                  <ProductCard key={p.id} product={p} priority={index < 3} />
                ))}
              </div>
              <div className="pagination">
                <span>
                  Showing {(page - 1) * 12 + 1}–
                  {Math.min(page * 12, results.length)} of {results.length}
                </span>
                <div>
                  {Array.from({ length: pages }, (_, i) => (
                    <button
                      key={i}
                      aria-label={`Page ${i + 1}`}
                      aria-current={page === i + 1 ? "page" : undefined}
                      onClick={() => {
                        setParam("page", String(i + 1));
                        document.getElementById("main")?.scrollIntoView({
                          behavior: window.matchMedia(
                            "(prefers-reduced-motion: reduce)",
                          ).matches
                            ? "instant"
                            : "smooth",
                        });
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>A fresh start?</h2>
              <p>No products match these filters. Try clearing a selection.</p>
              <Button onClick={() => clear()}>Clear filters</Button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="filter-sheet">
          <DialogTitle>Filter & sort</DialogTitle>
          <DialogDescription>
            Find the right fit for your next move.
          </DialogDescription>
          <div className="filter-sheet-scroll">
            <label className="sheet-sort">
              Sort by
              <select
                value={draft.get("sort") || "featured"}
                onChange={(e) => setParam("sort", e.target.value, true)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: low–high</option>
                <option value="price-desc">Price: high–low</option>
                <option value="best">Best sellers</option>
              </select>
            </label>
            {facetPanel(true)}
          </div>
          <div className="filter-sheet-actions">
            <Button variant="outline" onClick={() => clear(true)}>
              Clear
            </Button>
            <Button
              onClick={() => {
                navigate(draft);
                setOpen(false);
              }}
            >
              Show {draftResults.length} results
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
