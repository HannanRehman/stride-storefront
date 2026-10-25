import type { Product } from "@/lib/catalog";
export function bagTotals(
  bag: { productId: string; quantity: number }[],
  catalog: Product[],
) {
  const totals: Partial<Record<"USD" | "PKR", number>> = {};
  for (const item of bag) {
    const product = catalog.find((product) => product.id === item.productId);
    if (!product) continue;
    const currency = product.currency ?? "USD";
    totals[currency] = (totals[currency] ?? 0) + product.price * item.quantity;
  }
  return Object.entries(totals) as ["USD" | "PKR", number][];
}
