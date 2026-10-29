import { describe, expect, it } from "vitest";
import { filterProducts, products } from "../../src/lib/catalog";
import {
  productPreviews,
  withProductPreviews,
} from "../../src/lib/product-previews";
import { money } from "../../src/lib/utils";

describe("merchandise previews", () => {
  it("shows the confirmed rupee price without implying confirmed stock", () => {
    const set = productPreviews.find(
      (product) => product.id === "navy-hoodie-trouser-set",
    )!;
    expect(money(set.price, set.currency)).toBe("PKR 12,000");
    expect(set.sizes.map((size) => size.code)).toEqual(["S", "M", "L", "XL"]);
    expect(set.sizes.every((size) => size.stock === 0)).toBe(true);
    expect(set.preview).toBe(true);
  });

  it("includes every replacement preview with either catalog source and never duplicates it", () => {
    const catalog = withProductPreviews(products);
    expect(withProductPreviews(catalog)).toEqual(catalog);
    expect(productPreviews).toHaveLength(13);
    expect(
      filterProducts(catalog, { q: "Navy Hoodie", category: "clothing" }).map(
        (product) => product.id,
      ),
    ).toEqual(["navy-hoodie", "navy-hoodie-trouser-set"]);
    expect(
      filterProducts(catalog, { size: ["M"] }).filter((product) => product.preview),
    ).toEqual([]);
  });

  it("keeps rupee previews out of dollar price ranges and sorts currencies separately", () => {
    const catalog = withProductPreviews(products);
    expect(filterProducts(catalog, { price: ["150-0"] })).not.toContain(
      productPreviews.find((product) => product.id === "navy-hoodie")!,
    );
    const sorted = filterProducts(catalog, { sort: "price-asc" });
    const previewPrices = sorted
      .filter((product) => product.preview)
      .map((product) => product.price);
    expect(previewPrices).toEqual([...previewPrices].sort((a, b) => a - b));
    expect(money(12800)).toBe("$128");
  });
});
