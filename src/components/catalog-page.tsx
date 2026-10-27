import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { CatalogView } from "@/components/catalog-view";
import { getCatalog } from "@/lib/catalog-server";
import type { CatalogFilters } from "@/lib/catalog";
export async function CatalogPage({
  title,
  constraints = {},
  children,
}: {
  title: string;
  constraints?: CatalogFilters;
  children?: React.ReactNode;
}) {
  // Search-param filters should arrive as useful HTML, including on /new.
  // Request rendering avoids replacing a tiny static fallback with the grid.
  await connection();
  const products = await getCatalog();
  return (
    <main id="main">
      <div className="breadcrumbs section">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{title}</span>
      </div>
      {children}
      <Suspense
        fallback={
          <div
            className="catalog-loading section"
            role="status"
            aria-label="Loading products"
          >
            <div className="catalog-skeleton-heading" />
            <div className="product-grid" aria-hidden="true">
              {Array.from({ length: 6 }, (_, i) => (
                <div className="catalog-skeleton-card" key={i} />
              ))}
            </div>
            <span className="sr-only">Loading your next favorites…</span>
          </div>
        }
      >
        <CatalogView
          title={title}
          products={products}
          constraints={constraints}
        />
      </Suspense>
    </main>
  );
}
