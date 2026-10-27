import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { products, type Product } from "@/lib/catalog";
import { withProductPreviews } from "@/lib/product-previews";
import { recordToProduct, type ProductRecord } from "@/lib/admin-products";

// Public, read-only catalog. No service-role key is needed or accepted here.
export const getCatalog = cache(async (): Promise<Product[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return withProductPreviews(products);
  if (!url || !key)
    throw new Error(
      "Supabase catalog requires both its URL and publishable key.",
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) =>
        fetch(input, {
          ...init,
          next: {
            revalidate: process.env.NODE_ENV === "production" ? 60 : 0,
            tags: ["public-catalog"],
          },
        }),
    },
  });
  const catalog: Product[] = [];
  for (let offset = 0; ; offset += 200) {
    // Select existing columns as well as optional migration fields, so the
    // storefront still works while owner-dashboard activation is pending.
    const { data, error } = await client
      .from("catalog_products")
      .select("*")
      .eq("published", true)
      .order("featured_rank")
      .order("id")
      .range(offset, offset + 199);
    if (error)
      throw new Error(
        `Unable to read the configured catalog: ${error.message}`,
      );
    catalog.push(
      ...(data ?? []).map((row) => recordToProduct(row as ProductRecord)),
    );
    if ((data?.length ?? 0) < 200) break;
  }
  return withProductPreviews(catalog);
});
