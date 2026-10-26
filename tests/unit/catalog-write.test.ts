import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import type { SupabaseClient } from "@supabase/supabase-js";
import { catalogWrite } from "../../src/lib/catalog-write";
function fixture() {
  const results = [
    {
      data: null,
      error: {
        code: "PGRST204",
        message: "Could not find the 'orderable' column",
      },
    },
    { data: { id: "test" }, error: null },
  ];
  const chain = {
    insert: vi.fn((input: Record<string, unknown>) => {
      void input;
      return chain;
    }),
    update: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    select: vi.fn(() => chain),
    single: vi.fn(async () => results.shift()),
    maybeSingle: vi.fn(async () => results.shift()),
  };
  return { client: { from: () => chain } as unknown as SupabaseClient, chain };
}
describe("staged schema compatibility", () => {
  it("keeps legacy product writes working only when checkout eligibility stays false", async () => {
    const { client, chain } = fixture();
    const result = await catalogWrite(client, {
      id: "test",
      name: "Test",
      orderable: false,
    });
    expect(result.data?.id).toBe("test");
    expect(chain.insert).toHaveBeenCalledTimes(2);
    expect(chain.insert.mock.calls[1][0]).not.toHaveProperty("orderable");
    expect(chain.insert.mock.calls[1][0]).toHaveProperty("id", "test");
  });
  it("never removes an explicit request to enable ordering", async () => {
    const { client, chain } = fixture();
    await expect(
      catalogWrite(client, { id: "test", orderable: true }),
    ).rejects.toThrow("Activate the checkout database");
    expect(chain.insert).toHaveBeenCalledTimes(1);
  });
});
