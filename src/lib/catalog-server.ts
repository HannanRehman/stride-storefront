import "server-only";
import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import { products, type Product } from "@/lib/catalog";

// Public, read-only catalog. No service-role key is needed or accepted here.
export const getCatalog = cache(async (): Promise<Product[]> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url && !key) return products;
  if (!url || !key)
    throw new Error(
      "Supabase catalog requires both its URL and publishable key.",
    );
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client
    .from("catalog_products")
    .select(
      "id, slug, name, subtitle, audience, category, sport, collection, price_minor, compare_at_minor, image, color, color_hex, badge, sizes, description, featured_rank, published_at",
    )
    .eq("published", true)
    .order("featured_rank")
    .limit(200);
  if (error)
    throw new Error(`Unable to read the configured catalog: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle,
    audience: row.audience,
    category: row.category,
    sport: row.sport,
    collection: row.collection,
    price: row.price_minor,
    compareAt: row.compare_at_minor ?? undefined,
    image: row.image,
    color: row.color,
    colorHex: row.color_hex,
    badge: row.badge ?? undefined,
    sizes: row.sizes,
    description: row.description,
    rank: row.featured_rank,
    published: row.published_at,
  }));
});
