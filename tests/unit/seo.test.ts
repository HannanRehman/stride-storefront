import { expect, it } from "vitest";
import { serializeStructuredData, siteBase } from "../../src/lib/seo";
it("escapes script closing tags without changing parsed product content", () => {
  const value = {
    name: '</script><script>alert("x")</script>',
    description: "A < B",
  };
  const serialized = serializeStructuredData(value);
  expect(serialized).not.toContain("<");
  expect(serialized).toContain("\\u003c");
  expect(JSON.parse(serialized)).toEqual(value);
});
it("normalizes the canonical origin so sitemap routes never gain double slashes", () => {
  expect(siteBase("https://store.example.invalid/")).toBe(
    "https://store.example.invalid",
  );
});
