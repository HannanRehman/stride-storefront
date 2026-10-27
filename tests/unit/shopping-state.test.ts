import { describe, expect, it } from "vitest";
import { products } from "../../src/lib/catalog";
import { shoppingState } from "../../src/lib/shopping-state";
describe("shopping states", () => {
  it("distinguishes test, preview, sold-out and orderable merchandise", () => {
    const p = products[0];
    expect(shoppingState({ ...p, testOnly: true, orderable: true }).kind).toBe(
      "test",
    );
    expect(shoppingState({ ...p, preview: true, orderable: false }).kind).toBe(
      "preview",
    );
    expect(shoppingState({ ...p, orderable: false }).kind).toBe("preview");
    expect(
      shoppingState({ ...p, orderable: true, sizes: [{ code: "M", stock: 0 }] })
        .kind,
    ).toBe("unavailable");
    expect(
      shoppingState(
        { ...p, orderable: true, sizes: [{ code: "M", stock: 1 }] },
        true,
      ).kind,
    ).toBe("available");
    expect(
      shoppingState(
        { ...p, orderable: true, sizes: [{ code: "M", stock: 1 }] },
        false,
      ).kind,
    ).toBe("preview");
  });
});
