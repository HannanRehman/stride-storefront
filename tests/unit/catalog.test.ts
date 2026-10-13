import { describe, expect, it } from "vitest";
import { filterProducts, parseFilters, products } from "../../src/lib/catalog";
import { money } from "../../src/lib/utils";
describe("public catalog rules", () => {
  it("has unique original slugs and valid money/availability", () => {
    expect(products.length).toBeGreaterThanOrEqual(36);
    expect(new Set(products.map((p) => p.slug)).size).toBe(products.length);
    for (const p of products) {
      expect(Number.isInteger(p.price)).toBe(true);
      expect(p.price, p.slug).toBeGreaterThanOrEqual(0);
      expect(
        p.sizes.every((s) => s.stock >= 0 && Number.isInteger(s.stock)),
      ).toBe(true);
      if (p.compareAt) expect(p.compareAt).toBeGreaterThan(p.price);
    }
  });
  it("ANDs groups while ORing sport selections", () => {
    const results = filterProducts(products, {
      audience: "men",
      category: "shoes",
      sport: ["Running", "Basketball"],
      size: ["10"],
      color: ["Chalk"],
      sale: true,
    });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every(
        (p) =>
          p.audience === "men" &&
          p.category === "shoes" &&
          ["Running", "Basketball"].includes(p.sport) &&
          p.color.includes("Chalk") &&
          !!p.compareAt &&
          p.sizes.some((s) => s.code === "10" && s.stock > 0),
      ),
    ).toBe(true);
  });
  it("does not match unavailable sizes", () => {
    expect(
      filterProducts(products, {
        audience: "men",
        category: "shoes",
        size: ["6.5"],
      }),
    ).toHaveLength(0);
  });
  it("respects adjacent exclusive price boundaries", () => {
    const low = filterProducts(products, { price: ["0-100"] });
    const high = filterProducts(products, { price: ["100-150"] });
    expect(low.every((p) => p.price < 10000)).toBe(true);
    expect(high.every((p) => p.price >= 10000 && p.price < 15000)).toBe(true);
    expect(low.some((p) => high.includes(p))).toBe(false);
  });
  it("sorts consistently and normalizes search case", () => {
    const results = filterProducts(products, { sort: "price-asc", q: "PACE" });
    expect(results.length).toBeGreaterThan(0);
    expect(
      results.every((p, i) => i === 0 || p.price >= results[i - 1].price),
    ).toBe(true);
    expect(filterProducts(products, { q: "pace" })).toEqual(
      filterProducts(products, { q: "PACE" }),
    );
  });
  it("caps unsafe query values", () => {
    const f = parseFilters({
      page: "-3",
      sort: "injection",
      audience: "invalid",
      q: "x".repeat(200),
    });
    expect(f.page).toBe(1);
    expect(f.sort).toBe("featured");
    expect(f.audience).toBeUndefined();
    expect(f.q?.length).toBe(100);
  });
  it("formats minor currency units", () => {
    expect(money(12800)).toBe("$128");
    expect(money(8997)).toBe("$89.97");
  });
});
