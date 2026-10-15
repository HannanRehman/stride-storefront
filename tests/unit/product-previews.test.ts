import { describe, expect, it } from "vitest";
import { filterProducts, products } from "../../src/lib/catalog";
import {
  productPreviews,
  withProductPreviews,
} from "../../src/lib/product-previews";
import { money } from "../../src/lib/utils";

describe("merchandise previews", () => {
  it("shows the confirmed rupee price without implying confirmed stock", () => {
    const set = productPreviews[0];
    expect(money(set.price, set.currency)).toBe("PKR 7,000");
    expect(set.sizes.map((size) => size.code)).toEqual(["S", "M", "L", "XL"]);
    expect(set.sizes.every((size) => size.stock === 0)).toBe(true);
    expect(set.preview).toBe(true);
  });

  it("includes one preview with either catalog source and never duplicates it", () => {
    const catalog = withProductPreviews(products);
    expect(withProductPreviews(catalog)).toEqual(catalog);
    expect(
      filterProducts(catalog, { q: "Navy Hoodie", category: "clothing" }),
    ).toEqual(productPreviews);
    expect(filterProducts(catalog, { size: ["M"] })).not.toContain(
      productPreviews[0],
    );
  });

  it("keeps rupee previews out of dollar price ranges and sorts currencies separately", () => {
    const catalog = withProductPreviews(products);
    expect(filterProducts(catalog, { price: ["150-0"] })).not.toContain(
      productPreviews[0],
    );
    expect(filterProducts(catalog, { sort: "price-asc" })[0]).toEqual(
      productPreviews[0],
    );
    expect(money(12800)).toBe("$128");
  });
});
