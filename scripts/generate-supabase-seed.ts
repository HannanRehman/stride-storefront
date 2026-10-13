import { writeFileSync } from "node:fs";
import { products } from "../src/lib/catalog";
for (const product of products) {
  if (!Number.isSafeInteger(product.price) || product.price < 0) {
    throw new Error(`Invalid price for ${product.slug}.`);
  }
  if (
    product.compareAt !== undefined &&
    (!Number.isSafeInteger(product.compareAt) ||
      product.compareAt <= product.price)
  ) {
    throw new Error(`Invalid sale price for ${product.slug}.`);
  }
}
const quote = (value: string) => "'" + value.replaceAll("'", "''") + "'";
const rows = products.map(
  (p) =>
    `(${[p.id, p.slug, p.name, p.subtitle, p.audience, p.category, p.sport, p.collection].map(quote).join(", ")}, ${p.price}, ${p.compareAt ?? "null"}, ${[p.image, p.color, p.colorHex].map(quote).join(", ")}, ${p.badge ? quote(p.badge) : "null"}, ${quote(JSON.stringify(p.sizes))}::jsonb, ${quote(p.description)}, ${p.rank}, ${quote(p.published)}, true)`,
);
const columns =
  "id, slug, name, subtitle, audience, category, sport, collection, price_minor, compare_at_minor, image, color, color_hex, badge, sizes, description, featured_rank, published_at, published";
writeFileSync(
  "supabase/seed.sql",
  `-- Original Stride presentation catalog. Idempotent seed, no deletion.\ninsert into public.catalog_products (${columns}) values\n${rows.join(",\n")}\non conflict (id) do update set ${columns
    .split(", ")
    .filter((c) => c !== "id")
    .map((c) => `${c} = excluded.${c}`)
    .join(", ")};\n`,
);
console.log(`Prepared ${products.length} original public catalog entries.`);
