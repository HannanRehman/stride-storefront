import { describe, expect, it } from "vitest";
import {
  minorUnits,
  productInput,
  allowedImage,
} from "../../src/lib/admin-products";
import { bagTotals } from "../../src/lib/bag-totals";
import { products } from "../../src/lib/catalog";
import { safeNext } from "../../src/lib/account-validation";
const project = "https://store.supabase.co";
const valid = {
  name: "Navy set",
  slug: "navy-set",
  subtitle: "Hoodie and trouser",
  audience: "unisex",
  category: "clothing",
  sport: "Lifestyle",
  collection: "everyday",
  price: "7000",
  compareAt: "",
  currency: "PKR",
  color: "Navy",
  colorHex: "#17283b",
  badge: "",
  description: "A matching two-piece set.",
  rank: 0,
  published: false,
  sizes: [{ code: "M", stock: 2 }],
  images: [{ src: "/images/tee.webp", alt: "Navy garment", label: "Front" }],
};
describe("owner product boundaries", () => {
  it("keeps products ineligible by default and requires positive PKR prices for checkout", () => {
    expect(productInput(valid, project).orderable).toBe(false);
    expect(productInput({ ...valid, orderable: true }, project).orderable).toBe(
      true,
    );
    expect(() =>
      productInput({ ...valid, orderable: true, currency: "USD" }, project),
    ).toThrow(/PKR/);
    expect(() =>
      productInput({ ...valid, orderable: true, price: "0" }, project),
    ).toThrow(/PKR/);
  });
  it("converts prices exactly and rejects invalid monetary values", () => {
    expect(minorUnits("7000")).toBe(700000);
    expect(minorUnits("0.29")).toBe(29);
    for (const value of ["-1", "1e3", "1.001", "NaN", "", "99999999", 7000])
      expect(() => minorUnits(value)).toThrow();
  });
  it("whitelists editable fields and validates stock, collections and comparison pricing", () => {
    expect(
      productInput(
        { ...valid, user_id: "attacker", ever_published: false },
        project,
      ),
    ).not.toHaveProperty("user_id");
    expect(productInput(valid, project).price_minor).toBe(700000);
    for (const fields of [
      { sizes: [{ code: "M", stock: -1 }] },
      {
        sizes: [
          { code: "M", stock: 2 },
          { code: "m", stock: 3 },
        ],
      },
      { compareAt: "1" },
      { currency: "EUR" },
      { collection: "missing" },
      { slug: "../bad" },
      { images: [] },
    ])
      expect(() => productInput({ ...valid, ...fields }, project)).toThrow();
  });
  it("restricts photos to this store's local files or public storage path", () => {
    expect(
      allowedImage(
        `${project}/storage/v1/object/public/catalog-media/owner/photo.webp`,
        project,
      ),
    ).toContain("catalog-media");
    for (const src of [
      "https://evil.example/photo.webp",
      "/images/../private.jpg",
      "data:image/png;base64,abc",
      `${project}/storage/v1/object/public/other/photo.webp`,
      `${project}/storage/v1/object/public/catalog-media/owner/photo.webp?x=1`,
    ])
      expect(() => allowedImage(src, project)).toThrow();
  });
  it("keeps safe admin return URLs local", () => {
    expect(safeNext("/admin/products/new")).toBe("/admin/products/new");
    expect(safeNext("/administrator")).toBe("/account");
    expect(safeNext("/admin\\evil.example")).toBe("/account");
  });
  it("never combines rupee and dollar bag totals", () => {
    const usd = products[0];
    const pkr = {
      ...usd,
      id: "pkr-set",
      currency: "PKR" as const,
      price: 700000,
    };
    expect(
      bagTotals(
        [
          { productId: usd.id, quantity: 2 },
          { productId: pkr.id, quantity: 1 },
        ],
        [usd, pkr],
      ),
    ).toEqual([
      ["USD", usd.price * 2],
      ["PKR", 700000],
    ]);
  });
});
