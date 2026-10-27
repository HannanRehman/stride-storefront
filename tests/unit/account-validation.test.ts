import { describe, expect, it } from "vitest";
import {
  addressFields,
  emailField,
  passwordField,
  safeNext,
  safeAdminNext,
} from "../../src/lib/account-validation";
describe("account input boundaries", () => {
  it("keeps return URLs on allowed local pages", () => {
    for (const path of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "/account\nLocation:bad",
      "/shop/all",
      undefined,
    ])
      expect(safeNext(path)).toBe("/account");
    expect(safeNext("/favorites")).toBe("/favorites");
    expect(safeNext("/account/addresses")).toBe("/account/addresses");
    expect(safeAdminNext("/admin/orders?status=pending")).toBe(
      "/admin/orders?status=pending",
    );
    for (const path of [
      "https://evil.example",
      "//evil.example",
      "/account",
      "/auth/verify",
      "/administrator",
      "/admin/../account",
      "/admin/%2e%2e/account",
      "/admin/%2f%2fevil.example",
      undefined,
    ])
      expect(safeAdminNext(path)).toBe("/admin");
  });
  it("validates email and password without altering passwords", () => {
    expect(emailField(" User@Example.com ")).toBe("user@example.com");
    expect(() => emailField("invalid")).toThrow();
    expect(() => passwordField("short")).toThrow();
    expect(passwordField(" long password ")).toBe(" long password ");
  });
  it("validates address fields and country codes", () => {
    const address = {
      label: "Home",
      recipient: "Test Customer",
      phone: "+92 300 1234567",
      line1: "Demo address",
      city: "Lahore",
      province: "Punjab",
      country: "pk",
    };
    expect(addressFields(address).country).toBe("PK");
    expect(() => addressFields({ ...address, phone: "bad phone" })).toThrow();
    expect(() => addressFields({ ...address, city: "" })).toThrow();
    expect(() => addressFields({ ...address, country: "Pakistan" })).toThrow();
  });
});
