import { existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { products } from "../src/lib/catalog";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key)
  throw new Error("Set the Supabase URL and publishable key first.");
if (!key.startsWith("sb_publishable_"))
  throw new Error("Use a modern publishable key for this verification.");
const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const { data, count, error } = await client
  .from("catalog_products")
  .select("id, slug, price_minor, compare_at_minor, sizes, published", {
    count: "exact",
  })
  .order("featured_rank");
if (error) throw new Error(`Public catalog query failed: ${error.message}`);
if (!data || count !== products.length)
  throw new Error(`Expected ${products.length} products; received ${count}.`);
for (const product of products) {
  const remote = data.find((row) => row.id === product.id);
  if (
    !remote ||
    remote.slug !== product.slug ||
    remote.price_minor !== product.price ||
    (remote.compare_at_minor ?? undefined) !== product.compareAt ||
    !remote.published
  ) {
    throw new Error(`Remote catalog does not match ${product.slug}.`);
  }
  if (JSON.stringify(remote.sizes) !== JSON.stringify(product.sizes))
    throw new Error(`Sizes do not match ${product.slug}.`);
}
console.log(
  `Verified ${count} products through the public Data API at ${new URL(url).hostname}.`,
);
console.log(
  "Prices and size availability match the local catalog; no account or privileged key was used.",
);
