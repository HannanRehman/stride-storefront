import type { Product } from "./catalog";
export function shoppingState(product: Product, orderingOpen = false) {
  if (product.testOnly)
    return {
      label: "Test order",
      description: "Simulated stock. No payment or delivery.",
      kind: "test" as const,
    };
  if (product.preview || !product.orderable)
    return {
      label: "Preview",
      description: "For browsing. Ordering is not available for this item.",
      kind: "preview" as const,
    };
  if (!product.sizes.some((size) => size.stock > 0))
    return {
      label: "Out of stock",
      description: "No sizes are currently available.",
      kind: "unavailable" as const,
    };
  if (!orderingOpen)
    return {
      label: "Preview",
      description: "Ordering has not opened for this item.",
      kind: "preview" as const,
    };
  return {
    label: "Available to order",
    description: "Subject to checkout availability and store confirmation.",
    kind: "available" as const,
  };
}
