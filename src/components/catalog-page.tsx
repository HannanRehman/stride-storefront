import { Suspense } from "react";
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
          <div className="catalog-loading section">
            Loading your next favorites…
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
