import { describe, expect, it } from "vitest";
import {
  checkoutItems,
  deliveryAddress,
  uuid,
  orderTransitions,
} from "../../src/lib/orders";
describe("checkout input", () => {
  const address = {
    recipient: " Test Customer ",
    phone: "+92 300 1234567",
    line1: "Test Street",
    line2: "",
    city: "Lahore",
    province: "Punjab",
    country: "PK",
    postal_code: "54000",
  };
  it("normalizes Pakistani phones and limits delivery to Pakistan", () => {
    expect(deliveryAddress(address)).toMatchObject({
      recipient: "Test Customer",
      phone: "03001234567",
    });
    expect(() => deliveryAddress({ ...address, country: "US" })).toThrow();
    expect(() => deliveryAddress({ ...address, phone: "1234567" })).toThrow();
    expect(() => deliveryAddress({ ...address, postal_code: "123" })).toThrow();
  });
  it("bounds quantities and rejects duplicate sizes without trusting prices", () => {
    expect(
      checkoutItems([{ productId: "p", size: "M", quantity: 2, price: 1 }]),
    ).toEqual([{ productId: "p", size: "M", quantity: 2 }]);
    for (const quantity of [0, -1, 1.5, 11, "1"])
      expect(() =>
        checkoutItems([{ productId: "p", size: "M", quantity }]),
      ).toThrow();
    expect(() =>
      checkoutItems(Array(2).fill({ productId: "p", size: "M", quantity: 1 })),
    ).toThrow();
    expect(() => checkoutItems([])).toThrow();
    expect(() =>
      checkoutItems(Array(21).fill({ productId: "p", size: "M", quantity: 1 })),
    ).toThrow();
  });
  it("validates request identifiers and terminal fulfillment states", () => {
    expect(uuid("c0d00000-0000-4000-8000-000000000001")).toContain("c0d");
    expect(() => uuid("not-an-id")).toThrow();
    expect(orderTransitions.shipped).toEqual(["delivered"]);
    expect(orderTransitions.cancelled).toEqual([]);
  });
});
