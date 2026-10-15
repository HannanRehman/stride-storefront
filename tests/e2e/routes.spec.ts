import { expect, test } from "@playwright/test";

test("all sitemap pages render and their internal links resolve", async ({
  request,
}) => {
  test.setTimeout(180000);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const paths = [...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => new URL(match[1]).pathname,
  );
  expect(paths).toContain("/product/navy-hoodie-trouser-set");
  const linkedPaths = new Set<string>();
  for (let offset = 0; offset < paths.length; offset += 4) {
    await Promise.all(
      paths.slice(offset, offset + 4).map(async (path) => {
        const response = await request.get(path);
        expect(response.status(), path).toBe(200);
        const html = await response.text();
        expect(html, path).toContain("<main");
        expect(html.match(/<h1(?:\s|>)/g), path).toHaveLength(1);
        for (const match of html.matchAll(/href="(\/[^"\s]*)"/g)) {
          if (match[1].startsWith("//")) continue;
          linkedPaths.add(
            new URL(match[1].replaceAll("&amp;", "&"), "http://localhost")
              .pathname,
          );
        }
      }),
    );
  }
  const extraPaths = [...linkedPaths].filter(
    (path) =>
      !paths.includes(path) &&
      !path.startsWith("/_next/") &&
      !path.startsWith("/images/") &&
      !/\.[a-z0-9]+$/i.test(path),
  );
  for (const path of extraPaths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(await response.text(), path).toContain("<main");
  }
});
